# P3-02 — Semantic diff (reuse translation)

**Phase:** 3 · **Priority:** High · **Status:** Backlog

## Goal

Source changed slightly ("Login" → "Sign in") — reuse existing translation if semantic similarity ≥ threshold; skip full re-translate.

## Current state

- Any sourceText change triggers new translation on next job
- Levenshtein in `similarity.utils.ts` for quality scoring only

## Proposed fit

| Layer | Change |
|-------|--------|
| **Depends on** | P1-01 pgvector or embedding API |
| **Service** | `SourceChangeAnalyzer` in `translation` module |
| **Job runner** | Before LLM: if key.sourceText changed, compare to previous snapshot embedding |
| **Threshold** | e.g. 92% semantic similarity → copy translation, mark `needs_review` |
| **UI** | Show "reused from similar source" badge on approval row |

## Dependencies

- P1-01 semantic memory infrastructure

## Acceptance criteria

- [ ] "Login" → "Sign in" reuses DE translation with review flag
- [ ] "Login" → "Register" does not reuse
- [ ] Unit tests with fixed embeddings mock

## Overlap with raw.md

Item #4 — AI Diff.
