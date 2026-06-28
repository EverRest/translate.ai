# P3-08 — Simulator + localization advisor

**Phase:** 3 · **Priority:** Medium · **Status:** Backlog

## Goal

**Simulator:** estimate cost/time for adding languages. **Advisor:** Copilot-style project health report.

## Current state

- Usage analytics historical — no forward estimate
- No advisory aggregate (untranslated count exists via API but no "health score")

## Proposed fit

| Layer | Change |
|-------|--------|
| **Simulator** | `EstimateTranslationJobQuery` — keys × langs × avg tokens × router price |
| **Advisor** | `GetLocalizationHealthQuery` — aggregates: missing translations, failed jobs, duplicates (P3-03), drift (P2-05), placeholder risks |
| **Frontend** | Dashboard widget "Add Japanese?" → modal with estimate; Advisor panel with actionable links |
| **Optional** | Create GitHub issues from advisor findings (P1-02) |

## Dependencies

- P2-02 for accurate cost estimate
- P3-03, P2-05 for full advisor

## Acceptance criteria

- [ ] Simulator within 20% of actual job cost on sample project
- [ ] Advisor lists top 5 issues with deep links
- [ ] Unit tests for estimate formula

## Overlap with raw.md

Items #14 (Simulator), #15 (Advisor).
