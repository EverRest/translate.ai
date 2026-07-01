# Shipped baseline (not backlog)

Reference only — do **not** re-implement. Details live in `docs/domain/`, `docs/adr/`, and code.

| Capability | Where |
|------------|--------|
| Translation memory (Postgres hash) | `TranslationMemoryService`, ADR implicit in patterns |
| Multi-provider fallback | `ProviderRegistryService`, ADR 0003 |
| Gemini-primary cloud stack | `AI_PROVIDER`, `AI_PROVIDER_FALLBACK`, ADR 0010/0011/0013, `OpenAiProvider`, `GeminiProvider` |
| Ollama model router + classifier | ADR 0007, `OllamaModelRouterService` |
| Key context + contentType in prompts | `translation-context.utils`, `prompt.builder` |
| Output sanitize + heuristic validation + 3 retries | ADR 0008, `translation-sanitize.utils`, `TranslationOutputValidator` |
| QA validators (placeholders, HTML tag balance) | ADR 0008, `translation/application/validators/`, `TRANSLATION_QA_VALIDATORS_ENABLED` |
| Manual glossary | ADR 0005, `glossary` module |
| Auto glossary suggestions | ADR 0012, `GlossarySuggestion`, `glossary.analyze` queue |
| Glossary platform (P0-S01) | `glossary` module; presets in `glossary/domain/glossary-presets.ts`; prompt injection via `buildTranslationPrompts`; FIFA `fifa_accreditation` preset (24 terms) |
| Branching | ADR 0006, `branching` module |
| Approval + retranslate | `approval` module |
| Webhooks (job + publish) | `webhook` module |
| Usage + quality analytics | `billing` module, Analytics UI |
| Export API (sync) | `export` module — json/yaml/csv/android-xml/ios-strings/po |
| Export UI + async queue | `ExportJob`, `translation.export` worker, project Export tab |
| Confluence file import (P0-03 Phase 1) | ADR 0016, `integration` module, `ImportSession`, Confluence HTML/CSV/ZIP parsers, project Import tab |
| Confluence live sync (P0-03 Phase 2) | OAuth 3LO, `ConfluenceConnection`, `integration.confluence.sync` queue, Settings → Integrations; `oauthAvailable` UX when OAuth not configured |
| Confluence hardening (P0-03b) | Site picker, label filter, column mapping, scheduled sync, tenant BYO OAuth, OAuth e2e mocks |
| Placeholder protection + job summary (P0-S02) | `PlaceholderValidator` (`translation/application/validators/placeholder.validator.ts`); `placeholder.utils.ts`; optional `placeholderSummary` on `GET /jobs/:id` and `job.completed` / `job.failed` webhooks; job detail UI banner |
| Sport-domain AI context (P0-01) | `Project.domainProfile` (Prisma); `backend/src/shared/domain/domain-presets.ts`; `domain-presets.handler.ts`, `copy-project-settings.handler.ts`; `GET /projects/:id/domain-presets`; `POST .../copy-settings`; domain block in `prompt.builder.ts`; `fifa_accreditation` glossary preset; `DomainContextPanel.tsx`; `ProjectOnboardingModal.tsx` |
| Terminology drift detection (P2-05 MVP) | `terminology_drift_issues` (Prisma); `TerminologyDriftService`, `terminology-drift.utils.ts`; `terminology.scan` queue (`terminology.processor.ts`); `terminology.controller.ts` (scan/list/count/key-hints/resolve); `TerminologyDriftTable.tsx`, `useTerminologyDrift.ts`; Glossary nav badge |
| Consistency check UX Wave 1 (P0-07) | `Project.autoTerminologyScan` (default `true`); `TerminologyScanOnJobCompletedHandler`; `ConsistencySettingsPanel.tsx`; post-job toast; translations grid drift hints (`ProjectTranslationsPage.tsx`) |
| Excel round-trip + delta import (P0-02 MVP) | `integration/domain/parsers/excel.parser.ts`, `wiz-classic-preset.ts`; `excel-import.controller.ts`; `excel.handlers.ts`, `excel-delta-translate.service.ts`, `excel-compose.service.ts`; queues `integration.excel.parse`, `integration.excel.compose` (`excel.processor.ts`); `ExcelImportPanel.tsx`, Import tab Excel mode (`ProjectImportPage.tsx`) |

When extending the platform, **build on these modules** — do not fork parallel implementations.
