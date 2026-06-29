# AGENTS.md

Canonical instructions for AI coding agents (Cursor, Claude, GPT) working on **translate.ai**.

Multi-tenant SaaS for AI-assisted localization: **NestJS + React + BullMQ + PostgreSQL + Prisma**.

> **Rule:** Read `docs/` before coding. If you cannot explain the change using domain + workflow docs in 60 seconds, you do not understand it yet.

---

## Agent system prompt (use this)

Copy or internalize this when starting any task:

```text
You are a senior engineer on translate.ai (NestJS modular monolith + React).

BEFORE writing code:
1. Read docs/system-overview.md and the relevant docs/domain/*.md + docs/workflows/*.md
2. Find an existing similar handler/component and match its patterns
3. Check docs/adr/ for decisions that constrain your approach
4. Plan the smallest correct diff (KISS, DRY, SOLID)

WHILE implementing:
- CQRS: commands mutate, queries read-only; thin controllers; logic in handlers/services
- DDD: respect module boundaries; no cross-module repository imports
- TDD: write or update tests for behavior you add or change; run them
- Never call AI providers or BullMQ-heavy work from HTTP handlers
- Every tenant query filters by tenantId; never trust client-supplied tenantId
- Translation pipeline: memory → AI → sanitize → validate → save (see docs/workflows/translation-job.md)

WHEN done:
- npm run test (backend unit tests for changed logic)
- npm run typecheck && npm run lint (or make ci from repo root)
- Update docs/ only if architecture, API, or workflows changed
- New patterns require docs/adr/ before implementation
```

---

## Mandatory workflow

Follow this flow for every non-trivial task. Do not skip steps.

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. UNDERSTAND│ → │  2. PLAN    │ → │ 3. TEST     │ → │ 4. IMPLEMENT│ → │ 5. VERIFY   │
│  Read docs  │    │  Smallest   │    │  TDD: spec  │    │  Match      │    │  Tests +    │
│  + codebase │    │  correct    │    │  first or   │    │  conventions│    │  typecheck  │
│             │    │  diff       │    │  with code  │    │             │    │  + lint     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 1. Understand

| Step | Action |
|------|--------|
| Scope | What module(s)? API, worker, UI, or all three? |
| Docs | [docs/system-overview.md](docs/system-overview.md) → domain doc → workflow doc |
| Precedent | Grep for similar command, handler, hook, or page |
| ADR | Check [docs/adr/](docs/adr/) — do not violate recorded decisions |

### 2. Plan

- One concern per change; avoid drive-by refactors.
- List files to touch; name command/query/handler if backend.
- If multiple valid architectures exist, prefer the one already in the codebase.

### 3. Test (TDD)

**Tests are not optional** for behavior you add or change.

| Layer | Tool | Location |
|-------|------|----------|
| Backend unit | Jest | `*.spec.ts` next to service/util/handler |
| Backend e2e | Supertest | `backend/test/*.e2e-spec.ts` |
| Frontend | Vitest/Jest (as configured) | colocated or `__tests__/` |

TDD loop:

1. **Red** — write a failing test for the expected behavior
2. **Green** — minimal implementation to pass
3. **Refactor** — clean up; keep tests green

Test what matters: handlers, validators, prompt builders, sanitizers, domain rules — not trivial getters or framework wiring.

```bash
cd backend && npm test -- --testPathPatterns="YourFeature"
make test          # from repo root
make ci            # lint + format + typecheck + test + build
```

### 4. Implement

Apply principles below. Match existing naming, folder layout, and import style.

### 5. Verify

```bash
make typecheck     # both apps
make lint          # or npm run lint in backend/frontend
make test
```

For API/worker changes: confirm worker is required (`npm run start:worker`). For DB changes: `npx prisma migrate dev` + `npx prisma generate`.

---

## Engineering principles

| Principle | In this codebase |
|-----------|------------------|
| **TDD** | Tests before or alongside behavior; no untested business rules |
| **SOLID** | Single-purpose handlers/services; depend on abstractions (`AiProvider`); extend via new handlers not god classes |
| **DRY** | Reuse shared utils, DTOs, hooks; extract only when used twice with same semantics |
| **KISS** | Smallest diff that works; no premature abstraction |
| **CQRS** | Commands write, queries read; never mix in one handler |
| **DDD** | Bounded contexts = Nest modules; domain events for cross-module reactions |

### CQRS (strict)

```text
Controller → DTO → CommandBus/QueryBus → Handler → Service/Repository → DB/Queue
```

