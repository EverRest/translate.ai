# P0-08 — Translation inheritance between events

**Phase:** FIFA/WIZ P0 · **Importance:** High · **Difficulty:** Medium–High · **Status:** Backlog

**Client idea:** #13

## Goal

Copy approved translations from one event project to another (FIFA MC26 → FIFA WWC27). Show **diff only**: new keys and changed source — translate 150 keys instead of 2000.

## Current state

- Projects are isolated; no clone or merge workflow
- [P3-02](../P3-02-semantic-diff-reuse.md) semantic diff is future platform work
- Export/import is manual (JSON keys or future Excel)

## Proposed fit

| Layer | Change |
|-------|--------|
| **API** | `POST /projects/:id/inherit` body `{ sourceProjectId, languages[], copyStatuses: ['approved'] }` |
| **Logic** | Match keys by path; copy translation if sourceText unchanged; mark `needs_review` if source differs |
| **Report** | `{ inherited, skippedChanged, newKeys, missingInTarget }` |
| **Frontend** | Project Settings → **Inherit from event** wizard with diff preview table |
| **Queue** | Optional follow-up job: translate `newKeys + skippedChanged` only |

## Dependencies

- [P0-04](./P0-04-stale-translation-detection.md) aligns status rules for changed source
- [P0-02](./P0-02-excel-delta-import.md) alternative for file-based clients

## Acceptance criteria

- [ ] Inherit approved translations where key path + sourceText match
- [ ] Changed source: translation copied as draft/needs_review or skipped per policy
- [ ] Keys only in target: untouched; keys only in source: listed as candidates to add
- [ ] Diff summary before confirm; audit log entry
- [ ] E2e: source 100 keys, target 120 keys (20 new) → correct counts

## Notes

Overlaps P3-02 long-term; FIFA needs deterministic key-path match first, semantic match later.
