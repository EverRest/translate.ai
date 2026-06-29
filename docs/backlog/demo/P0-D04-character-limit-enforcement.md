# P0-D04 — Character limit enforcement

**Phase:** FIFA/WIZ Deferred · **Importance:** Medium · **Difficulty:** Medium · **Status:** Deferred

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

German +30% length vs EN is common FIFA pain on mobile accreditation flows.
