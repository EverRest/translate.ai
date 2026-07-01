# Translation Job Workflow

End-to-end flow from API request to stored translations and webhook.

## Trigger

Sources:

- `POST /api/v1/jobs` (API key or JWT)
- React dashboard "Translate" action

## Steps

### 1. API — Create job

```text
Controller receives CreateJobDto
 → Validate project access (tenant + permissions)
 → CommandBus.execute(CreateTranslationJobCommand)
 → Handler:
 - Create TranslationJob (status: pending)
 - Create TranslationJobItems (key × language matrix)
 - Publish TranslationJobCreatedEvent
 - Enqueue BullMQ: translation.create
 → Return { jobId }
```

HTTP responds immediately. No AI calls in request thread.

### 2. Worker — translation.create

```text
Load job + items
 → Update job status: processing
 → For each item: enqueue translation.process
```

### 3. Worker — translation.process (per item)

```text
Load TranslationJobItem + TranslationKey + Project context
 → Build prompt options (project name, description, context, content type)
 → For up to 3 attempts:
 → Check TranslationMemory (skipped on retry attempts)
 ├── HIT → use cached translation
 └── MISS → AiProvider.translate()
 → Gemini: retry transient HTTP 502/503/429 in-provider
 → then optional GEMINI_MODEL_FALLBACK tier with same retry policy
 → then OpenAI via AI_PROVIDER_FALLBACK (cloud: openai only)
 → OpenAI (when primary or fallback): transient retry
 → then optional OPENAI_MODEL_FALLBACK tier
 → On attempt ≥ 2 or manual job retry: attach reference translations
 from sibling locales for the same key (published > approved > draft)
 → sanitizeTranslationOutput()
 → TranslationOutputValidator
 → heuristics (empty, refusal, length, script)
 → QA chain: placeholders ({{...}}, %%...%%), HTML tag balance
 ├── PASS → save draft, record quality metric, complete item
 └── FAIL → retry with skipMemory + retry hint, or mark failed
 → If all items done → mark job completed/failed
 → Publish TranslationJobCompletedEvent (or FailedEvent)
 → Enqueue webhook.send (job.failed includes failedItems)
```

### 4. Retry — translation.retry

Manual retry of failed items via `POST /jobs/:id/retry`:

- Re-enqueues failed items as `translation.process`
- In-process validation retries (up to 3) run again per item

Automatic BullMQ retries apply only to uncaught worker exceptions.

### 5. Post-completion

Optional paths:

- Auto-submit for review → approval domain
- Manual review in dashboard
- Export via `translation.export` queue

## Status transitions

### Job

```text
pending → processing → completed
 └→ failed
 └→ cancelled
```

### Item

```text
pending → processing → completed
 └→ failed (retryable)
```

## Idempotency

- Re-processing same `jobItemId` must not duplicate translations.
- Use upsert on `(translation_key_id, language)` with version bump.

## Saga compensations

| Step failed | Compensation |
|-------------|--------------|
| After job created, before enqueue | Mark job cancelled |
| After partial process | Mark failed items; job = partial/failed |
| Webhook fails | Retry via webhook.send; do not rollback translations |

## Example timeline

```text
T+0ms POST /jobs → 201 { jobId }
T+50ms translation.create worker starts
T+100ms 4 items enqueued (2 keys × 2 languages)
T+2s Item 1: memory hit → instant
T+5s Item 2: OpenAI call → stored
T+8s All items done → job.completed
T+8.1s webhook.send → customer endpoint
```

## Related

- [workflows/queues.md](./queues.md)
- [domain/translation.md](../domain/translation.md)
- [patterns.md](../patterns.md)
