# P0-D07 — Multi-model tournament

**Phase:** FIFA/WIZ Deferred · **Importance:** Low · **Difficulty:** Medium · **Status:** Deferred

**Client idea:** #27 · **EverRest:** “Needs RAG otherwise expensive; difficulty low; postponed till next iteration”

## Goal

For high-stakes strings (email subject, legal), run Gemini + GPT-4o + Claude in parallel; reviewer picks winner; system learns preferred model.

## Current state

- Single provider per job ([P2-02](../P2-02-cross-provider-cost-router.md) router backlog)
- No side-by-side variant UI

## Proposed fit

- Job mode `tournament` with 3 provider calls
- Store variants; reviewer selection feeds router weights
- RAG from approved translations as few-shot

## Dependencies

- [P2-02](../P2-02-cross-provider-cost-router.md)
- [P1-01](../P1-01-semantic-translation-memory.md) for RAG

## Acceptance criteria

- [ ] Deferred to next iteration per EverRest

## Notes

3× cost per key — reserve for email/legal content types only.
