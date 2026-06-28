# ADR 0009: Cross-locale reference translations on retry

## Status

Accepted

## Context

When a translation job item fails (validation, provider outage, etc.) and is retried, the AI only sees source text plus key/project context. The same key may already have successful translations in other languages in the project grid (e.g. `turbo` → DE, FR completed while ES failed).

Human reviewers use those sibling locales for terminology consistency. The model does not receive them today.

## Decision

On **retry paths only**, load existing translations for the same `translationKeyId` (excluding the target language) and inject them into the AI prompt as **reference translations**.

### When references are included

| Trigger | Condition |
|---------|-----------|
| In-process validation retry | Attempt 2 or 3 in the job runner loop |
| Manual job retry | `POST /jobs/:id/retry` → `translation.process` payload flag `includeReferenceTranslations: true` |

First attempt of a new job does **not** include references (avoids extra tokens on happy path).

### Selection rules

- Source: `translations` table for the same key
- Exclude: target language, empty values
- Priority: `published` > `approved` > `review` > `draft`
- Cap: 8 locales, 300 chars per value (truncate with `…`)
- Sort: status priority, then language code

### Prompt format

User prompt section (before source text):

```text
Reference translations for the same key (match terminology and tone):
- de: Turbo
- fr: Turbo
```

System prompt unchanged except optional note via user prompt block.

### Configuration

No new env vars in v1. Limits are constants in `reference-translation.utils.ts`.

## Consequences

- Better retry quality for short UI keys and ambiguous terms
- Slightly higher token cost on retry attempts only
- No schema migration
- No UI changes

## Alternatives considered

- **Always include refs:** rejected — unnecessary cost on first attempt
- **Same-job siblings only:** rejected — misses translations from prior jobs / manual edits
- **LLM retrieval (pgvector):** deferred to backlog P1+

## Related

- [features/cross-locale-reference.md](../features/cross-locale-reference.md) — implementation plan
- [workflows/translation-job.md](../workflows/translation-job.md)
