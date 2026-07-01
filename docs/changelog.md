# Changelog

All notable changes to translate.ai documentation and project.

## [Unreleased]

### Added — Confluence file import (P0-03 Phase 1)

Per [ADR 0016](./adr/0016-external-import.md):

- **Module:** `integration` bounded context — `ImportParser` registry, staging via `ImportSession` / `ImportSessionItem`
- **Parsers:** Confluence HTML table, CSV, ZIP export, paste HTML; scope + hints encoded in `TranslationKey.context`
- **Queues:** `integration.import.parse`, `integration.import.apply` — sync when ≤200 rows; async for large files
- **API:** `POST .../import/sessions`, paste, preview, apply under `/projects/:id/import`
- **UI:** Project **Import** tab — upload/paste, diff preview, apply with conflict strategy
- **UI:** Hints column on Translations grid (parsed from key context)
- **Tests:** unit parsers + `import-confluence.e2e-spec.ts` (850-key demo fixture, &lt;30s)

Phase 2 (Atlassian OAuth live sync) remains backlog.

### Added — Entities, collections, OpenAPI import

Per [ADR 0017](./adr/0017-entity-collections.md):

- **Schema:** `EntityCollection`, `LocalizationObject.collectionId`
- **API:** `/projects/:id/collections` CRUD; filter objects by `collectionId`
- **API:** OpenAPI preview + import into collection (`integration.openapi.import` queue for large specs)
- **UI:** Tab renamed **Entities** (`/entities` routes; `/objects` redirects); collection sidebar; import wizard
- **Parser:** `openapi-to-structure.parser.ts` — one entity per OpenAPI tag

### Added — Localization objects polish (P3-12 follow-up)

- **API:** `localizationObjectId` / `keyPrefix` filters on keys and translations list
- **API:** `POST .../materialize?prune=true` removes orphan keys for an object
- **UI:** Node inspector sidebar, edit object metadata, object filter chip on Keys/Translations
- **UI:** Materialize prune checkbox, list progress bar, node type icons

### Fixed — E2E test isolation

- **E2E:** `BULLMQ_PREFIX=e2e-{pid}` isolates BullMQ queues from local dev worker
- **E2E:** `MOCK_TRANSLATIONS=true` via `setupFiles` + test-env fallback in `TranslateTextService`
- **Tests:** `localization-objects.e2e-spec.ts` — template + materialize smoke (no AI)

### Added — Localization objects AI + templates (P3-12b/c)

- **Queue:** `localization-object.generate` — AI builds node tree from object name/description
- **API:** `POST .../generate-structure`, `POST .../apply-template`, `GET .../objects/templates`
- **Templates:** `login_form`, `registration_form` (built-in, no AI)
- **UI:** **Generate with AI** button + **Apply template** dropdown on object detail
- **Schema:** `generationStatus`, `generationError` on `LocalizationObject`
- **Service:** `AiCompletionService` for JSON structure generation (Gemini → OpenAI fallback)

### Added — Localization objects (P3-12a)

Per [adr/0014-localization-objects.md](./adr/0014-localization-objects.md) and [domain/localization-object.md](./domain/localization-object.md):

- **Schema:** `LocalizationObject`, `LocalizationNode`; optional `TranslationKey.localizationObjectId`
- **API:** CRUD objects/nodes, `materialize`, `translate` under `/projects/:id/objects`
- **Module:** `localization-object` — flatten tree → dotted keys, idempotent materialize
- **UI:** Project tab **Objects** — list, tree editor, materialize, translate all
- **Tests:** `flatten-tree.utils`, `materialize-object.service`, node content-type mapping

### Changed — AI provider UI uses server config

- **API:** `GET /api/v1/config/ai` — `defaultProvider`, `supportedProviders`, `providerFallback` (no secrets)
- **UI:** Removed hardcoded provider dropdown from Create Job modal; jobs use server `AI_PROVIDER` unless API sets `provider`
- **UI:** Jobs list/detail show `defaultProvider` from config when job has no stored provider
- **Docs:** OpenAPI updated for optional `provider` on job create

### Added — Gemini-primary cloud provider stack (P1-07, shipped)

