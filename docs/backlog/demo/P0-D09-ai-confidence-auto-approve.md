# P0-D09 — AI confidence + auto-approve

**Phase:** FIFA/WIZ Deferred · **Importance:** Medium · **Difficulty:** Medium · **Status:** Deferred

**Client idea:** #16 · **EverRest:** Future

## Goal

Per translation confidence score (e.g. “Cancel” → “Annuler” 99%) — auto-approve above project threshold; legal text at 61% → human review.

## Current state

- [P2-03](../P2-03-analytics-v2.md) plans confidence metrics in analytics v2
- No provider confidence exposed consistently; statuses set manually or on job default

## Proposed fit

- Store `confidence` on translation from provider logprobs or LLM self-score
- Project setting `autoApproveThreshold` per contentType
- Job post-process promotes status when above threshold

## Dependencies

- Provider adapter support for confidence
- [P2-03](../P2-03-analytics-v2.md)

## Acceptance criteria

- [ ] Deferred
- [ ] When resumed: UI shows confidence; auto-approve configurable per project

## Notes

Useful for high-volume UI strings after FIFA glossary stabilizes terminology.
