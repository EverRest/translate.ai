# translate.ai — Documentation Index

AI-first documentation for the **AI Translation Helper Service** (SaaS platform for project-based localization with AI providers, approval workflows, and webhooks).

Read this index first. Each doc is written so an agent can understand the system in under 60 seconds.

## Start here

| Doc | Purpose |
|-----|---------|
| [system-overview.md](./system-overview.md) | What the system is, key modules, main data flows |
| [architecture.md](./architecture.md) | Modular monolith, DDD modules, infra, ER model |
| [roadmap.md](./roadmap.md) | Product vision, MVP phases, full stack |
| [ui-roadmap.md](./ui-roadmap.md) | Frontend dashboard phases (UI-1–UI-12) |

## Agent rules

| Doc | Purpose |
|-----|---------|
| [../AGENTS.md](../AGENTS.md) | **Canonical agent playbook** — system prompt, TDD workflow, principles, docs map |
| [important.md](./important.md) | How this docs pack is organized for AI-first development |

## Implementation guides

| Doc | Purpose |
|-----|---------|
| [patterns.md](./patterns.md) | CQRS, Saga, queues, outbox, idempotency |
| [coding-standards.md](./coding-standards.md) | Naming, module layout, where logic lives |
| [nest_best_practices.md](./nest_best_practices.md) | NestJS production practices |
| [react_best_practices.md](./react_best_practices.md) | React + TypeScript practices |
| [llm.md](./llm.md) | AI provider options and hybrid pipeline |

## Domain

| Doc | Purpose |
|-----|---------|
| [domain/translation.md](./domain/translation.md) | Translation jobs, keys, memory |
| [domain/project.md](./domain/project.md) | Projects, API keys, webhooks |
| [domain/tenant.md](./domain/tenant.md) | Multi-tenant auth and isolation |
| [domain/approval.md](./domain/approval.md) | Review and publish workflow |
| [domain/ai-provider.md](./domain/ai-provider.md) | Provider abstraction layer |

## API & data

| Doc | Purpose |
|-----|---------|
| [api/conventions.md](./api/conventions.md) | REST conventions, versioning, errors |
| [api/openapi.md](./api/openapi.md) | Full API contract (paths, schemas) |
| [database/schema.md](./database/schema.md) | Tables, relations, tenant scoping |

## Features

| Doc | Purpose |
|-----|---------|
| [features/README.md](./features/README.md) | Optional capability guides |
| [features/ollama.md](./features/ollama.md) | Ollama multi-model router |

## Workflows

| Doc | Purpose |
|-----|---------|
| [workflows/translation-job.md](./workflows/translation-job.md) | End-to-end translation job flow |
| [workflows/webhooks.md](./workflows/webhooks.md) | Webhook delivery and retries |
| [workflows/queues.md](./workflows/queues.md) | BullMQ queues and workers |

## Architecture decisions

| Doc | Purpose |
|-----|---------|
| [adr/0001-modular-monolith.md](./adr/0001-modular-monolith.md) | Why modular monolith over microservices |
| [adr/0002-bullmq-queues.md](./adr/0002-bullmq-queues.md) | Async processing with BullMQ |
| [adr/0003-ai-provider-abstraction.md](./adr/0003-ai-provider-abstraction.md) | Multi-provider AI layer |
| [adr/0004-multi-tenant-isolation.md](./adr/0004-multi-tenant-isolation.md) | Tenant scoping strategy |
| [adr/0007-ollama-model-router.md](./adr/0007-ollama-model-router.md) | Ollama model routing inside ai-provider |
| [adr/0008-translation-output-validation.md](./adr/0008-translation-output-validation.md) | Heuristic output validation + auto-retries |

## Changelog

| Doc | Purpose |
|-----|---------|
| [changelog.md](./changelog.md) | Project change log |

## Product backlog (LocalizationOps)

| Doc | Purpose |
|-----|---------|
| [backlog/README.md](./backlog/README.md) | Phased tasks P1–P3 (VCS, semantic TM, replay, pipeline-as-code) |
| [backlog/shipped-baseline.md](./backlog/shipped-baseline.md) | Capabilities already shipped |

## Stack (reference)

```text
Frontend: React, TypeScript, Vite, Tailwind, TanStack Query, Zustand → frontend/
Backend: NestJS, DDD, CQRS, BullMQ, Redis, PostgreSQL, Prisma → backend/
AI: OpenAI, Gemini, Claude, Ollama
Infra: Docker Compose (postgres, redis, api, worker, frontend)
```

## Local development

```bash
# Infrastructure
docker compose up -d postgres redis
# or: make dev-infra

# Backend
cp backend/.env.example backend/.env
cd backend && npm install && npx prisma migrate dev && npm run start:dev

# Default admin (after migrate)
make db-seed
# login: admin@translate.ai / admin123

# Worker (separate terminal)
cd backend && npm run start:worker

# Frontend
cp frontend/.env.example frontend/.env
cd frontend && npm install && npm run dev
```

### Docker (full stack)

```bash
make docker-env # copies backend/.env.docker → backend/.env (if missing)
make docker-app # postgres + redis + api + worker + frontend
# Admin: admin@translate.ai / admin123 (see backend/.env.docker)
```

### Makefile (recommended)

From repo root:

```bash
make help # list all targets
make install # npm ci in backend + frontend
make hooks-install # git hooks via .husky (after git init)
make db-seed # create/update default admin user
make lint # ESLint (check mode)
make format-check # Prettier check
make typecheck # tsc both apps
make test # unit tests
make build # production build
make ci # lint + format + typecheck + test + build
./scripts/ci-local.sh # full pipeline incl. backend e2e (needs postgres/redis)
make dev-infra # start postgres + redis
```

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs
- UI: http://localhost:5173