Per [adr/0013-openai-model-fallback.md](./adr/0013-openai-model-fallback.md), [domain/ai-provider.md](./domain/ai-provider.md), and [backlog/shipped-baseline.md](./backlog/shipped-baseline.md):

- **Config:** `AI_PROVIDER` env (default `gemini`) wired in validation schema and job creation when API/UI omit provider
- **Env:** `AI_PROVIDER_FALLBACK=openai` for cloud testing (Gemini → OpenAI only, no Ollama)
- **Models:** `GEMINI_MODEL=gemini-2.5-flash-lite`, `OPENAI_MODEL=gpt-4.1-mini`, `OPENAI_MODEL_FALLBACK=gpt-4.1`
- **OpenAI:** model-tier fallback inside `OpenAiProvider` (mirrors ADR 0011 Gemini pattern)
- **UI:** Create job modal no longer sends a hardcoded provider; server `AI_PROVIDER` applies
- **Cost:** analytics rates for `gpt-4.1-mini`, `gpt-4.1`, `gemini-2.5-flash-lite` in `prompt.builder`
- **Templates:** `backend/.env.example`, `.env.dev.example`, `.env.docker` updated
- **Tests:** provider registry, model-chain utils, cost estimator unit tests

### Added — Auto glossary suggestions (P1-03)

Per [adr/0012-auto-glossary-suggestions.md](./adr/0012-auto-glossary-suggestions.md):

- **Schema:** `GlossarySuggestion` + `GlossarySuggestionStatus` enum; migration `20260629120000_glossary_suggestions`
- **Miner:** heuristic corpus scan (identical terms, stable pairs, product codes, capitalized tokens); unit tests for merge/ranking
- **Queue:** `glossary.analyze` worker job replaces pending suggestions per project
- **API:** `GET/POST .../glossary/suggestions`, analyze, approve, reject
- **Config:** `GLOSSARY_ANALYZE_MIN_TRANSLATIONS`, `GLOSSARY_ANALYZE_MAX_SUGGESTIONS`
- **UI:** Glossary tab — **Suggest terms**, pending suggestions table with approve/reject

### Added — Export UI + async export queue

Per [backlog/shipped-baseline.md](./backlog/shipped-baseline.md):

- **Frontend:** project **Export** tab — format, language, status; polls async jobs until download ready
- **Sync API:** `GET /projects/:id/export` (unchanged fast path)
- **Async API:** `POST /projects/:id/exports`, `GET /exports/:id`, `GET /exports/:id/download`
- **Worker:** `translation.export` processor; `ExportJob` Prisma model; files in `EXPORT_STORAGE_DIR`
- **Config:** `EXPORT_ASYNC_THRESHOLD` (default 1000), `EXPORT_JOB_TTL_HOURS`, `EXPORT_STORAGE_DIR`
- **Tests:** `ExportFormatService` unit tests; `RequestExportHandler` async/sync handler tests

### Added — Extended QA validators

Per extended [adr/0008-translation-output-validation.md](./adr/0008-translation-output-validation.md) and [backlog/shipped-baseline.md](./backlog/shipped-baseline.md):

- **PlaceholderValidator** (`translation/application/validators/`): reject output when `{{...}}` or `%%...%%` tokens differ from source
- **HtmlTagBalanceValidator:** reject unbalanced HTML when source contains tags
- **Integration:** composable QA chain runs after heuristic checks in `TranslationOutputValidator`; failures retry up to 3 attempts with validator name in job item error
- **Config:** `TRANSLATION_QA_VALIDATORS_ENABLED` (default `true`; heuristics still controlled by `TRANSLATION_VALIDATION_ENABLED`)
- **Deferred:** markdown fence validator, link warn-only mode, per-project `qaProfile` (future backlog)

### Added — Gemini model tier fallback

Per [adr/0011-gemini-model-fallback.md](./adr/0011-gemini-model-fallback.md):

- **GeminiProvider:** after primary model exhausts transient retries, try `GEMINI_MODEL_FALLBACK` before provider fallback to Ollama
- **Config:** `GEMINI_MODEL_FALLBACK` (optional)

### Added — Gemini transient HTTP retry

Per [adr/0010-gemini-transient-http-retry.md](./adr/0010-gemini-transient-http-retry.md):

