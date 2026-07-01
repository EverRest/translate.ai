# P0-08 — Translation inheritance between events

**Phase:** P0 · **Importance:** High · **Difficulty:** Medium–High · **Status:** Backlog

**Client idea:** #13

## Goal

Copy approved translations from one event project to another (source event → target event (e.g. MC26 → WWC27)). Show **diff only**: new keys and changed source — translate 150 keys instead of 2000.

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

- [P0-04](./P0-04-stale-translation-detection-shipped.md) aligns status rules for changed source
- [P0-02-shipped](./P0-02-excel-delta-import-shipped.md) alternative for file-based clients

## Acceptance criteria

- [ ] Inherit approved translations where key path + sourceText match
- [ ] Changed source: translation copied as draft/needs_review or skipped per policy
- [ ] Keys only in target: untouched; keys only in source: listed as candidates to add
- [ ] Diff summary before confirm; audit log entry
- [ ] E2e: source 100 keys, target 120 keys (20 new) → correct counts

## Notes

Overlaps P3-02 long-term; Clients need deterministic key-path match first, semantic match later.

---

## Agent review

**Verdict:** Agree on approach (deterministic key match first). **Disagree** with Wave 3 timing — source event → target event story may be needed **before** browser extension; could be Wave 2 if events overlap.

### Architecture

- **`InheritTranslationsCommand`** — tenant guard: source and target projects **same tenantId**; audit log entry required.
- Match rule: `(key, sourceText)` equality → copy translation value + status if in `copyStatuses`.
- Changed source in target: skip copy or copy as `draft` — make policy explicit enum in command.
- Consider [ADR 0006 branching](../../../adr/0006-project-branching.md) `ProjectBranch` for event variants instead of cross-project copy — **evaluate before building**: branch may already model “WWC27 delta on MC26 base”.
- Follow-up job: reuse `CreateTranslationJobCommand` with key list from diff report.

### Technical

- Diff preview: read-only query `PreviewInheritanceQuery` before destructive command.
- Large inherit: queue `project.inherit` for >500 keys — HTTP returns job id.
- Do not duplicate keys automatically — offer “Import missing keys from source” as separate checkbox.

### UI

- **Project Settings → Inherit translations** wizard: select source project → diff table (inherited / changed / new / orphan) → confirm.
- Color-code rows: green inherit, amber review needed, red new key.
- After inherit: banner on Overview with link to “Translate 150 remaining keys”.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Cross-project only | Check if `ProjectBranch` fits event model — may avoid duplicate project sprawl |
| Difficulty Medium–High | **Medium** for key+source match without semantic diff |
