# P0-10 — Live browser injection

**Phase:** FIFA/WIZ P0 · **Importance:** High · **Difficulty:** High · **Status:** Backlog

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

### Evo Core adapter (Wiz-specific)

```text
Detect translation key attribute or internal API hook
Replace text nodes with translate.ai preview values
Show badge “Preview: FR (draft)” in corner
```

## Dependencies

- Stable key naming aligned with [P0-03](./P0-03-confluence-import.md) / Evo Core
- [P0-D01](./P0-D01-runtime-translation-api.md) long-term production path; extension is preview-only

## Acceptance criteria

- [ ] Extension connects to translate.ai project; user picks language
- [ ] Staging page text updates to selected language for mapped keys
- [ ] Toggle off restores original text
- [ ] Preview token expires; no production domain injection by default
- [ ] Demo video script: MC26 staging form in FR under 2 minutes setup

## Notes

High demo impact; requires client cooperation on DOM key exposure. POC before production runtime API.