- Commands: `CreateTranslationJobCommand`, `ApproveTranslationCommand`, …
- Queries: `GetJobStatusQuery`, `ListTranslationsQuery`, …
- One command → one `@CommandHandler`; one query → one `@QueryHandler`
- Controllers: HTTP, auth, validation, dispatch only

### DDD module boundaries

Modules: `auth`, `tenant`, `user`, `project`, `translation`, `ai-provider`, `approval`, `webhook`, `export`, `audit`, `billing`, `glossary`, `branching`, `shared`.

```text
✅ translation handler → TranslationMemoryService (same module)
✅ webhook handler listens to TranslationJobCompletedEvent
❌ translation handler → direct Prisma writes in webhook tables
❌ import another module's repository implementation
```

Cross-module: **events**, **CommandBus**, **QueryBus** — not shared repositories.

---

## Repository layout

```text
translate.ai/
├── AGENTS.md                 ← you are here
├── docker-compose.yml
├── Makefile                  ← make ci, make dev-*, make test
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/main.ts           # HTTP API
│   ├── src/worker.main.ts    # BullMQ worker (separate process)
│   └── src/{module}/         # domain | application | infrastructure | presentation
├── frontend/
│   └── src/features/         # api/ hooks/ components/ pages/ types/
└── docs/                     # single source of truth — see docs/README.md
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Vite, Tailwind, TanStack Query, Zustand, RHF + Zod |
| Backend | NestJS, CQRS, Prisma, PostgreSQL |
| Async | BullMQ, Redis — **always separate worker process** |
| AI | OpenAI, Gemini, Claude, Ollama via `ai-provider` module |

---

## Translation pipeline (critical path)

Full detail: [docs/workflows/translation-job.md](docs/workflows/translation-job.md)

```text
Create job (API) → translation.create → translation.process (per item)
  → Load key + project context (name, description, contentType, context)
  → TranslationMemory lookup (skip on retry)
  → AiProvider.translate() via ProviderRegistry + fallback chain
  → sanitizeTranslationOutput()
  → TranslationOutputValidator (heuristic, up to 3 attempts)
  → Upsert Translation (draft) + quality metric
  → Job complete/fail → webhook (job.failed includes failedItems)
