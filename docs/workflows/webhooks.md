# Webhook Workflow

Delivers events to customer-configured HTTPS endpoints when domain events occur.

## Supported events

| Event | Trigger |
|-------|---------|
| `job.created` | Translation job created |
| `job.completed` | All items processed successfully |
| `job.failed` | Job failed or partially failed |
| `translation.approved` | Translation published |
| `project.created` | New project created |

## Payload shape

```json
{
  "event": "job.completed",
  "timestamp": "2026-06-25T12:00:00Z",
  "data": {
    "jobId": "uuid",
    "projectId": "uuid",
    "status": "completed"
  }
}
```

## Delivery flow

```text
Domain event (e.g. TranslationJobCompletedEvent)
  → WebhookEventHandler
  → Load enabled webhooks for project
  → For each webhook: enqueue webhook.send
        │
        ▼
Worker: webhook.send
  → Build payload
  → Sign: HMAC-SHA256(payload, webhook.secret)
  → POST to webhook.url
      Headers:
        X-Webhook-Signature: sha256=<hex>
        X-Webhook-Event: job.completed
        X-Request-Id: <correlation-id>
  → Success (2xx) → log delivery
  → Failure → retry with backoff
  → Max retries exceeded → Dead Letter Queue
```

## Security

- HTTPS URLs only (validate on create).
- HMAC signature on every payload; customers verify before processing.
- Never include secrets or full API keys in payload.

## Retry policy

| Attempt | Delay |
|---------|-------|
| 1 | immediate |
| 2 | 1 min |
| 3 | 5 min |
| 4 | 30 min |
| 5 | 2 hours |

After 5 failures → DLQ + audit log + optional admin alert.

## Idempotency

Customers should treat webhooks as at-least-once delivery.

- Include stable `eventId` in payload for deduplication.
- Same event may be delivered more than once on retry.

## Customer verification (docs for integrators)

```typescript
const expected = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

if (`sha256=${expected}` !== req.headers['x-webhook-signature']) {
  throw new Error('Invalid signature');
}
```

## Rules

- Webhook delivery never blocks API or translation workers (always queued).
- Failed webhooks do not rollback translation state.
- Log every attempt in audit_logs.

## Related

- [domain/project.md](../domain/project.md)
- [workflows/queues.md](./queues.md)
