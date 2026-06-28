# P2-05 — Terminology drift detection

**Phase:** 2 · **Priority:** Medium · **Status:** Backlog

## Goal

Detect inconsistent translations for the same source term over time (e.g. Customer → Клієнт vs Замовник).

## Current state

- Glossary enforces **explicit** terms
- Quality metrics per translation — no cross-key term analysis
- Levenshtein similarity only on edit vs AI value

## Proposed fit

| Layer | Change |
|-------|--------|
| **Queue** | Scheduled `terminology.scan` (weekly or on-demand) |
| **Service** | `TerminologyDriftService` — cluster source tokens, compare target variants per language |
| **Schema** | `terminology_issues` (projectId, sourceTerm, language, variants[], severity) |
| **Frontend** | Analytics or Glossary → Drift tab; one-click add glossary rule |
| **LLM** | Optional: classify whether variants are acceptable synonyms |

## Dependencies

- Glossary module (shipped)
- P3-03 duplicate finder shares clustering logic

## Acceptance criteria

- [ ] Scan finds ≥2 variants for same EN term in UA with suggestion
- [ ] User promotes variant to glossary preferred term
- [ ] Unit tests with fixture corpus

## Overlap with raw.md

Item #12 — Terminology Drift.