- **GeminiProvider:** exponential backoff retry on HTTP 502/503/429 before provider fallback
- **Config:** `GEMINI_TRANSIENT_RETRIES`, `GEMINI_TRANSIENT_RETRY_DELAY_MS`

### Added — Cross-locale reference on retry

Per [features/cross-locale-reference.md](./features/cross-locale-reference.md) and [adr/0009-cross-locale-reference-on-retry.md](./adr/0009-cross-locale-reference-on-retry.md):

- **Reference translations:** on validation retry (attempt ≥ 2) or manual job retry, inject up to 8 sibling locale translations into the AI prompt
- **Utils:** `reference-translation.utils.ts`, `reference-translation-prompt.utils.ts`
- **Payload:** `includeReferenceTranslations` on `translation.process` queue jobs from `translation.retry`

### Changed — Agent instructions

- **AGENTS.md:** Full rewrite — agent system prompt, mandatory workflow (understand → plan → TDD → implement → verify), SOLID/DRY/KISS/CQRS/DDD, updated translation pipeline, complete docs/ADR map, definition of done

### Added — Product backlog (LocalizationOps)

- **docs/backlog/:** Restructured from [raw.md](./backlog/raw.md) vision into phased tasks (P1–P3)
- [shipped-baseline.md](./backlog/shipped-baseline.md) — reference for already-built capabilities
- Removed completed micro-tasks (context, validation, trimming) — covered in shipped baseline + ADRs

### Added — Developer tooling

- **Makefile:** `make help`, `install`, `lint`, `format`, `typecheck`, `test`, `build`, `ci`, dev/db/docker targets
- **Scripts:** `scripts/ci-local.sh` — full local CI mirror (backend e2e + frontend tests)
- **Shared config:** root `.editorconfig`, `.prettierrc`, `.prettierignore`, `.nvmrc` (Node 22)
- **Backend:** `lint:check`, `format:check` scripts
- **Frontend:** ESLint + Prettier + Vitest; `typecheck`, `lint:check`, `format:check`, `test:cov`
- **CI:** format check, frontend typecheck + unit tests

### Added — Ollama multi-model router

Per [features/ollama.md](./features/ollama.md) and [adr/0007-ollama-model-router.md](./adr/0007-ollama-model-router.md):

- **Model router:** Qwen (default), Llama (fast/short), NLLB (literal) selected by content type
- **Classifier:** rule-based + optional AI classifier (`OLLAMA_ROUTING_MODE`)
- **Polish pipeline:** optional second pass (`OLLAMA_POLISH_ENABLED`)
- **Services:** `OllamaClient`, `ContentClassifierService`, `OllamaModelRouterService`, `OllamaPolishService`
- **Docker:** optional `ollama` Compose profile + [infra/ollama/README.md](../infra/ollama/README.md)
- **Jobs:** infer `contentType` from translation key context

### Added — UI-11 (backend + frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-11 and [adr/0006-project-branching.md](./adr/0006-project-branching.md):

- **Branching module:** `ProjectBranch`, `BranchTranslation` models + migration
- **API:** list/create branches, diff vs main, update branch translation, merge to main
- **Main branch:** canonical translations stay in `translations` table; feature branches use snapshots
- **UI:** `/projects/:id/branches` — branch list, diff view, inline edit, merge action
- **RBAC:** create/merge/edit require admin or developer

### Added — UI-10 (backend + frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-10 and [adr/0005-project-glossary.md](./adr/0005-project-glossary.md):

- **Glossary module:** `Glossary`, `GlossaryTerm` models + migration
- **API:** CRUD at `/projects/:id/glossary/terms`
- **AI prompts:** glossary rules injected via `buildTranslationPrompts`
- **Translation jobs:** load project glossary terms before each AI call
- **UI:** `/projects/:id/glossary` tab — term list, do-not-translate flag, search

### Added — UI-9 (frontend + backend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-9:

- **Settings page:** `/settings` — read-only profile and organization sections
- **Profile:** email, role, user ID
- **Organization:** tenant name, slug, tenant ID
- **Backend:** `GET /auth/me` now includes `tenant` object

### Added — UI-8 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-8:

