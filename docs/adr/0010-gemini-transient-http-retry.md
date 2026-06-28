# ADR 0010: Gemini transient HTTP retry

## Status

Accepted

## Context

Google Gemini intermittently returns **HTTP 503** (and sometimes 429/502) under load. The provider previously failed immediately, causing translation job items to fail even when a retry seconds later would succeed.

BullMQ `attempts: 3` on `translation.process` does not help because the job runner catches provider errors and marks items failed without rethrowing.

The existing **provider fallback chain** (`AI_PROVIDER_FALLBACK`) remains the second line of defense after Gemini exhausts retries.

## Decision

Add **in-provider exponential backoff retry** in `GeminiProvider` for transient HTTP statuses:

| Status | Retry |
|--------|-------|
| 502, 503, 429 | Yes |
| 401, 404, other | No |

Defaults:

- `GEMINI_TRANSIENT_RETRIES=2` → up to **3 total** HTTP calls (1 initial + 2 retries)
- `GEMINI_TRANSIENT_RETRY_DELAY_MS=1000` → delays 1s, 2s between retries

Shared pure helpers live in `provider-http-retry.utils.ts` for testability. OpenAI/Ollama unchanged in v1.

## Consequences

- Fewer failed jobs on transient Gemini outages
- Up to ~3s extra latency before fallback when Gemini is down
- Slightly higher Gemini API call count on flaky periods
- Fallback to Ollama still applies if all Gemini attempts fail

## Alternatives considered

- BullMQ rethrow on provider errors — rejected; mixes queue retry with validation retry semantics
- Retry all cloud providers — deferred; Gemini-only scope for v1
- Infinite retry — rejected; bounded retries then fallback

## Related

- [docs/workflows/translation-job.md](../workflows/translation-job.md)
- ADR 0003 (provider abstraction), ADR 0008 (validation retry), ADR 0011 (Gemini model tier fallback)
