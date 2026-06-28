# P2-07 — AI pull request review

**Phase:** 2 · **Priority:** Medium · **Status:** Backlog

## Goal

After translations generated, AI checks PR/diff for markdown, links, anchors, code blocks, variables.

## Current state

- P1-04 covers in-pipeline validators
- No PR/diff-level review; no Git integration

## Proposed fit

| Layer | Change |
|-------|--------|
| **Depends on** | P1-06 (PR exists), P1-04 (shared validators) |
| **Service** | `PrReviewService` — run validator suite on exported file diff |
| **Output** | PR comment with findings; optional block merge via GitHub check |
| **Queue** | `integration.review_pr` |

## Dependencies

- P1-04, P1-06

## Acceptance criteria

- [ ] PR with broken `{{placeholder}}` gets review comment
- [ ] Validator reuse from P1-04 (DRY)

## Overlap with raw.md

Item #13 — AI Pull Request Review.
