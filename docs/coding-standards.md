# Coding Standards

Practical rules for NestJS backend and React frontend. Keep code explicit; avoid magic.

## General

- TypeScript everywhere (strict mode).
- Prefer small focused files over god classes.
- Do not refactor unrelated code unless requested.
- Match existing module structure before adding new patterns.

## Backend (NestJS)

### Module layout

Feature-based modules under `src/`:

```text
src/
├── translation/
│   ├── domain/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── infrastructure/
│   │   └── repositories/
│   └── presentation/
│       ├── translation.controller.ts
│       └── dto/
├── shared/
└── main.ts
```

### Controllers (thin)

Controllers handle HTTP only: validation, auth guards, dispatch command/query, return DTO.

```typescript
@Post()
create(@Body() dto: CreateJobDto) {
  return this.commandBus.execute(new CreateTranslationJobCommand(dto));
}
```

Never put business logic, AI calls, or DB queries in controllers.

### Business logic location

| Layer | Contains |
|-------|----------|
| Domain | Entities, value objects, domain events, domain exceptions |
| Application | Command/query handlers, use cases, orchestration |
| Infrastructure | Prisma repos, BullMQ producers, AI provider impl |
| Presentation | Controllers, DTOs, guards, pipes |

### DTOs and validation

- Input: class-validator DTOs with `@Is*()` decorators.
- Output: response DTOs; never return Prisma entities or raw ORM models.
- Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Module | kebab-case folder, PascalCase class | `translation/` → `TranslationModule` |
| Command | verb + noun + Command | `CreateTranslationJobCommand` |
| Query | Get + noun + Query | `GetJobStatusQuery` |
| Handler | command/query name + Handler | `CreateTranslationJobHandler` |
| DTO | action + noun + Dto | `CreateJobDto`, `JobResponseDto` |
| Repository interface | I + Entity + Repository | `ITranslationJobRepository` |
| Event | noun + past tense + Event | `TranslationJobCompletedEvent` |

### Dependency injection

- Constructor injection only; no `new Service()` in application code.
- Use tokens/symbols for repository interfaces.

### Configuration

- Use `ConfigService`; never read `process.env` directly in services.
- Validate env vars at startup (Joi schema).

### Logging

- Structured logging (Pino); no `console.log` in production code.
- Include `correlationId`, `tenantId`, `userId` where available.

### Database

- Prisma for ORM; migrations in `prisma/migrations/`.
- No raw SQL unless performance-critical and documented.
- Keep migrations reversible; no heavy logic in migrations.
- Every tenant-scoped table has `tenant_id`.

### Testing

- Unit tests for handlers, domain logic, validators.
- Integration tests for DB, Redis, BullMQ.
- E2E with Supertest for API routes.
- Target: 100% coverage (see roadmap).

## Frontend (React)

### Structure

Feature-based layout:

```text
src/
├── app/           # router, providers, store
├── features/
│   ├── projects/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   └── translation-jobs/
├── shared/        # reusable UI, hooks, utils
└── main.tsx
```

### Components

- Functional components only.
- One component = one responsibility; keep files small.
- Business logic in hooks/services, not in JSX-heavy components.

### Data fetching

- TanStack Query for server state; no `useEffect` fetch anti-pattern.
- API calls in `features/*/api/` service layer.
- Never store secrets or API keys in frontend code.

### State

- TanStack Query for remote data.
- Zustand for minimal client UI state.
- Context only for auth, theme, locale — split contexts, avoid mega-context.

### Types

- TypeScript strict; no `any`.
- Props interfaces for every component.
- Shared API types in `features/*/types/`.

### UI stack

- Tailwind CSS + Mary UI components.
- React Hook Form + Zod for forms.
- Lazy-load route pages with `React.lazy` + `Suspense`.

## API contract

- REST under `/api/v1/`.
- Consistent error shape (see [api/conventions.md](./api/conventions.md)).
- Version via URI; breaking changes require new version.

## Git / commits

- Small focused commits.
- Update [changelog.md](./changelog.md) for notable changes.

## When unsure

1. [architecture.md](./architecture.md)
2. [patterns.md](./patterns.md)
3. Find similar existing implementation
4. [nest_best_practices.md](./nest_best_practices.md) or [react_best_practices.md](./react_best_practices.md)
