# P2-07 — AI pull request review

**Phase:** 2 · **Priority:** Medium · **Status:** Backlog

## Goal

After translations generated, AI checks PR/diff for markdown, links, anchors, code blocks, variables.

## Current state

- Shipped in-pipeline QA validators (ADR 0008) cover placeholders and HTML tag balance
- No PR/diff-level review; no Git integration

## Proposed fit

| Layer | Change |
|-------|--------|
| **Depends on** | P1-06 (PR exists), shipped QA validator chain (ADR 0008) |
| **Service** | `PrReviewService` — run validator suite on exported file diff |
| **Output** | PR comment with findings; optional block merge via GitHub check |
| **Queue** | `integration.review_pr` |

## Dependencies

- P1-06, shipped QA validators (ADR 0008)

## Acceptance criteria

- [ ] PR with broken `{{placeholder}}` gets review comment
- [ ] Validator reuse from shipped QA chain (DRY)

## Overlap with raw.md

Item #13 — AI Pull Request Review.
