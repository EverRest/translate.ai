# P0-D03 — Visual context (screenshot)

**Phase:** FIFA/WIZ Deferred · **Importance:** Medium · **Difficulty:** High · **Status:** Deferred

**Client idea:** #21 · **EverRest:** Future — complex cases only

## Goal

Attach UI screenshot to a key; AI uses visual context (button width, mobile header) for length- and layout-aware translation.

## Current state

- Keys have optional `context` text field
- [P3-06](../P3-06-screenshot-regression.md) covers post-translate overflow regression, not translate-time vision

## Proposed fit

- Multimodal prompt: screenshot + source text + char limit
- Storage: S3 for screenshot attachments on `TranslationKey`
- See P3-06 for related platform work

## Dependencies

- Vision-capable provider routing ([P2-02](../P2-02-cross-provider-cost-router.md))

## Acceptance criteria

- [ ] Deferred until P0 batch features shipped
- [ ] When resumed: attach image on key; job sends to vision model

## Notes

Overlap with [P3-06](../P3-06-screenshot-regression.md) and [P0-D04](./P0-D04-character-limit-enforcement.md).
