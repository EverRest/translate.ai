# P0-04 — Stale translation detection

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Medium · **Status:** Backlog

**Client idea:** #12 · **EverRest:** Must have (no explicit defer)

## Goal

When BA changes source text (e.g. Label “First Name” → “Given Name”), all 24 language translations for that key automatically move to **needs review** — stale translations are never silently wrong on prod.

## Current state

- `TranslationKey.sourceText` editable; translations have `status` (draft, approved, …)
- Updating source does **not** invalidate existing translations
- No `sourceTextHash` or `sourceUpdatedAt` comparison on translation rows
- Terminology drift (P2-05) detects inconsistent *terms across keys*, not source drift on one key

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `Translation.sourceTextSnapshot` (text at translate time) or `sourceRevision` on key |
| **Schema** | `TranslationKey.sourceRevision` increment on sourceText change |
| **Command** | `UpdateTranslationKeyCommand` → if sourceText changed, bulk-set related translations to `needs_review` |
| **API** | `GET /projects/:id/translations/stale` — filter stale count per language |
| **Queue** | Optional notify via [P2-06](../P2-06-slack-teams-notifications.md) |
| **Frontend** | Badge on Translations grid; filter “Stale”; bulk re-translate action |
| **Import** | Excel/Confluence re-sync with changed EN column triggers same invalidation |

## Dependencies

- Translation key update flow (existing)
- Complements [P0-02](./P0-02-excel-delta-import.md) when client re-imports changed source column

## Acceptance criteria

- [ ] Changing `sourceText` on a key marks all existing translations `needs_review` (or new status `stale`)
- [ ] Re-translate job respects stale-only filter
- [ ] Grid shows stale indicator; count on project overview
- [ ] Unit test: update source → N translations invalidated
- [ ] Does not false-positive on whitespace-only edits (normalize trim)

## Notes

Distinct from P2-05 terminology drift (cross-key “Submit” inconsistency). Both needed for FIFA QA story.

---

## Agent review

**Verdict:** Agree — must have. **Disagree** with introducing new status `stale` unless filters require it.

### Architecture

- Prefer **computed staleness** in queries:
  ```text
  stale = translation.updatedAt < translationKey.updatedAt
        OR translation.sourceSnapshotHash ≠ hash(key.sourceText)
  ```
- On source change: set existing translations to `TranslationStatus.review` (already in Prisma enum) — **not** `needs_review` (does not exist in schema).
- Store `sourceTextSnapshot` + `sourceSnapshotHash` on `Translation` at write time (translate job + manual edit) — lighter than `sourceRevision` counter on key.
- `UpdateTranslationKeyCommand` handler emits `TranslationKeySourceChangedEvent` → bulk update translations via command (CQRS, testable).
- Excel/Confluence re-import: same event when `sourceText` diff detected row-by-row.

### Technical

- Normalize before compare: `trim()`, collapse internal whitespace — document in handler; unit test false-positive cases.
- Bulk update: single `updateMany` per key per language set — avoid N+1.
- `GET /projects/:id/translations/stale` — query handler with pagination; index on `translation_key.updated_at` if needed.
- Optional: `TranslationJobCompletedEvent` does **not** auto-stale; only source edit paths.

### UI

- Translations grid: **amber dot** + filter chip `Stale` (maps to `review` + computed flag or dedicated `isStale` in list DTO).
- Project Overview: widget count “24 translations need review (source changed)” linking to filtered grid.
- Bulk action: **Re-translate stale** → job with key filter — reuse existing job create with `keys[]` + `onlyStale`.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| New status `needs_review` / `stale` | Use `review` + `isStale` in API response to avoid enum migration and export compatibility issues |
| `TranslationKey.sourceRevision` increment | Snapshot hash on translation is enough for v1; revision counter helps audit but adds complexity |
