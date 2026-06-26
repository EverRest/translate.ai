# Translation Domain

Core bounded context. Handles translation keys, translation values, jobs, and translation memory.

## Aggregates

### TranslationJob

Orchestrates batch translation of keys into target languages.

| Field | Description |
|-------|-------------|
| id | UUID |
| project_id | FK → Project |
| status | pending, processing, completed, failed, cancelled |
| provider | AI provider used |
| created_at | Timestamp |

### TranslationJobItem

Single unit of work: one key × one target language.

| Field | Description |
|-------|-------------|
| id | UUID |
| job_id | FK → TranslationJob |
| translation_key_id | FK → TranslationKey |
| language | Target language code |
| status | pending, processing, completed, failed |

### TranslationKey

| Field | Description |
|-------|-------------|
| id | UUID |
| project_id | FK → Project |
| key | Dot-notation key (e.g. `cart.checkout`) |
| source_text | Source text to translate (required for AI jobs) |
| description | Human-readable context |
| context | Optional UI/screenshot context for AI |

### Translation

| Field | Description |
|-------|-------------|
| id | UUID |
| translation_key_id | FK → TranslationKey |
| language | Language code (value object: `LanguageCode`) |
| value | Translated text |
| status | draft, review, approved, published |
| provider | Which AI provider produced it |
| version | Optimistic locking / versioning |

## Value objects

- `LanguageCode` — ISO 639-1 (e.g. `de`, `fr`, `es`)
- `TranslationStatus` — draft | review | approved | published
- `TranslationProvider` — openai | gemini | claude | ollama | memory

## Translation Memory

Separate aggregate for cost optimization.

| Field | Description |
|-------|-------------|
| source_language | Source lang |
| target_language | Target lang |
| source_text | Original text |
| translated_text | Cached translation |
| hash | Hash of source + langs for lookup |

**Rule:** Always check memory before AI call. Store result after successful AI translation.

## Commands

- `CreateTranslationJobCommand`
- `RetryTranslationJobCommand`
- `CancelTranslationJobCommand`

## Queries

- `GetJobStatusQuery`
- `GetTranslationsQuery`
- `ListTranslationKeysQuery`

## Events

- `TranslationJobCreatedEvent`
- `TranslationJobCompletedEvent`
- `TranslationJobFailedEvent`
- `TranslationApprovedEvent`

## Boundaries

- Does **not** manage projects, API keys, or webhooks directly.
- Publishes events; `webhook` and `approval` modules subscribe.
- AI calls only through `ai-provider` module.

## Related

- [workflows/translation-job.md](../workflows/translation-job.md)
- [domain/ai-provider.md](./ai-provider.md)
