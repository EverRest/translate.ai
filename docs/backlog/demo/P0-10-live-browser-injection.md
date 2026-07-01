# P0-10 — Live browser injection

**Phase:** P0 · **Importance:** High · **Difficulty:** High · **Status:** Backlog

**Client idea:** #29 · **EverRest:** “Killer feature” (demo)

## Goal

Chrome extension: on client staging site, toggle **preview mode** — live UI renders WIP translations from translate.ai without export/import. PM shows client French UI in real browser context.

## Current state

- No browser extension; no runtime translation fetch from staging apps
- Translations consumed via export files or future runtime API ([P0-D01](./P0-D01-runtime-translation-api.md))
- Evo Core staging apps use static translation bundles today

## Proposed fit

| Layer | Change |
|-------|--------|
| **Extension** | MV3 Chrome extension: content script + popup (project, language, environment) |
| **API** | Read-only `GET /projects/:id/translations/preview-bundle?lang=&keys=` or WebSocket delta stream |
| **Auth** | Short-lived preview token (scoped read, no write) |
| **Injection** | DOM strategies: `data-i18n-key`, text-node map, or client-specific adapter for Evo Core |
| **Cache** | Local storage + If-None-Match; refresh every 30s |
| **Safety** | Extension only activates on allowlisted staging domains |

### Evo Core adapter (Client-specific)

```text
Detect translation key attribute or internal API hook
Replace text nodes with translate.ai preview values
Show badge “Preview: FR (draft)” in corner
```

## Dependencies

- Stable key naming aligned with [P0-03-shipped](./P0-03-documentation-import-shipped.md) / Evo Core
- [P0-D01](./P0-D01-runtime-translation-api.md) long-term production path; extension is preview-only

## Acceptance criteria

- [ ] Extension connects to translate.ai project; user picks language
- [ ] Staging page text updates to selected language for mapped keys
- [ ] Toggle off restores original text
- [ ] Preview token expires; no production domain injection by default
- [ ] Demo video script: MC26 staging form in FR under 2 minutes setup

## Notes

High demo impact; requires client cooperation on DOM key exposure. POC before production runtime API.

---

## Agent review

**Verdict:** Agree — killer demo. **Disagree** with starting Chrome extension before lighter interim options and stable key contract.

### Architecture

- **Preview API** (subset of P0-D01, not full runtime):
 - `POST /projects/:id/preview-tokens` → short-lived JWT, scopes: `read:translations`, `projectId`, `language`, optional `statuses: [draft, approved]`
 - `GET /preview/bundle?token=` — gzip JSON map `{ [key]: value }` + ETag
- Extension MV3: service worker + content script; **domain allowlist** in token claims.
- **Interim demo without extension:** translate.ai **Preview page** — iframe staging URL + injected overlay script served from translate.ai (bookmarklet) — validates API before store listing.
- Injection priority: (1) `[data-i18n-key]` (2) Client-specific adapter config JSON per project (3) text match fallback **disabled by default** (fragile).

### Technical

- CORS: preview bundle endpoint allows extension origin only; tokens 15 min TTL.
- Cache: extension `chrome.storage` + `If-None-Match`; poll 30s not WebSocket for v1.
- Never inject on production domains — token `allowedOrigins[]` enforced server-side.
- Separate repo folder `extension/` or `packages/preview-extension` — not inside frontend bundle.

### UI

- translate.ai: **Project → Preview** — generate token, QR/link for extension setup, language picker, “includes draft translations” toggle.
- Extension popup: project picker, language, on/off toggle, connection status.
- On-page badge: **“translate.ai preview · FR · draft”** — draggable, does not cover Client branding.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Wave 3 POC alongside debt dashboard | Extension is **highest risk** item — schedule after key naming from P0-03 confirmed with the client |
| WebSocket delta stream | Overkill for v1; ETag polling sufficient for demo |
| Full extension before bookmarklet | Ship bookmarklet/interim preview page first (1–2 days) to unblock PM demos |
