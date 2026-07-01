# Changelog

## [Unreleased]

### Added
- **Placeholder count in job summary (P0-S02)** — `GET /jobs/:id` includes optional `placeholderSummary` (`placeholdersTotal`, `placeholdersPreserved`); omitted when zero; `job.completed` / `job.failed` webhooks include it when placeholders exist; job detail UI banner
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
