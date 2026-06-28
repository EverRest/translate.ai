# P3-05 — Domain detection (vertical)

**Phase:** 3 · **Priority:** Low · **Status:** Backlog

## Goal

Auto-detect vertical (medical, legal, gaming, ecommerce) → tune prompt, glossary, model, temperature.

## Current state

- `ContentType`: ui, email, legal, … — **UI/format** not industry vertical
- `inferContentTypeFromContext` keyword rules + optional Ollama classifier (ADR 0007)
- No medical/gaming/finance domains

## Proposed fit

| Layer | Change |
|-------|--------|
| **Extend** | `Domain` enum separate from `ContentType` |
| **Classifier** | Extend `ContentClassifierService` or project-level setting |
| **Router** | P2-02 rules include domain dimension |
| **Glossary** | Suggest domain glossary packs (marketplace future) |

## Dependencies

- P2-02 cost router
- Optional project description + sample keys as classifier input

## Acceptance criteria

- [ ] Project with medical sample keys → domain=medical in job metadata
- [ ] Prompt adds medical accuracy hint
- [ ] Override in project settings

## Overlap with raw.md

Item #8 — Domain Detection.
