# P2-01 — Prompt versioning

**Phase:** 2 · **Priority:** High · **Status:** Backlog

## Goal

Version, rollback, and A/B test system prompts — reproducible translations.

## Current state

- Prompts built in code: `prompt.builder.ts` — not stored in DB
- No `prompt_version` in TM hash
- Ollama polish uses separate inline prompt

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `prompt_templates` (tenantId?, name, version, systemTemplate, userTemplate, contentTypeDefaults, isActive) |
| **Module** | `ai-provider` — `PromptTemplateService` |
| **Pipeline** | `buildTranslationPrompts` reads active version for tenant/project or falls back to code default |
| **TM hash** | Include `promptVersion` in exact hash (see ADR 0012 follow-up) |
| **API** | CRUD + `POST /prompts/:id/activate`, compare diff endpoint |
| **Frontend** | Settings → Prompts (admin); project override optional |

### A/B (minimal)

- Job create accepts optional `promptVersionId`
- Analytics tag usage by version

## Dependencies

- Enables accurate cache invalidation for semantic TM (ADR 0013), P3-01 replay

## Acceptance criteria

- [ ] Two versions stored; switch active version changes job output
- [ ] Rollback = activate previous version
- [ ] ADR: `0011-prompt-versioning.md`
- [ ] Tests: template rendering with variables

## Overlap with raw.md

Item #2 — Prompt Versioning.
