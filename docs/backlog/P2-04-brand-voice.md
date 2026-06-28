# P2-04 — Brand voice

**Phase:** 2 · **Priority:** Medium · **Status:** Backlog

## Goal

Translate "like this company" — persistent brand guidelines, not one-off tone in tests.

## Current state

- `tone?: formal | friendly | technical` in `TranslateOptions` — **not wired** from UI/jobs
- Content-type hints in `prompt.builder.ts`
- No brand corpus storage

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `project_brand_profiles` (tone, guidelines text, sample phrases JSON, forbidden terms) |
| **Module** | `project` or new `brand` submodule |
| **Pipeline** | Inject brand block into system prompt; optional RAG over uploaded snippets (future) |
| **Frontend** | Project Settings → Brand voice form |
| **Phase 2+** | Upload PDF/blog samples → embed for RAG (needs P1-01 pgvector) |

## Dependencies

- P1-01 optional for corpus RAG
- Wire existing `tone` field as part of profile

## Acceptance criteria

- [ ] Project brand guidelines appear in prompt for all jobs
- [ ] A/B measurable via quality metrics / human approval rate
- [ ] Unit test: prompt contains brand block when profile set

## Overlap with raw.md

Items #11 (Brand AI), partial #16 (tone) — formal/informal productized here.