```

Other rules:

- **Retranslate** (`POST /translations/:id/retranslate`): forget memory + mini job — see `approval` module
- **Prompt context**: [docs/domain/translation.md](docs/domain/translation.md) — `contentType`, `description`, `context`, project name
- **Validation ADR**: [docs/adr/0008-translation-output-validation.md](docs/adr/0008-translation-output-validation.md)

---

## Queue / jobs

Long-running work **must** use BullMQ. Never block HTTP for AI, exports, or webhooks.

| Queue | Purpose |
|-------|---------|
| `translation.create` | Split job into items |
| `translation.process` | AI translate one item |
| `translation.retry` | Manual retry failed items |
| `translation.export` | Export files |
| `webhook.send` | Deliver webhooks |

Jobs must be **idempotent**. See [docs/workflows/queues.md](docs/workflows/queues.md).

---

## Multi-tenant

- Every tenant-scoped query filters by `tenant_id`
- `TenantGuard` / JWT / API key — never trust body `tenantId`
- Test cross-tenant access is denied

---

## Frontend

- Features under `frontend/src/features/{feature}/`
- `api/` — HTTP calls; `hooks/` — TanStack Query; `pages/` — routes; `types/` — shared types
- No secrets in frontend; no business logic in large JSX blobs

---

## Definition of done

- [ ] Behavior covered by unit tests (new/changed logic)
- [ ] `make typecheck` passes
- [ ] `make lint` passes (or no new violations)
- [ ] Prisma migration if schema changed + `prisma generate`
- [ ] No logic in controllers; CQRS respected
- [ ] Tenant scoping preserved
- [ ] Docs/ADR updated if architecture or API contract changed
- [ ] Smallest diff — no unrelated refactors

---

## Documentation map (`docs/`)

Index: [docs/README.md](docs/README.md) · AI-first guide: [docs/important.md](docs/important.md)

### Read first (60-second orientation)

| Doc | Purpose |
|-----|---------|
| [docs/system-overview.md](docs/system-overview.md) | Modules, main flows |
| [docs/architecture.md](docs/architecture.md) | Modular monolith, layers, ER |
| [docs/patterns.md](docs/patterns.md) | CQRS, events, saga, idempotency, memory |
| [docs/coding-standards.md](docs/coding-standards.md) | Naming, layout, testing |

### Domain (read before touching a module)

| Doc | Module |
|-----|--------|
| [docs/domain/translation.md](docs/domain/translation.md) | `translation` — jobs, keys, memory, contentType |
| [docs/domain/approval.md](docs/domain/approval.md) | `approval` — review, retranslate, publish |
| [docs/domain/ai-provider.md](docs/domain/ai-provider.md) | `ai-provider` — prompts, providers, Ollama router |
| [docs/domain/project.md](docs/domain/project.md) | `project` — keys, webhooks, languages |
| [docs/domain/tenant.md](docs/domain/tenant.md) | `tenant` — isolation, auth |

### Workflows (read before changing behavior)

| Doc | Flow |
|-----|------|
| [docs/workflows/translation-job.md](docs/workflows/translation-job.md) | Job create → process → validate → webhook |
| [docs/workflows/queues.md](docs/workflows/queues.md) | BullMQ queues and worker |
| [docs/workflows/webhooks.md](docs/workflows/webhooks.md) | HMAC delivery, retries |

### API & data

| Doc | Purpose |
|-----|---------|
| [docs/api/conventions.md](docs/api/conventions.md) | REST, errors, versioning |
| [docs/api/openapi.md](docs/api/openapi.md) | Full API contract |
| [docs/database/schema.md](docs/database/schema.md) | Tables, relations |
| [docs/database/migrations-notes.md](docs/database/migrations-notes.md) | Prisma migration rules |

### Features & LLM

| Doc | Purpose |
|-----|---------|
| [docs/llm.md](docs/llm.md) | Hybrid AI pipeline |
| [docs/features/ollama.md](docs/features/ollama.md) | Local Ollama setup |

### Architecture decisions (ADR) — do not violate

| ADR | Topic |
|-----|-------|
| [0001](docs/adr/0001-modular-monolith.md) | Modular monolith |
| [0002](docs/adr/0002-bullmq-queues.md) | BullMQ async |
| [0003](docs/adr/0003-ai-provider-abstraction.md) | AI provider layer |
| [0004](docs/adr/0004-multi-tenant-isolation.md) | Tenant isolation |
| [0005](docs/adr/0005-project-glossary.md) | Glossary |
| [0006](docs/adr/0006-project-branching.md) | Branching |
| [0007](docs/adr/0007-ollama-model-router.md) | Ollama model routing |
| [0008](docs/adr/0008-translation-output-validation.md) | Output validation + retries |
| [0015](docs/adr/0015-glossary-sets.md) | Multi-glossary sets, single active |

New pattern → new ADR before code.

### Implementation guides

| Doc | Purpose |
|-----|---------|
| [docs/nest_best_practices.md](docs/nest_best_practices.md) | NestJS |
| [docs/react_best_practices.md](docs/react_best_practices.md) | React |
| [docs/ui-roadmap.md](docs/ui-roadmap.md) | Dashboard phases |
| [docs/roadmap.md](docs/roadmap.md) | Product roadmap |
| [docs/changelog.md](docs/changelog.md) | Notable changes |

### Product backlog (LocalizationOps)

| Doc | Purpose |
|-----|---------|
| [docs/backlog/README.md](docs/backlog/README.md) | Phased tasks P1–P3 — next features to build |
| [docs/backlog/shipped-baseline.md](docs/backlog/shipped-baseline.md) | Already shipped — extend, do not re-implement |

---

## When unsure — read order

1. [docs/system-overview.md](docs/system-overview.md)
2. [docs/architecture.md](docs/architecture.md)
3. [docs/patterns.md](docs/patterns.md)
4. [docs/coding-standards.md](docs/coding-standards.md)
5. Relevant [docs/domain/](docs/domain/) doc
6. Relevant [docs/workflows/](docs/workflows/) doc
7. Relevant [docs/adr/](docs/adr/) doc
8. Similar existing code in the repo

---

## What NOT to do

- Do not skip tests for business logic, validators, or prompt/sanitize utilities
- Do not put business logic in controllers or React page components
- Do not call AI providers synchronously in HTTP handlers
- Do not skip translation memory before AI (except `skipMemory` on validation retry)
- Do not bypass tenant guards or filter without `tenantId`
- Do not introduce new patterns without ADR + docs update
- Do not refactor unrelated code in the same PR unless asked
- Do not use `console.log` in production paths — use structured logging (Pino)
- Do not read `process.env` in services — use `ConfigService`

---

## Local dev (quick)

```bash
make dev-infra      # postgres + redis
make dev-backend    # API :3000
make dev-worker     # required for translation jobs
make dev-frontend   # UI :5173
make db-seed        # admin@translate.ai / admin123
make ci             # full check before push
```

API: `http://localhost:3000/api/v1` · Swagger: `/api/docs` · UI: `http://localhost:5173`
