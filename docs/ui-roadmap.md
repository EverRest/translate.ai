# Frontend UI Roadmap

Post-MVP frontend plan for **translate.ai**. Backend phases 1–5 are complete; this doc tracks dashboard UI, advanced domain features, and Playwright tests.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Zustand, React Router, React Hook Form + Zod.

**Conventions:** [react_best_practices.md](./react_best_practices.md), [AGENTS.md](../AGENTS.md) frontend rules, [api/openapi.md](./api/openapi.md) for contracts.

---

## Current state

| Area | Status |
|------|--------|
| App shell / routing | Stub nav only |
| Auth (login, register, JWT) | Not implemented |
| API client | Unauthenticated `fetch` |
| Dashboard | Placeholder text |
| Projects | List stub (no auth) |
| Jobs, keys, approvals, etc. | Not started |

---

## Phase overview

```text
UI-1  Auth + app shell          ← start here
UI-2  Dashboard home
UI-3  Projects (list, create, detail)
UI-4  Translation keys
UI-5  Translation jobs
UI-6  Approvals
UI-7  Project settings (languages, API keys, webhooks)
UI-8  Audit logs + usage analytics
UI-9  Tenant settings
UI-10 Glossary (backend + UI)
UI-11 Branching (backend + UI)
UI-12 Playwright E2E tests
```

Implement **one phase at a time**. Each phase should be shippable (build passes, manual smoke test).

---

## UI-1 — Auth + app shell

**Goal:** Secure the app; all API calls carry JWT.

**Pages:** `/login`, `/register`

**Tasks:**
- Zustand auth store (token, user) persisted to `localStorage`
- API client: `Authorization: Bearer`, `apiPost`, error envelope parsing
- `ProtectedRoute` → redirect to login
- `AppLayout`: sidebar + header, nav links for all future pages
- Login / register forms (react-hook-form + zod)

**API:** `POST /auth/login`, `POST /auth/register`, `GET /auth/me`

**Done when:** User can register, log in, see protected shell, log out; Projects page loads with token.

---

## UI-2 — Dashboard home

**Goal:** Landing page with tenant-level overview.

**Route:** `/`

**Tasks:**
- Stat cards: project count, active jobs, pending reviews (from existing APIs)
- Usage summary widget (`GET /analytics/usage/summary`)
- Recent jobs list (last 5 from `GET /jobs`)
- Quick actions: New project, New job

**Done when:** Dashboard shows real data for logged-in user.

---

## UI-3 — Projects

**Goal:** Full project CRUD and project hub.

**Routes:** `/projects`, `/projects/:projectId`

**Tasks:**
- Paginated project table
- Create / edit / archive project modals
- Project detail layout with tabs (keys, jobs, approvals, settings)

**API:** [domain/project.md](./domain/project.md), `GET/POST/PATCH/DELETE /projects`

---

## UI-4 — Translation keys

**Goal:** Manage source keys per project.

**Route:** `/projects/:projectId/keys`

**Tasks:**
- Key list with search/filter
- Create / edit / delete key (key, description, context, sourceText)
- Bulk import (JSON upload) — stretch

**API:** `/projects/:id/keys`

---

## UI-5 — Translation jobs

**Goal:** Create and monitor AI translation jobs.

**Routes:** `/jobs`, `/jobs/:jobId`, create from project

**Tasks:**
- Job list with status badges and progress
- Create job form (languages, key selection, provider)
- Job detail: items, retry, cancel

**API:** `/jobs`, [workflows/translation-job.md](./workflows/translation-job.md)

---

## UI-6 — Approvals

**Goal:** Review workflow for translators/reviewers.

**Route:** `/projects/:projectId/approvals`

**Tasks:**
- Review grid: key, language, original, translation, status
- Actions: approve, reject, edit value, bulk approve, publish

**API:** `/projects/:id/reviews`, [domain/approval.md](./domain/approval.md)

---

## UI-7 — Project settings

**Goal:** Languages, API keys, webhooks in one settings area.

**Route:** `/projects/:projectId/settings`

**Tabs:** Languages | API Keys | Webhooks

**Tasks:**
- Languages CRUD
- API key create (show secret once) + revoke
- Webhook CRUD + event toggles

---

## UI-8 — Audit logs + analytics

**Routes:** `/audit-logs`, `/analytics`

**Tasks:**
- Paginated audit log table with filters
- Usage analytics charts (by provider, cost, fallback count)

**API:** `/audit-logs`, `/analytics/usage`

---

## UI-9 — Settings

**Route:** `/settings`

**Tasks:**
- Profile display (`GET /auth/me`)
- Tenant name display (read-only until backend supports update)

---

## UI-10 — Glossary (backend + UI)

**Depends on:** New backend module (see [roadmap.md](./roadmap.md) §14.4).

**Route:** `/projects/:projectId/glossary`

**Tasks:**
- Backend: `Glossary`, `GlossaryTerm` models + CRUD API
- UI: term list, “do not translate” flag, inject into AI prompts
- ADR required before implementation

---

## UI-11 — Branching (backend + UI)

**Depends on:** New backend module (see [roadmap.md](./roadmap.md) §14.7).

**Route:** `/projects/:projectId/branches`

**Tasks:**
- Backend: branch model, merge workflow
- UI: branch selector, diff view, merge to main
- ADR required before implementation

---

## UI-12 — Playwright E2E tests

**Goal:** Critical-path UI coverage in CI.

**Tasks:**
- Add `@playwright/test` to `frontend/`
- `playwright.config.ts` — base URL, auth fixture
- Specs: login flow, create project, create key, create job (mock or test API)
- Extend `.github/workflows/ci.yml` with `frontend-e2e` job (api + postgres + redis services)

**Target flows:**
1. Register → login → dashboard visible
2. Create project → appears in list
3. (Optional) Full translation job with worker running

---

## Shared UI building blocks

Create under `frontend/src/shared/ui/` as needed:

| Component | Used in |
|-----------|---------|
| `Button`, `Input`, `Label` | Forms |
| `Card`, `Badge`, `Table` | Lists |
| `Modal`, `Toast` | Actions |
| `PageHeader`, `EmptyState` | Layout |
| `LoadingSpinner`, `ErrorAlert` | Async states |

Prefer composition over a heavy component library until Mary UI is adopted (see [roadmap.md](./roadmap.md)).

---

## Folder structure (target)

```text
frontend/src/
├── app/
│   ├── layout/AppLayout.tsx
│   ├── providers/AppProviders.tsx
│   └── router/
│       ├── AppRouter.tsx
│       └── ProtectedRoute.tsx
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   ├── translation-keys/
│   ├── translation-jobs/
│   ├── approvals/
│   ├── audit/
│   ├── analytics/
│   └── settings/
└── shared/
    ├── api/client.ts
    └── ui/
```

---

## Timeline (estimate)

| Phase | Effort |
|-------|--------|
| UI-1 | 2–3 days |
| UI-2 | 1–2 days |
| UI-3 | 2–3 days |
| UI-4 | 2 days |
| UI-5 | 2–3 days |
| UI-6 | 2–3 days |
| UI-7 | 2 days |
| UI-8 | 1–2 days |
| UI-9 | 1 day |
| UI-10 | 1–2 weeks (incl. backend) |
| UI-11 | 2–3 weeks (incl. backend) |
| UI-12 | 2–3 days |

---

## References

- [roadmap.md](./roadmap.md) — product vision, React dashboard pages (§10)
- [api/openapi.md](./api/openapi.md) — REST contract
- [react_best_practices.md](./react_best_practices.md) — React patterns
