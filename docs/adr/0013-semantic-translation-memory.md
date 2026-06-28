# ADR 0013: Semantic translation memory (pgvector)

## Status

Accepted

## Context

Exact hash translation memory reuses only identical source strings. Similar phrases
("Log in" vs "Login") still invoke LLM calls. Product backlog P1-01 requires semantic
reuse with measurable cache hit rates in analytics.

## Decision

1. **Storage:** Extend `translation_memory` with optional `embedding vector(768)` and
   `embedded_at`. Use pgvector cosine distance (`<=>`) for similarity search scoped by
   `tenant_id`, `source_language`, and `target_language`.

2. **Pipeline order** in `TranslateTextService`:
   - exact hash lookup
   - embed source text once (if semantic memory enabled)
   - pgvector similarity search (threshold default `0.92`)
   - LLM translate + store translation with embedding

3. **Embeddings:** `EmbeddingRegistryService` with OpenAI `text-embedding-3-small`
   (`dimensions=768`) primary and Ollama `nomic-embed-text` fallback for local dev.

4. **Hit logging:** New `translation_memory_hits` table with `exact` / `semantic`
   types; exposed via `GET /analytics/cache/summary` and Prometheus `memory_hits_total`.

5. **Backfill:** `translation.embed` BullMQ queue embeds rows missing vectors without
   blocking the hot path when embedding fails synchronously.

6. **Hash v2 deferred:** Keep existing `sha256(sourceLang:targetLang:sourceText)` until
   P2-01 prompt versioning enables glossary/prompt-aware invalidation.

## Consequences

- Docker/CI Postgres must use `pgvector/pgvector:pg16` and `CREATE EXTENSION vector`.
- Semantic hits require populated embeddings; new TM rows embed on first LLM store.
- Embedding API adds latency on cache-miss path; exact hits remain zero-latency.
- Vector dimension is fixed at 768 for OpenAI/Ollama interoperability.

## Alternatives considered

- Redis hot layer — deferred; Postgres + pgvector sufficient for MVP.
- Separate embeddings table — rejected; same row simplifies upsert/forget.
- 1536-dim OpenAI default — rejected; Ollama fallback requires aligned dimensions.
