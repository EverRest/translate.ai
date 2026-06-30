# P1-06 — Translation pull request workflow

**Phase:** 1 · **Priority:** High · **Status:** Backlog

## Goal

After job completes, open a PR with updated locale files — developers review in GitHub/GitLab.

## Current state

- Export to formats exists (API)
- Outbound webhooks notify `job.completed` — customer builds PR themselves
- No VCS write-back

## Proposed fit

| Layer | Change |
|-------|--------|
| **Depends on** | [P1-02](./P1-02-github-gitlab-integration.md) connection |
| **Module** | `integration` — `CreateTranslationPrCommand` |
| **Flow** | `job.completed` event → if project.prEnabled → branch `translate.ai/{jobId}` → commit files → open PR |
| **Queue** | `integration.create_pr` |
| **Config** | Project settings: target branch, file layout, PR title template |
| **Frontend** | Toggle "Open PR on job complete" + PR link on job detail |

### File layout options

- Single file per language (`locales/de.json`)
- Mirror repo structure from sync config

## Dependencies

- P1-02 (VCS auth + repo access)
- Shipped export UI + async queue ([shipped-baseline.md](./shipped-baseline.md)) for large file generation

## Acceptance criteria

- [ ] Completed job opens GitHub PR with de/fr files
- [ ] PR body lists key counts, job link, failed items
- [ ] Idempotent: same jobId doesn't open duplicate PR
- [ ] E2e with GitHub API mock

## Overlap with raw.md

Stage 1 "Pull Request з перекладами".
