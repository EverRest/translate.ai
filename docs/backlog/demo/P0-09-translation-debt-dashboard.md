# P0-09 — Translation debt dashboard

**Phase:** FIFA/WIZ P0 · **Importance:** Medium · **Difficulty:** Medium · **Status:** Backlog

**Client idea:** #28 · **EverRest:** “Added” (approved for backlog)

## Goal

One screen for localization health: keys in draft 6+ months, approved but unpublished, source changed after translation — translation **technical debt** visible to PM and lead linguist.

## Current state

- Analytics v1 basic; no debt-specific aggregates
- [P0-04](./P0-04-stale-translation-detection.md) not shipped — stale count unavailable
- No “published” vs “approved” distinction unless publish workflow exists per tenant

## Proposed fit

| Layer | Change |
|-------|--------|
| **Query** | `GetTranslationDebtQuery` — buckets: oldDrafts, staleSource, approvedNotExported, missingLanguages |
| **API** | `GET /projects/:id/reports/debt` |
| **Frontend** | Analytics sub-tab or Overview widget with drill-down links |
| **Metrics** | Age histogram, top 10 stale keys, debt score (0–100) |

### Debt buckets

```text
Old draft     — status=draft AND updatedAt < 6 months ago
Stale         — source changed after translation (P0-04)
Unpublished   — approved but last export > N days (if export tracking added)
Coverage gap  — languages below launch threshold
```

## Dependencies

- [P0-04](./P0-04-stale-translation-detection.md) for stale bucket
- [P0-06](./P0-06-translation-coverage-heatmap.md) shares reporting infra

## Acceptance criteria

- [ ] Dashboard shows four debt buckets with counts and trends (optional 30d delta)
- [ ] Each bucket links to filtered Translations/Keys view
- [ ] Demo project seed shows realistic debt story for sales
- [ ] Query performance acceptable for 10k keys

## Notes

Good demo narrative without deep integration work — mostly read-model aggregations.
