# P1-01 — Semantic translation memory (pgvector)

**Phase:** 1 · **Priority:** High · **Status:** Backlog

## Goal

Find similar (not only identical) source strings and reuse translations — reduce LLM cost 30–80% beyond exact hash TM.

## Current state

- Exact hash TM in Postgres: `TranslationMemoryService`, hash = `sourceLang:targetLang:sourceText`
- Hash does **not** include `glossary_version` or `prompt_version` (invalidation gap)
- No Redis hot layer; no embeddings; no shared tenant cache

## Proposed fit

| Layer | Change |
|-------|--------|
| **Infra** | Enable `pgvector` extension in Postgres (Docker Compose + migrations doc) |
| **Schema** | `translation_memory_embeddings` or extend `translation_memory` with `embedding vector(1536)`, `promptVersion`, `glossaryVersion` |
| **Module** | Extend `translation` module — `SemanticMemoryService` |
| **Pipeline** | In `TranslateTextService`: exact hash → vector similarity (threshold e.g. 0.92) → LLM |
| **Queue** | Optional `translation.embed` job to backfill embeddings async (avoid blocking HTTP) |
| **Analytics** | Extend `usage-analytics`: cache hit rate exact vs semantic |

### Hash v2 (exact layer)

Include in hash input (align with raw.md):

```text
sha256(text + source + target + glossaryVersion + promptVersion)
```

Requires P2-01 for `promptVersion` or use constant `v1` until then.

## Dependencies

- None for pgvector MVP
- P2-01 recommended before prompt-aware invalidation

## Acceptance criteria

- [ ] Migration adds pgvector + embedding column
- [ ] Similar source (e.g. "Log in" vs "Login") can reuse translation above threshold
- [ ] Unit tests for similarity gate; integration test with mocked embedding provider
- [ ] ADR: `0009-semantic-translation-memory.md`
- [ ] Metrics: `memory_hit_exact`, `memory_hit_semantic` in analytics API

## Out of scope (later)

- Premium shared cross-tenant cache → [P3-10](./P3-10-shared-cache-premium.md)
