# ADR 0012: Auto glossary suggestions

## Status

Accepted

## Context

Manual glossary CRUD (ADR 0005) works but teams with large corpora must guess which terms to add. Product backlog P1-03 asks for ranked suggestions mined from existing translations, with human approve/reject before terms enter the live glossary.

## Decision

Extend the `glossary` module with:

1. **`GlossarySuggestion` model** — `projectId`, `sourceTerm`, optional `targetTerm`, `doNotTranslate`, `confidence`, `reason`, `status` (`pending` | `approved` | `rejected`).
2. **Heuristic miner** (`glossary-suggestion.utils.ts`) — no LLM in v1:
   - Identical source/target across languages → do-not-translate
   - Stable preferred pairs (same target for a source token)
   - Product codes (regex)
   - Capitalized tokens with high frequency
   - `mergeSuggestionCandidates()` dedupes and ranks by confidence
3. **Async analyze** — `POST .../glossary/suggestions/analyze` validates ≥ `GLOSSARY_ANALYZE_MIN_TRANSLATIONS` (default 100), enqueues `glossary.analyze` on BullMQ; worker replaces pending suggestions for the project.
4. **Review API** — list pending, approve (upserts `GlossaryTerm`), reject.
5. **Frontend** — Glossary tab: **Suggest terms** button, pending suggestions table with approve/reject.

Approved terms flow through existing `GlossaryService.getTermsForProject()` into translation jobs — no change to the translation pipeline.

## Config

| Variable | Default | Purpose |
|----------|---------|---------|
| `GLOSSARY_ANALYZE_MIN_TRANSLATIONS` | 100 | Minimum corpus size to run analyze |
| `GLOSSARY_ANALYZE_MAX_SUGGESTIONS` | 50 | Cap suggestions stored per run |

## Consequences

- Re-running analyze clears prior **pending** suggestions for the project; approved/rejected history is kept.
- LLM-based extraction is deferred; heuristics may miss nuanced terminology.
- Worker must be running for analyze jobs to complete (same as export queue).

## Related

- ADR 0005 — manual glossary
- P1-03 backlog — acceptance criteria
