# P0-06 — Translation coverage heatmap

**Phase:** P0 · **Importance:** High · **Difficulty:** Medium · **Status:** Backlog

**Client idea:** #6 · **EverRest:** “I like it from UX perspective”

## Goal

Report: matrix **scope × language** with live progress — green / yellow / red per cell, plus overall % per language and per event.

**Use case:** Event goes live in 3 days; FR is 40% done in Interface Elements — PM sees it immediately.

## Current state

- Analytics page exists ([P2-03](../P2-03-analytics-v2.md) backlog for v2 metrics)
- Translations grid filterable by language/status; no scope dimension in aggregate UI
- Keys may use prefix as scope (`registration_form.*`) or Confluence scope column (after P0-03)
- No heatmap visualization component

## Proposed fit

| Layer | Change |
|-------|--------|
| **Query** | `GetCoverageMatrixQuery` — group by scope (key prefix segment 1 or tag) × language |
| **Metrics** | Per cell: `{ total, translated, approved, missing, pct }`; RAG thresholds configurable |
| **API** | `GET /projects/:id/reports/coverage-matrix?scopes=&languages=` |
| **Frontend** | Analytics or dedicated **Coverage** tab — heatmap table, language summary row, export CSV |
| **Scope definition** | Project setting: `scopeSegmentIndex` or explicit scope tags from import |

### RAG defaults

```text
Green: ≥95% approved
Yellow: 70–94% or draft-heavy
Red: <70% or blocking missing keys for launch language
```

## Dependencies

- [shipped Confluence import](./P0-03-documentation-import-shipped.md) or key prefix convention for meaningful scopes
- Translation statuses (shipped)

## Acceptance criteria

- [ ] Matrix renders scope rows × language columns with color + percentage
- [ ] Click cell → deep link to Translations grid filtered by scope + language
- [ ] Project overview widget: worst 3 cells + days-to-event optional field
- [ ] Performance: matrix for 5k keys / 24 langs < 2s (aggregated SQL)
- [ ] E2e or unit: fixture data → expected cell colors

## Notes

Strong pre-launch sales/demo artifact; reuses existing translation status data.

---

## Agent review

**Verdict:** Agree — high demo value, Medium difficulty fair **if** scope dimension is explicit from import.

### Architecture

- **`GetCoverageMatrixQuery`** in `project` or new `reporting` read-only module — no writes, CQRS query handler only.
- Scope dimension: **require explicit `scope` tag** on keys from P0-03 import — do not rely only on `key.split('.')[0]` (Imported keys may not be dotted).
- SQL: single aggregated query with `GROUP BY scope, language` using conditional counts (`approved`, `missing`, `draft`) — avoid N scopes × M languages round trips.
- Optional: nightly materialized view or Redis cache keyed by `projectId` if matrix >2s; invalidate on translation/key change events.
- Share query infrastructure with P0-09 debt dashboard.

### Technical

- RAG thresholds: store in `project` settings JSON (small, validated) — `coverageGreenPct: 95`, etc.
- Performance AC (<2s @ 5k×24): add composite indexes if needed; load test in e2e with seeded data.
- CSV export: reuse `export` module patterns.

### UI

- Add **Coverage** sub-tab under existing **Analytics** page ([AnalyticsPage.tsx](../../../../frontend/src/features/analytics/pages/AnalyticsPage.tsx)) — not new top-level nav item.
- Heatmap: HTML table with `aria-label`, color + **numeric %** (color-blind safe — do not rely on green/red alone).
- Cell click → `/projects/:id/translations?scope=X&lang=fr&status=...` deep link (extend grid filters if missing).
- Overview widget: **Launch readiness** card — worst 3 cells + optional `eventDate` field on project for countdown.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| `scopeSegmentIndex` on project | Fragile; prefer imported `scope` column mapped to key metadata |
| Dedicated **Coverage** tab | Analytics sub-tab is enough for MVP; avoids nav proliferation |
