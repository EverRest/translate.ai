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

---

## Agent review

**Verdict:** Agree — defer. Vision translate-time is expensive; P0-D04 (char limit) solves 80% of mobile button pain without screenshots.

### Architecture

- Consolidate with [P3-06](../P3-06-screenshot-regression.md) — one attachment model on `LocalizationNode`, two use cases (translate-time vs post-QA overflow).
- Vision calls must go through `ai-provider` module with new multimodal interface — ADR required before code.

### Technical

- Store images outside DB (S3); key holds URL + hash only.
- GDPR: accreditation screenshots may contain PII — tenant retention policy required before FIFA uses this.

### UI

- Attach screenshot on **Object node inspector** (P3-12 UI), not flat Keys grid — context belongs to field structure.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Difficulty High | **High** for translate-time vision + storage + GDPR; keep deferred until P0-05 object UX stable |
