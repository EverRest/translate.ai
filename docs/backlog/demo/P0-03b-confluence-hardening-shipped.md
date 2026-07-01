# P0-03b — Confluence hardening (follow-up)

**Status:** Shipped 
**Slug:** `P0-03b-confluence-hardening-shipped` · Reference spec — not active backlog. 
**Parent:** [P0-03](./P0-03-documentation-import-shipped.md) (Phase 1 + 2 shipped)

## Goal

Post-MVP improvements for Confluence live sync: multi-site OAuth, label filter, column mapping UI, scheduled polling sync, BYO tenant OAuth, test coverage.

## Waves

### Wave A — UX + quality

| Item | Status |
|------|--------|
| Site picker (multi Confluence site per Atlassian account) | Shipped |
| `labelFilter` in API + UI | Shipped |
| Column mapping UI (Integrations + Import advanced) | Shipped |
| E2E with mocked Atlassian API | Shipped |
| Client production fixtures | Blocked on client samples (`test/fixtures/confluence/client/`) |

### Wave B — Scheduled sync

| Item | Status |
|------|--------|
| `syncEnabled` + `syncIntervalMinutes` on `ConfluenceSyncConfig` | Shipped |
| Worker scheduler (5 min tick, enqueues `integration.confluence.sync`) | Shipped |
| UI toggle + interval select | Shipped |

**Note:** Confluence `page_updated` webhooks are **not** available for OAuth 3LO apps. Polling substitutes webhooks. Real webhooks require Forge/Connect (deferred epic).

### Wave C — BYO OAuth per tenant

| Item | Status |
|------|--------|
| `TenantAtlassianOAuthApp` schema | Shipped |
| `GET/PUT/DELETE /tenant/integrations/atlassian` (admin) | Shipped |
| Settings → Atlassian OAuth (BYO) UI | Shipped |
| Credential resolution: tenant app → platform env | Shipped |

## API additions

- `GET .../connect/pending-sites?pendingToken=`
- `POST .../connect/complete` `{ pendingToken, cloudId }`
- `PUT .../config` — `labelFilter`, `parseRulesJson`, `syncEnabled`, `syncIntervalMinutes`
- `GET .../spaces/:spaceId/pages?label=`
- `GET/PUT/DELETE /tenant/integrations/atlassian`

## Deferred

- Confluence Connect/Forge webhooks for `page_updated`
- Confluence Data Center / on-prem
- Unofficial webhook REST API
