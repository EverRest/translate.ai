# Cross-locale reference translations on retry

Детальний план імплементації. Конвенції: [coding-standards.md](../coding-standards.md), [patterns.md](../patterns.md), ADR [0009](../adr/0009-cross-locale-reference-on-retry.md).

> **Примітка:** `AGENTS.md` у репозиторії відсутній; agent workflow орієнтується на `docs/coding-standards.md` і ADR.

## Мета

При **retry** (in-process або manual) підставляти в промпт AI існуючі переклади **того самого ключа** в інших мовах, щоб модель узгоджувала термінологію (`turbo`, `cast`, UI-лейбли).

## Не входить у scope (v1)

- pgvector / semantic TM
- UI toggle «use references»
- References на першій спробі нового job
- References з інших ключів проєкту

## Архітектура

```text
translation-job-runner.handleProcess
 → loadReferenceTranslations(keyId, targetLang) [Prisma]
 → selectReferenceTranslations(rows) [pure util]
 → buildTranslateOptionsFromKey + referenceTranslations
 → translateText → prompt.builder
 → formatReferenceTranslationsPrompt() in user prompt
```

## Фази

### Phase 1 — Domain / types

| # | Task | File |
|---|------|------|
| 1.1 | `ReferenceTranslationOption { language, value }` | `ai-provider/domain/ai-provider.interface.ts` → `TranslateOptions.referenceTranslations?` |
| 1.2 | Константи лімітів | `translation/application/utils/reference-translation.utils.ts` |

### Phase 2 — Pure utils + tests (TDD)

| # | Task | File |
|---|------|------|
| 2.1 | `selectReferenceTranslations()` — filter, sort, cap | `reference-translation.utils.ts` |
| 2.2 | `truncateReferenceValue()` | same |
| 2.3 | `formatReferenceTranslationsPrompt()` | same |
| 2.4 | Unit tests: priority, exclude lang, cap, truncate | `reference-translation.utils.spec.ts` |

### Phase 3 — Prompt integration

| # | Task | File |
|---|------|------|
| 3.1 | Додати refs у `buildUserPromptParts` (перед `Text:`) | `prompt.builder.ts` |
| 3.2 | Test: refs у user prompt | `prompt.builder.spec.ts` |

### Phase 4 — Job runner wiring

| # | Task | File |
|---|------|------|
| 4.1 | `loadReferenceTranslations(prisma, keyId, excludeLang)` | `reference-translation.utils.ts` |
| 4.2 | Завантажити refs один раз на item | `translation-job-runner.service.ts` |
| 4.3 | Передавати refs якщо `attempt > 1` **або** `payload.includeReferenceTranslations` | same |
| 4.4 | `includeReferenceTranslations?: boolean` у payload | `job-payloads.ts` |
| 4.5 | `handleRetry` → `enqueueProcess({ includeReferenceTranslations: true })` | `translation-job-runner.service.ts` |

### Phase 5 — Docs

| # | Task | File |
|---|------|------|
| 5.1 | ADR | `docs/adr/0009-...` ✅ |
| 5.2 | Workflow step | `docs/workflows/translation-job.md` |
| 5.3 | Feature index | `docs/features/README.md` |
| 5.4 | Changelog entry | `docs/changelog.md` |

## Алгоритм вибору references

```typescript
priority: published(0) < approved(1) < review(2) < draft(3)
filter: language !== targetLang && value.trim() !== ''
sort: priority ASC, language ASC
take: 8
truncate value: 300 chars
```

## Приклад промпта

```text
Project: Shop
Description: Performance tier label

Reference translations for the same key (match terminology and tone):
- de: Turbo
- fr: Turbo

Note: Previous attempt was rejected: ...

Text:
Turbo
```

## Тест-план

| Test | Expected |
|------|----------|
| `selectReferenceTranslations` excludes target lang | ES excluded when translating ES |
| Status priority | published wins over draft |
| Max 8 refs | 10 inputs → 8 outputs |
| Prompt builder | refs block present in userPrompt |
| Manual retry payload | `includeReferenceTranslations: true` on re-enqueue |

## Rollout

1. Merge на feature branch
2. Restart worker
3. Retry failed item з ключем, де є інші мови в grid
4. Перевірити worker logs / quality metric notes (optional)

## Майбутні покращення (P2+)

- Env: `REFERENCE_TRANSLATIONS_MAX`, `REFERENCE_TRANSLATIONS_ON_FIRST_ATTEMPT`
- Включати completed items **з того ж job** ще до запису в `translations`
- Retranslate з Approvals — той самий reference loader
