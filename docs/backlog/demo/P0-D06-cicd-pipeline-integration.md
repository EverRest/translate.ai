# P0-D06 — CI/CD pipeline integration

**Phase:** Deferred · **Importance:** Medium · **Difficulty:** High · **Status:** Deferred

**Client idea:** #26 · **EverRest:** “Not for MVP version”

## Goal

Developer pushes new Interface Element key in git → webhook → translate.ai auto-translates → opens PR with translations.

## Current state

- [P1-02](../P1-02-github-gitlab-integration.md) VCS sync — backlog
- [P3-07](../P3-07-localization-pipeline-as-code.md) pipeline DSL — backlog

## Proposed fit

See [P1-02](../P1-02-github-gitlab-integration.md) + [P1-06](../P1-06-translation-pull-request.md) + [P3-07](../P3-07-localization-pipeline-as-code.md).

## Acceptance criteria

- [ ] Deferred — tracked under platform Phase 1/3 backlog, not P0

## Notes

Same vision as client #26; implement via existing roadmap IDs when MVP client onboarding is done.

---

## Agent review

**Verdict:** Strongly agree — not Client demo scope. The client uses Confluence/Excel, not git keys.

### Architecture

- No Domain-specific work — track only under [P1-02](../P1-02-github-gitlab-integration.md) / [P3-07](../P3-07-localization-pipeline-as-code.md).
- Webhook inbound endpoint belongs in `integration` module when built — same as Confluence phase 2.

### Technical / UI

- N/A for client track — remove from demo planning entirely.

### Disagreements

None — deferral is correct.
