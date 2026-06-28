# P1-03 — Auto glossary builder

**Phase:** 1 · **Priority:** Medium · **Status:** Shipped (ADR 0012)

## Goal

AI proposes glossary terms from existing translations; human approves — reduces manual glossary setup.

## Current state

- Manual CRUD: `glossary` module, terms injected via `formatGlossaryPrompt`
- No mining, import, or suggestion workflow

## Proposed fit

| Layer | Change |
|-------|--------|
| **Module** | Extend `glossary` — `GlossarySuggestionService` |
| **Schema** | `glossary_suggestions` (projectId, sourceTerm, targetTerm?, confidence, status: pending/approved/rejected) |
| **Queue** | `glossary.analyze` — scan N translations, LLM extract do-not-translate + preferred pairs |
| **Commands** | `AnalyzeGlossaryCommand`, `ApproveGlossarySuggestionCommand` |
| **Frontend** | Glossary page → "Suggest terms" + review table |

### Heuristics before LLM

- Terms identical in source/target across languages
- Brand names, product codes (regex)
- High-frequency capitalized tokens

## Dependencies

- Optional: P1-01 for clustering similar strings

## Acceptance criteria

- [x] Analyze project with ≥100 translations produces ranked suggestions
- [x] Approve suggestion creates `GlossaryTerm`
- [x] Approved terms used in next job via existing pipeline
- [x] Unit tests for suggestion merge logic

## Overlap with raw.md

Items #7 (Auto Glossary Builder) — manual glossary already shipped; this is the **auto** half.
