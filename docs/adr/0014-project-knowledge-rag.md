# ADR 0014: Project knowledge RAG

## Status

Accepted

## Context

Semantic translation memory (ADR 0013) reuses past translations but cannot inject
uploaded brand guides, product docs, or terminology notes. Teams need document import
with chunked embeddings and retrieval-augmented prompts during translation.

## Decision

1. **Schema:** `project_knowledge_sources` stores raw content and ingest status;
   `project_knowledge_chunks` stores overlapping chunks (~250 chars, 50 overlap) with
   JSON metadata and `vector(768)` embeddings.

2. **Ingest:** `POST .../knowledge/sources` (JSON) or `POST .../upload` (`.txt`/`.md`)
   enqueues `knowledge.ingest`. Worker chunks text, embeds each chunk, marks source `ready`.

3. **Retrieval:** After semantic TM miss and before LLM, `RagRetrievalService` queries
   pgvector scoped by `project_id`, top-K (default 3), min similarity 0.75, max 1500 chars
   injected into the system prompt via `formatKnowledgePrompt`.

4. **Reuse:** Same `EmbeddingRegistryService` as semantic TM (768d OpenAI/Ollama).

## Config

| Variable | Default | Purpose |
|----------|---------|---------|
| `KNOWLEDGE_CHUNK_SIZE` | 250 | Target chunk size (200–300) |
| `KNOWLEDGE_CHUNK_OVERLAP` | 50 | Overlap between consecutive chunks |
| `PROJECT_RAG_ENABLED` | true | Enable retrieval in translate pipeline |
| `PROJECT_RAG_TOP_K` | 3 | Max chunks retrieved |
| `PROJECT_RAG_MIN_SIMILARITY` | 0.75 | Similarity gate |
| `PROJECT_RAG_MAX_CHARS` | 1500 | Total injected context cap |

## Consequences

- Worker must run for ingest jobs (same as glossary analyze / embed backfill).
- Large uploads increase embedding cost at ingest time, not per translation lookup.
- PDF/DOCX parsing deferred; MVP is text/markdown only.

## Related

- ADR 0013 — semantic translation memory
- P2-04 brand voice — can reuse this corpus layer later
