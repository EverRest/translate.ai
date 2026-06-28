# P3-09 — Feature-flag localization

**Phase:** 3 · **Priority:** Low · **Status:** Backlog

## Goal

Don't translate keys tied to disabled feature flags; auto-translate when flag turns on.

## Current state

- No feature flag field on keys
- `contentType` is AI hint — not runtime flag

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `translation_keys.featureFlag` optional string |
| **Integration** | LaunchDarkly / Unleash / custom webhook — `integration.feature_flag` |
| **Job create** | Filter keys where flag enabled (or no flag) |
| **Event** | Flag ON → `CreateTranslationJobCommand` for affected keys |

## Dependencies

- P1-02 integration patterns

## Acceptance criteria

- [ ] Keys tagged `checkout_v2` skipped when flag off
- [ ] Flag enable webhook triggers job for those keys only
- [ ] Document LaunchDarkly setup

## Overlap with raw.md

Item #16 — Feature Flag Localization.
