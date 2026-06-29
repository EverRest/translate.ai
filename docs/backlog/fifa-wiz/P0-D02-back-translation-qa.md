# P0-D02 — Back-translation QA

**Phase:** FIFA/WIZ Deferred · **Importance:** Medium · **Difficulty:** High · **Status:** Deferred

**Client idea:** #20 · **EverRest:** “Agree — interesting but expensive”

## Goal

After EN→FR translation, auto back-translate FR→EN and compare to source. Semantic drift (e.g. “Submit Registration” → back “Send Your Data”) flags QA issue without human.

## Current state

- QA chain: placeholders, HTML balance (shipped)
- No back-translation step; would double AI cost per string

## Proposed fit

| Layer | Change |
|-------|--------|
| **Queue** | Optional post-job step `qa.back-translate` for flagged content types (legal, email) |
| **Scoring** | Embedding similarity or LLM judge between source and back-translation |
| **Config** | Per-project enable + contentType allowlist |

## Dependencies

- [P2-02](../P2-02-cross-provider-cost-router.md) cheap model for back-translate
- Cost approval from client

## Acceptance criteria

- [ ] Deferred — revisit when cost model acceptable
- [ ] If enabled: failing back-translate marks translation `needs_review` with reason

## Notes

Consider sampling (10% of keys) instead of 100% for cost control.