- **Audit logs:** `/audit-logs` — paginated table with entity filter
- **Analytics:** `/analytics` — summary stats, provider/cost/fallback charts, usage log table
- **Filters:** project and date range on analytics; entity filter on audit logs
- **RBAC:** analytics page restricted to admin/developer (matches API)

### Added — UI-7 (frontend + backend webhooks)

Per [ui-roadmap.md](./ui-roadmap.md) UI-7:

- **Settings tab:** Languages, API Keys, Webhooks sub-tabs
- **Languages:** add/remove target language codes
- **API keys:** create (secret shown once), revoke
- **Webhooks:** create (secret shown once), enable/disable, delete
- **Backend:** webhook CRUD on `ProjectResourcesController`

### Added — UI-6 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-6:

- **Approvals tab:** pending review + ready to publish tabs
- **Actions:** approve, reject (with comment), edit value, bulk approve, publish
- **RBAC:** admin/reviewer only; role message for others
- **API:** `GET /projects/:id/reviews?status=pending|approved`

### Added — UI-5 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-5:

- **Jobs list:** global `/jobs` and project tab `/projects/:id/jobs`
- **Create job modal:** project, languages, keys, provider selection
- **Job detail:** progress bar, auto-refresh, retry and cancel actions

### Added — UI-4 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-4:

- **Translation keys tab:** list, search, create, edit (description/context), delete
- **API integration:** `/projects/:id/keys` CRUD

### Added — UI-3 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-3:

- **Projects list:** paginated table, create/edit modals, archive action
- **Project detail:** tabbed layout (Overview, Keys, Jobs, Approvals, Settings)
- **Overview tab:** project metadata + inline edit
- **API client:** `apiPatch`, `apiDelete`
- Placeholder tabs for UI-4–UI-7

### Added — UI-2 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-2:

- **Dashboard stats:** project count, active jobs, pending reviews (reviewer/admin)
- **Recent jobs** list (last 5)
- **AI usage summary** widget (admin/developer)
- **Quick actions:** links to Projects and Jobs

### Added — UI-1 (frontend)

Per [ui-roadmap.md](./ui-roadmap.md) UI-1:

- **Auth:** login, register, JWT store (Zustand + localStorage), protected routes
- **App shell:** sidebar layout, sign out, nav stubs for upcoming pages
- **API client:** Bearer token, POST helper, error parsing
- **Docs:** [ui-roadmap.md](./ui-roadmap.md) — full UI-1–UI-12 plan

### Added — Phase 5.3 (tests)

Per [roadmap.md](./roadmap.md) Phase 5:

- **Unit tests:** prompt builder, provider fallback registry, Prometheus metrics service
- **E2E tests:** health check (`/api/v1/health`) and metrics scrape (`/metrics`)
- **Backend script:** `npm run typecheck`

### Added — Phase 5.2 (CI/CD)

Per [roadmap.md](./roadmap.md) Phase 5:

- **GitHub Actions CI:** lint, build, unit tests, e2e tests (backend); lint, build (frontend); Docker image build
- Workflow: `.github/workflows/ci.yml` — runs on push/PR to `main`/`master`

### Added — Phase 5.1 (monitoring)

Per [roadmap.md](./roadmap.md) Phase 5:

- **Prometheus metrics:** `GET /metrics` — HTTP latency, queue depth, job outcomes, AI cost, webhook deliveries
- **Health checks:** Redis added alongside PostgreSQL at `GET /api/v1/health`
- **Docker monitoring stack:** `docker compose --profile monitoring up` — Prometheus (:9090), Grafana (:3001)

### Added — Phase 4 (backend)

Per [roadmap.md](./roadmap.md) Phase 4, [domain/ai-provider.md](./domain/ai-provider.md):

- **Multi-provider AI:** `GeminiProvider`, `OllamaProvider` alongside existing OpenAI
- **Fallback chain:** configurable via `AI_PROVIDER_FALLBACK` (default `gemini,ollama`); audit log on fallback
- **Usage tracking:** `AiUsageLog` model — tokens + estimated cost per translation call
- **Cost analytics:** `GET /api/v1/analytics/usage`, `GET /api/v1/analytics/usage/summary` (admin/developer)
- **Config:** `GEMINI_MODEL`, `OLLAMA_MODEL`, `AI_PROVIDER_FALLBACK`

