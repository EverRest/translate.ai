# P0-D08 — External reviewer link

**Phase:** FIFA/WIZ Deferred · **Importance:** Medium · **Difficulty:** Medium · **Status:** Deferred

**Client idea:** #15 · **EverRest:** Future

## Goal

Shareable link for FIFA official translator: scoped to language + scope, read-only + approve/reject + comment — no translate.ai account.

## Current state

- All review requires authenticated tenant users
- No magic-link or guest reviewer role

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `ReviewInvite` — token, projectId, language, scope filter, expiresAt |
| **API** | Public `GET/POST /review/:token/...` — list items, approve, reject, comment |
| **Frontend** | Minimal guest UI; no nav to full app |

## Dependencies

- RBAC extension for guest scope
- Audit log for compliance

## Acceptance criteria

- [ ] Deferred post-MVP
- [ ] When resumed: invite link works without login; actions audited

## Notes

Common enterprise TMS feature; not blocking Wiz Excel/Confluence path.
