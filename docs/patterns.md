# Patterns

How cross-cutting patterns are implemented in translate.ai. Follow these strictly; do not invent new patterns without an ADR.

## CQRS

Commands mutate state. Queries are read-only and must not trigger side effects.

| Type | Examples | Handler location |
|------|----------|------------------|
| Command | `CreateProjectCommand`, `CreateTranslationJobCommand`, `ApproveTranslationCommand` | `application/commands/` |
| Query | `GetProjectQuery`, `GetJobStatusQuery`, `GetTranslationsQuery` | `application/queries/` |

Rules:

- One command → one handler.
- Never mix read and write in the same handler.
- Use `@nestjs/cqrs` `CommandBus` / `QueryBus`.
- Controllers dispatch commands/queries; they do not contain business logic.

```text
Controller → DTO → Command/Query → Handler → Repository/Service → DB
```

## Event-driven communication

Modules communicate through domain events, not direct imports of other modules' repositories.

```typescript
// Good
eventBus.publish(new TranslationJobCompletedEvent(jobId));

// Bad
await this.webhookRepository.create(...); // from translation module
```

Cross-module reactions live in event handlers in the consuming module (e.g. `webhook` listens to `TranslationJobCompletedEvent`).

## Saga orchestration

Multi-step workflows use saga orchestration with compensating actions. No distributed transactions.

Example: translation job saga

```text
Step 1: Create job record → compensate: mark job cancelled
Step 2: Enqueue process jobs → compensate: remove queue jobs
Step 3: Process AI translations → compensate: mark items failed
Step 4: Notify webhook → compensate: log failed delivery
```

Each step must be idempotent. Failures trigger compensation for completed steps only.

## BullMQ / Jobs

Long-running or async work always goes through BullMQ. Never block HTTP request thread for AI calls or webhooks.

Queues:

| Queue | Purpose |
|-------|---------|
| `translation.create` | Split job into items |
| `translation.process` | Run AI translation per item |
| `translation.retry` | Retry failed items |
| `translation.review` | Post-review processing |
| `translation.export` | Generate export files |
| `webhook.send` | Deliver webhook payloads |

Job rules:

- Jobs must be **idempotent** (safe to retry).
- Use unique job IDs or deduplication keys where needed.
- Always assume a job can run twice.
- Set appropriate retry/backoff; failed jobs go to DLQ after max attempts.

## Outbox pattern (production)

For reliable event delivery (webhooks, cross-service events):

```text
DB transaction
 ├── update domain state
 └── insert outbox row
 │
 ▼
Outbox poller → publish to queue / webhook worker
```

Never publish events outside the same transaction as the state change.

## Translation Memory (cache-before-AI)

Before calling any AI provider:

```text
hash(source_text + source_lang + target_lang)
 ├── found in translation_memory → return cached value
 └── not found → call AI → store in memory
```

This is mandatory for cost control (30–80% savings).

## AI Provider abstraction

All AI calls go through `AiProvider` interface:

```typescript
interface AiProvider {
 translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}
```

Implementations: `OpenAiProvider`, `GeminiProvider`, `ClaudeProvider`, `OllamaProvider`.

Provider selection:

- Configured per project or job.
- Fallback chain: primary → secondary → local Ollama.
- Never call OpenAI/Gemini/Claude directly from controllers or job handlers.

## Repository pattern

- Domain/application layers depend on repository **interfaces**.
- Prisma implementations live in `infrastructure/`.
- Services must not import Prisma client directly.

## Multi-tenant scoping

Every repository method that reads/writes tenant data accepts or derives `tenantId`.

- Never trust client-supplied tenant ID without guard validation.
- `TenantGuard` sets tenant context from JWT or API key.

## Idempotency

| Operation | Idempotency key |
|-----------|-----------------|
| Create translation job | `(projectId, keys[], languages[], clientRequestId?)` |
| Process job item | `(jobItemId, attemptNumber)` |
| Webhook delivery | `(eventId, webhookId)` |
| Export | `(projectId, format, version)` |

## Optimistic locking (future)

Translation versioning uses `version` column; updates check expected version to prevent lost updates.

## What NOT to do

- Do not use distributed transactions across DB + queue + AI API.
- Do not call AI providers synchronously in HTTP handlers.
- Do not skip translation memory lookup.
- Do not couple modules via shared Prisma models across bounded contexts.
