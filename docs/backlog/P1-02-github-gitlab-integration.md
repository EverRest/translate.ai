# P1-02 — GitHub / GitLab integration

**Phase:** 1 · **Priority:** High · **Status:** Backlog

## Goal

Sync translation keys from repos; trigger jobs on push; close the loop for dev teams.

## Current state

- Keys via UI, API (`POST /projects/:id/keys`), or inline `keyItems` on job create
- Webhooks are **outbound only** (customer receives events)
- No OAuth, no repo connectors, no file parsers (JSON/YAML/po in repo)

## Proposed fit

| Layer | Change |
|-------|--------|
| **Module** | New `integration` or extend `project` — `VcsConnection`, `VcsSyncConfig` |
| **Schema** | `project_vcs_connections` (provider, repo, branch, token encrypted, path glob) |
| **Auth** | GitHub App / GitLab OAuth — store in tenant settings; never log tokens |
| **Commands** | `ConnectVcsCommand`, `SyncKeysFromRepoCommand`, `HandleVcsWebhookCommand` |
| **Queue** | `integration.sync` — parse files, upsert `TranslationKey`, optional auto-job |
| **Parsers** | Reuse export formats in reverse: json, yaml, android-xml, ios-strings, po |
| **Frontend** | Project Settings → Integrations tab |

### Webhook flow (inbound)

```text
GitHub push → POST /api/v1/integrations/github/webhook
  → verify signature
  → enqueue integration.sync
  → diff keys → create job for new/changed sourceText
```

## Dependencies

- None (standalone)
- Feeds [P1-06](./P1-06-translation-pull-request.md), [P3-07](./P3-07-localization-pipeline-as-code.md)

## Acceptance criteria

- [ ] Connect GitHub repo to project (OAuth or PAT)
- [ ] Sync keys from configured paths on manual sync + push webhook
- [ ] Idempotent upsert by `projectId + key`
- [ ] ADR: `0010-vcs-integration.md`
- [ ] E2e: webhook fixture → keys created in DB

## Notes

Start with **GitHub** only; GitLab as second provider implementing same `VcsProvider` interface in `ai-provider` style abstraction.
