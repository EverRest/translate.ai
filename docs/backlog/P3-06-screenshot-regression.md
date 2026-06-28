# P3-06 — Screenshot regression

**Phase:** 3 · **Priority:** Medium · **Status:** Backlog

## Goal

Detect UI overflow/truncation after translation (e.g. "OK" → "Bestätigen" breaks button layout).

## Current state

- `context` on keys is text only — no image upload
- Playwright e2e for auth/projects — not locale visual regression
- Roadmap item "Context Screenshots" not built

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `translation_key_screenshots` (keyId, imageUrl, locale, viewport) |
| **Storage** | S3/local blob — not in Postgres |
| **Queue** | `localization.screenshot_test` — render or compare uploaded before/after |
| **MVP** | Manual screenshot upload + optional overflow heuristics (text length vs bbox OCR) |
| **Future** | Integrate Percy/Chromatic or self-hosted pixel diff |

## Dependencies

- P1-04 length validators as cheap first pass without screenshots

## Acceptance criteria

- [ ] Attach screenshot to key in UI
- [ ] Flag keys where translation length > 1.5× source for `contentType=ui`
- [ ] ADR for storage security (tenant isolation)

## Overlap with raw.md

Item #17 — Screenshot Regression.
