# P3-01 — Translation replay engine

**Phase:** 3 · **Priority:** High · **Status:** Backlog

## Goal

Bulk re-translate with filters: older than X, low confidence, specific content types — e.g. when GPT-6 launches.

## Current state

- Single-row **Retranslate** from Approvals (`RetranslateTranslationCommand`)
- Job-level retry for **failed** items only
- No snapshots, no bulk filter, no compare UI

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `translation_snapshots` (translationId, value, provider, promptVersion, createdAt) |
| **Command** | `CreateReplayJobCommand` with filters JSON |
| **Queue** | Reuse `translation.create` + `translation.process`; new `replay.compare` optional |
| **Frontend** | Jobs → "Replay" wizard: filters, preview count, dry-run cost estimate (→ P3-08) |
| **Flow** | Snapshot before overwrite → new job → side-by-side diff → bulk approve |

## Dependencies

- P2-01 prompt versioning (filter by prompt version)
- P2-02 cost router (replay with new provider)
- P1-01 forget memory / skip cache on replay

## Acceptance criteria

- [ ] Replay job: "all de translations, draft, older than 90 days" enqueues N items
- [ ] Snapshot preserved; compare view in UI
- [ ] ADR: `0013-translation-replay.md`

## Overlap with raw.md

Item #3 — Translation Replay.
