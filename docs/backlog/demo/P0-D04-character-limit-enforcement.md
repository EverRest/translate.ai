# P0-D04 — Character limit enforcement

**Phase:** Deferred · **Importance:** Medium · **Difficulty:** Medium · **Status:** Deferred

**Client idea:** #22 · **EverRest:** Future

## Goal

AI respects max character count per UI element (e.g. German button label must fit 60px width ≈ N chars).

## Current state

- No `maxLength` on keys or nodes
- QA validators do not check length

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `TranslationKey.maxLength` or on `LocalizationNode` |
| **Prompt** | “Output MUST be ≤ N characters” |
| **QA** | `MaxLengthValidator` — retry with shorten instruction |

## Dependencies

- [P0-05](./P0-05-context-aware-object-translation.md) for field-level limits
- Optional: [P0-D03](./P0-D03-visual-context-screenshot.md) for inferred limits

## Acceptance criteria

- [ ] Deferred
- [ ] When resumed: validator rejects over-length; job retries once with constraint

## Notes

German +30% length vs EN is common pain on mobile accreditation flows.

---

## Agent review

**Verdict:** Agree — defer for MVP, but **consider promoting after P0-05** if mobile label overflow is demo feedback — cheaper than vision (P0-D03).

### Architecture

- Add `maxLength` on `LocalizationNode` (authoring source) → materializes to `TranslationKey` — keeps limit with field in P3-12 model.
- New `MaxLengthValidator` in validator chain ([ADR 0008](../../../adr/0008-translation-output-validation.md)) — same retry pattern as placeholders.

### Technical

- Prompt: hard limit + validator double-check — models often exceed limits; validator is source of truth.
- Retry prompt: “Shorten to ≤N chars preserving meaning” — max 1 retry to control cost.

### UI

- Node inspector: numeric **Max length** input with helper “German often +30% vs EN”.
- Grid: optional column with char count / limit indicator when limit set.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Difficulty Medium | **Low–Medium** — schema + validator + prompt tweak; no new infrastructure |
