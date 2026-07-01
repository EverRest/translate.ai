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
| content_type | Structured type: ui, placeholder, email, article, … |

### Translation

| Field | Description |
|-------|-------------|
| id | UUID |
| translation_key_id | FK → TranslationKey |
| language | Language code (value object: `LanguageCode`) |
| value | Translated text |
| status | draft, review, approved, published |
| source_text_snapshot | Source text at last translate/write time; used for staleness detection |
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

## Domain profile

Projects may set an optional `domainProfile` (JSON on `Project`) to steer AI tone and terminology for an entire project — e.g. Sport accreditation forms.

| Field | Purpose |
|-------|---------|
| `domain` | Broad domain (`sports`, …) |
| `event` | Event name (`Major championship 2026`) |
| `tone` | Formality / voice hint (`formal`, …) |
| `audience` | Who reads the copy (`accreditation`, `venue operations`, …) |
| `notes` | Free-text additional context |
| `localeNotes` | Per target-language paragraph keyed by ISO code (`fr`, `es`, …) |

**Pipeline:** `translation.process` loads `project.domainProfile` via `buildTranslateOptionsFromKey` → `TranslateOptions.domainProfile` → `buildTranslationPrompts` adds a **Domain context** block in the **system prompt** (before glossary rules). The matching `localeNotes[targetLang]` entry is included for each job item's target language.

Seed presets: `GET /projects/:id/domain-presets` (`fifa_accreditation`, `fifa_venue_ops`). Domain glossary terms: `POST .../glossary/presets/apply` with `fifa_accreditation`.

## Output validation

After AI translation and sanitization, `TranslationOutputValidator` runs heuristic checks then a QA chain (ADR 0008):

| Check | Purpose |
|-------|---------|
| Heuristics | Empty output, refusals, identical source, length ratio, script |
| PlaceholderValidator | Preserve `{{...}}` and `%%...%%` tokens from source |
| HtmlTagBalanceValidator | Balanced HTML tags when source contains markup |

Failures retry up to 3 times in-process; job item `errorMessage` includes the validator name. Disable QA only via `TRANSLATION_QA_VALIDATORS_ENABLED=false`.

## Commands

- `CreateTranslationJobCommand`
- `RetryTranslationJobCommand`
- `CancelTranslationJobCommand`

## Queries

- `GetJobStatusQuery`
- `GetTranslationsQuery`
- `ListTranslationKeysQuery`

## Stale translation detection (P0-04)

When `TranslationKey.sourceText` changes (manual edit on Keys page or import apply), existing translations with non-empty `value` move to `review`. Staleness is **computed**, not a separate status:

```text
isStale = sourceTextSnapshot IS NOT NULL
 AND normalize(sourceTextSnapshot) ≠ normalize(key.sourceText)
```

- `normalize` trims and collapses internal whitespace (whitespace-only edits do not invalidate).
- After a successful translation job item, `sourceTextSnapshot` is set to the key's current `sourceText`.
- API: `GET .../translations/stale-summary`, `GET .../translations/stale-key-hints`; list translations include `isStale`.
- Jobs: `onlyStale: true` creates items only for stale key×language pairs.

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
