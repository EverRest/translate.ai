# P0-09 — Translation debt dashboard

**Phase:** P0 · **Importance:** Medium · **Difficulty:** Medium · **Status:** Backlog

**Client idea:** #28 · **EverRest:** “Added” (approved for backlog)

## Goal

One screen for localization health: keys in draft 6+ months, approved but unpublished, source changed after translation — translation **technical debt** visible to PM and lead linguist.

## Current state

- Analytics v1 basic; no debt-specific aggregates
- [P0-04](./P0-04-stale-translation-detection-shipped.md) **shipped (MVP)** — stale counts via `GET .../translations/stale-summary`
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
Old draft — status=draft AND updatedAt < 6 months ago
Stale — source changed after translation (P0-04)
Unpublished — approved but last export > N days (if export tracking added)
Coverage gap — languages below launch threshold
```

## Dependencies

- [P0-04](./P0-04-stale-translation-detection-shipped.md) for stale bucket (shipped — reuse `StaleTranslationService.getStaleSummary`)
- [P0-06-shipped](./P0-06-translation-coverage-heatmap-shipped.md) shares reporting infra

## Acceptance criteria

- [ ] Dashboard shows four debt buckets with counts and trends (optional 30d delta)
- [ ] Each bucket links to filtered Translations/Keys view
- [ ] Demo project seed shows realistic debt story for sales
- [ ] Query performance acceptable for 10k keys

## Notes

Good demo narrative without deep integration work — mostly read-model aggregations.

---

## Agent review

**Verdict:** Agree for demo value. **Disagree** with “approved but unpublished” bucket in v1 — publish/export tracking is not shipped.

### Architecture

- Single **`GetProjectHealthQuery`** returning debt + coverage summary — P0-06 and P0-09 should share one handler/response shape to avoid duplicate SQL.
- v1 buckets only:
 - `oldDrafts` (draft + age > 6mo)
 - `staleSource` (requires P0-04)
 - `coverageGap` (languages below threshold — from heatmap logic)
- Defer `approvedNotExported` until export job stores `lastExportedAt` per project/language.
- “Debt score 0–100”: define formula in ADR snippet — e.g. weighted sum of bucket severities — avoid magic number in UI only.

### Technical

- Read-only aggregates; cache 5 min per project for dashboard load.
- Demo seed script: `backend/scripts/seed-debt-demo.ts` — intentional old drafts + stale keys for sales.

### UI

- **Analytics → Health** sub-tab (same area as Coverage heatmap) — one “Localization health” page with two sections.
- Overview: compact **debt score** ring + top 3 issues list (not four equal widgets — PMs want priority).
- Drill-down links mandatory — debt without action is vanity metrics.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Four debt buckets in AC | Ship **three** until export tracking exists |
| Medium difficulty alone | **Low–Medium** if sharing P0-06 query infra; **Medium** if built standalone |
