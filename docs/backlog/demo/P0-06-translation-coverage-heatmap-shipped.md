# P0-06 — Translation coverage heatmap

**Phase:** P0 · **Importance:** High · **Difficulty:** Medium · **Status:** Shipped (MVP)

**Slug:** `P0-06-translation-coverage-heatmap-shipped` · Reference spec — not active backlog.

**Client idea:** #6 · **EverRest:** “I like it from UX perspective”

## Goal

Report: matrix **scope × language** with live progress — green / yellow / red per cell, plus overall % per language and per scope.

## Shipped (MVP)

- [x] Matrix renders scope rows × language columns with color + percentage
- [x] Click cell → deep link to Translations grid filtered by scope + language
- [x] Project overview widget: worst 3 cells (Launch readiness)
- [x] `GET .../reports/coverage-matrix`; `scope` filter on list keys
- [x] Unit + e2e: fixture data → expected cell colors / structure

## Deferred

- `eventDate` on project for countdown in overview widget
- Configurable RAG thresholds in project settings JSON
- Materialized view / cache if matrix exceeds 2s at scale
- Share reporting infra with P0-09 debt dashboard

## RAG defaults (MVP)

```text
Green: ≥95% approved
Yellow: 70–94% or draft-heavy
Red: <70%
```

Scope dimension: explicit `scope: …` line in key `context` from import (not key prefix alone).

## Code pointers

- `backend/src/translation/application/services/coverage-matrix.service.ts`
- `backend/src/translation/presentation/reports.controller.ts`
- `frontend/src/features/coverage/`
- `frontend/src/features/analytics/components/CoverageAnalyticsPanel.tsx`
- `frontend/src/features/projects/pages/ProjectOverviewTab.tsx` — Launch readiness card
