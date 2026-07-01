# Changelog

## [Unreleased]

### Added — Excel round-trip + delta import (P0-02)

- Wiz Classic preset; empty-cell-only AI fill; composed `.xlsx` download; Import tab Excel wizard

### Shipped — FIFA/WIZ wave 1 + terminology drift MVP

- **P0-01 Sport-domain AI context** — `domainProfile`, domain presets, `copy-settings`, FIFA glossary preset, Domain context UI, post-create onboarding
- **P0-S02 Placeholder job summary** — `placeholderSummary` on job status + webhooks; job detail UI banner
- **P0-07 Consistency check Wave 1** — `autoTerminologyScan`; auto scan after job; Consistency settings; post-job toast; grid drift hints
- **P2-05 Terminology drift MVP** — drift issues table, scan queue, scan/resolve API, Glossary drift tab

### Changed

- **Backlog** — P0-02 Excel shipped (MVP); removed from active P0 table; Wave 2 = P0-04 + P0-06; see `docs/backlog/shipped-baseline.md`
- **Backlog** — P0-01, P0-S02, P0-07, P0-03 out of active P0 table; Wave 1 complete; P2-05 out of Phase 2 active table (MVP shipped); see `docs/backlog/shipped-baseline.md`

### Added
- **Confluence file import (P0-03 Phase 1)** — upload HTML/CSV/ZIP Confluence export or paste HTML; preview diff; apply keys with scope and hints in context; async parse/apply via BullMQ (ADR 0016)
- **Confluence live sync (P0-03 Phase 2)** — Atlassian OAuth 3LO connect per project; Settings → Integrations page picker + sync now; `integration.confluence.sync` queue; `oauthAvailable` + `setupHint` when OAuth env vars unset (file import still works)
- **Confluence hardening (P0-03b)** — Multi-site OAuth picker; label filter; column mapping; scheduled polling sync; tenant BYO OAuth app; OAuth e2e with mocked Atlassian API
- **Gemini-primary cloud stack** — `AI_PROVIDER` default `gemini`, `AI_PROVIDER_FALLBACK=openai`, OpenAI model-tier fallback (ADR 0013), env templates and cost rates for `gemini-2.5-flash-lite` / `gpt-4.1-mini` / `gpt-4.1`
- **Translations grid** — virtual scroll with infinite chunked loading (100 keys per page), fixes NaN height bug caused by scroll listener not attaching before data loaded
- **SSE real-time updates** — per-cell translation progress via Server-Sent Events instead of polling; JWT passed as query param since EventSource doesn't support headers
- **Import Excel** — bulk import from EW Main format (Field Id / Type / Field columns, only `title` rows)
- **Export Excel** — download translations grid as Excel with all language columns
- **Delete all translations** — bulk delete all translations for a project (keys preserved)
- **Delete all keys** — bulk delete all translation keys and their translations for a project
- **Bulk actions menu** — Import, Export, Delete all translations grouped under Actions dropdown in Translations page

### Fixed
- Default AI provider changed from `openai` to `gemini` in job handler and runner service
- `AI_PROVIDER=gemini` added to `.env.docker` so worker picks up Gemini without OpenAI key
- `useInfiniteKeys` — fixed `data.total` → `data.meta.total` (wrong field caused NaN height and empty grid)
- `useInfiniteKeys` — replaced `loadingRef` guard with `cancelled` flag to fix React StrictMode double-invoke bug
- `useInfiniteKeys` — added `refreshKey` counter so `refetch()` works when already on page 1
- Infinite scroll trigger — moved loadMore guard checks into refs so they're reliable across renders
- After bulk import, keys and translations both refetch immediately without page reload
