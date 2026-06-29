# P0-06 — Translation coverage heatmap

**Phase:** FIFA/WIZ P0 · **Importance:** High · **Difficulty:** Medium · **Status:** Backlog

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
Green:  ≥95% approved
Yellow: 70–94% or draft-heavy
Red:    <70% or blocking missing keys for launch language
```

## Dependencies

- [P0-03](./P0-03-confluence-import.md) or key prefix convention for meaningful scopes
- Translation statuses (shipped)

## Acceptance criteria

- [ ] Matrix renders scope rows × language columns with color + percentage
- [ ] Click cell → deep link to Translations grid filtered by scope + language
- [ ] Project overview widget: worst 3 cells + days-to-event optional field
- [ ] Performance: matrix for 5k keys / 24 langs < 2s (aggregated SQL)
- [ ] E2e or unit: fixture data → expected cell colors

## Notes

Strong pre-launch sales/demo artifact; reuses existing translation status data.
