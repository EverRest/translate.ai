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