### Added — Phase 3 (backend)

Per [roadmap.md](./roadmap.md) Phase 3, [domain/approval.md](./domain/approval.md), [workflows/webhooks.md](./workflows/webhooks.md), [api/conventions.md](./api/conventions.md):

- **Approval workflow:** list reviews, approve, reject, publish, edit value, bulk approve
- **RBAC:** global `RolesGuard` + `@Roles(admin, reviewer)` on approval routes
- **Audit logs:** `AuditService` + `GET /api/v1/audit-logs` (all approval/export actions logged)
- **Export:** `GET /api/v1/projects/:id/export` — json, yaml, csv, android-xml, ios-strings, po
- **Webhooks:** `translation.approved` on publish via `TranslationPublishedEvent`

### Added — Phase 2 (backend)

Per [roadmap.md](./roadmap.md) Phase 2, [workflows/translation-job.md](./workflows/translation-job.md), [workflows/webhooks.md](./workflows/webhooks.md), [domain/ai-provider.md](./domain/ai-provider.md), [patterns.md](./patterns.md):

- **Translation jobs:** real `CreateTranslationJobCommand` — creates job items, enqueues `translation.create`, returns `{ jobId }`
- **Job queries:** `GET /jobs`, `GET /jobs/:id` with progress counts; `POST retry`, `POST cancel`
- **Workers:** `translation.create` → fan-out `translation.process`; memory lookup + OpenAI; job completion events
- **OpenAI provider:** `OpenAiProvider` via [adr/0003-ai-provider-abstraction.md](./adr/0003-ai-provider-abstraction.md)
- **Translation memory:** hash cache before AI calls; unique `(tenant_id, hash)`
- **Webhooks:** event handlers for `job.created`, `job.completed`, `job.failed`; HMAC delivery via `webhook.send` queue
- **Schema:** `TranslationKey.sourceText` required for translation jobs

### Added — Phase 1 MVP (backend)

Per [roadmap.md](./roadmap.md) Phase 1 and [domain/tenant.md](./domain/tenant.md), [domain/project.md](./domain/project.md), [domain/translation.md](./domain/translation.md):

- **Auth:** `POST /api/v1/auth/register`, `login`, `GET me` — JWT, argon2 passwords ([api/openapi.md](./api/openapi.md))
- **Multi-tenant:** global `JwtAuthGuard`, `tenantId` from JWT on all protected routes ([adr/0004-multi-tenant-isolation.md](./adr/0004-multi-tenant-isolation.md))
- **Projects:** CQRS CRUD + archive ([patterns.md](./patterns.md))
- **API keys:** create (secret shown once), list, revoke
- **Languages:** `project_languages` table + CRUD per project
- **Translation keys:** CQRS CRUD under `/projects/:id/keys`
- **API error envelope** per [api/conventions.md](./api/conventions.md)
- Prisma model: `ProjectLanguage`

### Added — Monorepo scaffold
  - `backend/` — NestJS API with DDD module skeletons, Prisma schema, BullMQ worker
  - `frontend/` — React + Vite + Tailwind + TanStack Query feature structure
  - `docker-compose.yml` — postgres, redis, api, worker, frontend
  - `backend/.env.example`, `frontend/.env.example`
- **OpenAPI docs:** `docs/api/openapi.md`
- **Docs translated to English:** `docs/important.md`
- AI-optimized docs pack:
  - `docs/README.md`, `system-overview.md`, `patterns.md`, `coding-standards.md`
  - `docs/domain/`, `docs/api/`, `docs/database/`, `docs/workflows/`, `docs/adr/`
- `AGENTS.md` — Cursor / LLM agent instructions

### Backend modules (skeleton)

`auth`, `tenant`, `user`, `project`, `translation`, `ai-provider`, `webhook`, `approval`, `export`, `audit`, `billing`, `shared`, `worker`

Stub controllers: projects, jobs, auth status. Swagger at `/api/docs`.

### Existing docs (pre-pack)

- `docs/architecture.md`, `roadmap.md`, `llm.md`
- `docs/nest_best_practices.md`, `react_best_practices.md`
