# P0-11 — New keys alert (post-release)

**Phase:** FIFA/WIZ P0 · **Importance:** Medium · **Difficulty:** Medium · **Status:** Conditional (demoted to Wave 4 / P1)

**Client idea:** #8 · **EverRest:** Under question — only with static UI element integration

## Goal

After Evo Core release, compare translation key set to previous version snapshot: “v2.1 added 23 new keys — 0% translated.”

## Current state

- No version snapshots of key sets per project
- [P1-02](../P1-02-github-gitlab-integration.md) VCS sync could detect new keys from repo — not Evo Core bundle
- New keys alert depends on how Wiz ships Interface Element keys (static bundle vs API)

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `ProjectKeySnapshot` — `{ projectId, label, keyCount, keyHashes[], createdAt }` |
| **API** | `POST /projects/:id/snapshots` (manual or webhook); `GET .../snapshots/diff?from=&to=` |
| **Import** | Snapshot on Excel/Confluence sync ([P0-02](./P0-02-excel-delta-import.md), [P0-03](./P0-03-confluence-import.md)) |
| **Alert** | Overview banner + optional [P2-06](../P2-06-slack-teams-notifications.md) |
| **Frontend** | “Since v2.0” panel: new keys list, translate CTA |

## Dependencies

- Defined ingestion path for Evo Core keys (file import minimum)
- Blocked until client confirms static translation delivery model

## Acceptance criteria

- [ ] Create snapshot; import/sync creates automatic snapshot with version label
- [ ] Diff shows added/removed/changed-source keys with translation coverage %
- [ ] One-click job: translate all new keys for language X
- [ ] Document when **not** to use (runtime API mode)

## Notes

**Conditional P0** — promote only if FIFA/Wiz commits to file or VCS key delivery. Otherwise superseded by runtime API ([P0-D01](./P0-D01-runtime-translation-api.md)).

---

## Agent review

**Verdict:** Agree with EverRest — **conditional**. **Disagree** with P0-11 remaining in main P0 table — demote to **P1 / Wave 4**.

### Architecture

- Snapshots should trigger automatically on **P0-02/P0-03 import complete** — not separate manual step (or manual snapshot becomes optional label).
- Store snapshot as **hash set + metadata**, not full key list duplication: `{ sha256(sorted key+sourceText pairs), count, label, createdAt }`.
- Diff: added/removed/changed-source via set operations on import — O(n) in memory, fine for 10k keys.
- Overlaps [P1-02](../P1-02-github-gitlab-integration.md) for git-based keys — do not duplicate VCS diff logic.

### Technical

- `ProjectKeySnapshot` table lightweight — blob in JSONB if needed for audit trail.
- One-click translate new keys: filter keys where `createdAt > snapshot.createdAt` OR in diff `added` set.

### UI

- Overview banner: **“Since import v2.1: 23 new keys (0% FR)”** — dismissible.
- Only show when ≥1 snapshot exists and latest import detected diff.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| P0 priority Medium | **P1 conditional** — blocked on client delivery model confirmation |
| Full `keyHashes[]` in snapshot row | Store aggregate hash + optional diff artifact file for large sets |
| Build before P0-02/03 stable | Import diff **is** the snapshot story — merge into import completion UX |
