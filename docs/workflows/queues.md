# Queues and Workers

BullMQ + Redis async processing. Separate worker process from NestJS API.

## Architecture

```text
nestjs-api (producer)     nestjs-worker (consumer)
        │                          │
        └──────── Redis ───────────┘
                    │
              BullMQ queues
```

## Queue definitions

| Queue | Producer | Consumer | Concurrency |
|-------|----------|----------|-------------|
| `translation.create` | API (create job) | Worker | 5 |
| `translation.process` | create worker | Worker | 10 |
| `translation.retry` | process worker (on fail) | Worker | 5 |
| `translation.review` | approval module | Worker | 3 |
| `translation.export` | API / dashboard | Worker | 3 |
| `integration.openapi.import` | API (large OpenAPI spec) | Worker | 3 |
| `integration.import.parse` | API (import session upload) | Worker | 3 |
| `integration.import.apply` | API (import apply) | Worker | 3 |
| `webhook.send` | event handlers | Worker | 10 |

Tune concurrency per environment.

## Job payload conventions

```typescript
interface TranslationProcessJob {
  jobItemId: string;
  tenantId: string;
  correlationId: string;
}
```

Always include `tenantId` and `correlationId` for logging and scoping.

## Worker rules

1. **Idempotent** — safe to retry any job.
2. **Scoped** — load tenant context before DB access.
3. **Timeout** — AI jobs: 60s default; webhooks: 30s.
4. **Graceful shutdown** — `enableShutdownHooks`; finish in-flight jobs on SIGTERM.
5. **No HTTP in workers** — except webhook delivery and AI provider calls.

## Retry configuration

Default BullMQ options:

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 1000,
  removeOnFail: false, // keep for DLQ inspection
}
```

## Dead letter queue

Failed jobs after max retries:

- Stored in Redis failed set
- Visible in admin/monitoring
- Manual replay via admin tool (future)

## Monitoring metrics

Track via Prometheus:

- `queue_length{queue="translation.process"}`
- `job_duration_seconds`
- `job_failures_total`
- `ai_provider_errors_total`

Alerts: queue length > threshold, failure rate spike.

## Local development

Docker Compose services:

```yaml
redis:
  image: redis:7
worker:
  build: ./backend
  command: npm run worker
  depends_on: [redis, postgres]
```

## Related

- [adr/0002-bullmq-queues.md](../adr/0002-bullmq-queues.md)
- [workflows/translation-job.md](./translation-job.md)
- [patterns.md](../patterns.md)
