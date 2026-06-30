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

---

## Agent review

**Verdict:** Agree — defer post-MVP. FIFA may ask for this in review phase — design now, build later.

### Architecture

- **`ReviewInvite`** token table — scoped claims: `{ projectId, language, scope?, expiresAt, permissions: ['read','approve'] }`.
- Public routes under `/api/v1/guest/review/:token` — separate guard from JWT; rate limited.
- Reuse `approval` module commands for approve/reject — guest handler wraps same commands with token scope check.
- Audit log mandatory for FIFA compliance.

### Technical

- Tokens: crypto-random, single-use optional for approve actions vs read-only multi-use.
- No full project enumeration — token binds to filter query.

### UI

- Minimal guest SPA or SSR page: source | translation | comment | approve/reject buttons.
- Branded “FIFA FR review” header; no sidebar navigation to main app.

### Disagreements

None on deferral — correct for current Wiz file-based workflow.
