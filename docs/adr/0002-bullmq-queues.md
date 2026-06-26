# ADR 0002: BullMQ for Async Processing

## Status

Accepted

## Context

Translation jobs involve:

- Long-running AI API calls (seconds per item)
- Batch processing (many keys × many languages)
- Webhook delivery with retries
- Export file generation

Processing synchronously in HTTP handlers would cause timeouts and poor UX.

Options considered:

1. **BullMQ + Redis** — Node-native, good NestJS integration
2. **RabbitMQ** — mature but heavier ops
3. **AWS SQS** — cloud lock-in, overkill for MVP
4. **In-process async** — no persistence, lost on crash

## Decision

Use **BullMQ** with **Redis** for all async work.

Separate `nestjs-worker` process consumes queues. API process only enqueues.

Queues: `translation.create`, `translation.process`, `translation.retry`, `translation.review`, `translation.export`, `webhook.send`.

## Consequences

**Positive:**

- Jobs survive API restarts
- Built-in retry, backoff, concurrency control
- Excellent Node.js / TypeScript DX
- Same Redis used for caching (future)

**Negative:**

- Redis becomes critical dependency
- Must run separate worker process in production
- Job idempotency must be designed explicitly

## Rules

- Never call AI providers in HTTP request handlers
- All jobs must be idempotent
- Graceful shutdown required on worker
