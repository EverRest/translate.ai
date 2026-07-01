# System Overview

**translate.ai** is a multi-tenant SaaS platform for AI-assisted localization. Customers create projects, upload translation keys, request translations into many languages via AI providers, review and approve results, export files, and integrate through REST API + webhooks.

## What it does

1. Customer creates a **Project** with languages and translation keys.
2. Customer triggers a **Translation Job** (via dashboard or API).
3. API enqueues work to **BullMQ**; workers call **AI providers** (OpenAI, Gemini, Claude, Ollama).
4. Results are stored; **Translation Memory** avoids redundant AI calls.
5. Reviewers run **Approval** workflow (Draft → Review → Approved → Published).
6. System sends **Webhooks** on job completion and exports translations (JSON, YAML, CSV, XLSX, Android XML, iOS Strings, PO).

## Key modules

| Module | Responsibility |
|--------|----------------|
| `auth` | Authentication, JWT, refresh tokens |
| `tenant` | Organizations, multi-tenant isolation |
| `user` | Users, roles, permissions (RBAC) |
| `project` | Projects, environments, API keys, webhooks |
| `translation` | Keys, translations, jobs, memory |
| `ai-provider` | Provider abstraction, failover, prompts |
| `approval` | Reviews, comments, publish workflow |
| `webhook` | Event delivery, HMAC, retries |
| `export` | Format conversion and download |
| `audit` | Activity and audit logs |
| `billing` | Usage quotas (future) |
| `shared` | Cross-cutting utilities, guards, pipes |

## Main data flows

### Translation job (happy path)

```text
React UI / API Client
 │
 ▼
NestJS API ──► Create TranslationJob (DB)
 │
 ▼
BullMQ: translation.create
 │
 ▼
Worker: split into TranslationJobItems
 │
 ▼
BullMQ: translation.process
 │
 ▼
For each item:
 Check TranslationMemory
 └── miss → AI Provider.translate()
 └── hit → reuse cached translation
 │
 ▼
Save Translation records (status: draft)
 │
 ▼
BullMQ: webhook.send (job.completed)
```

### Approval flow

```text
Draft translation
 │
 ▼
Reviewer edits / comments
 │
 ▼
Approved → Published
 │
 ▼
Webhook: translation.approved
```

## Deployment layout

```text
server/
├── nginx # reverse proxy
├── frontend/ # React (Vite)
├── backend-api/ # NestJS REST API
├── worker/ # BullMQ workers
├── postgres/
├── redis/
├── prometheus/
├── grafana/
└── loki/
```

## Security model

- Every DB query scoped by `tenant_id`.
- `TenantGuard` on NestJS routes.
- API keys per project for external integrations.
- Webhooks signed with HMAC SHA256.

## Non-goals (for MVP)

- Microservices split (modular monolith first)
- SSO / LDAP / SCIM (enterprise phase)
- Branching / Git-like versioning (later roadmap)

## Where to go next

- Architecture details → [architecture.md](./architecture.md)
- Agent coding rules → [../AGENTS.md](../AGENTS.md)
- Implementation patterns → [patterns.md](./patterns.md)
