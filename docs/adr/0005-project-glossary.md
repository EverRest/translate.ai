# ADR 0005: Project Glossary

## Status

Accepted

## Context

Translators need consistent terminology per project. Brand names and product terms must stay unchanged; other terms may have preferred translations. AI prompts must receive glossary rules before translation.

## Decision

Add a `glossary` bounded context with:

- `Glossary` — one per project (auto-created on first term)
- `GlossaryTerm` — `sourceTerm`, optional `targetTerm`, `doNotTranslate` flag

CRUD API under `/projects/:projectId/glossary/terms`. Translation workers load project terms via `GlossaryService` and pass them into `TranslateOptions.glossary`. `buildTranslationPrompts` injects glossary rules into the system prompt.

## Consequences

**Positive:**

- Consistent terminology without manual prompt editing
- Project-scoped terms with tenant isolation via project access checks
- Extensible for future import/export and TM integration

**Negative:**

- Extra DB read per translation job item (acceptable for MVP; cache later if needed)
- Prompt length grows with large glossaries — may need truncation/chunking later

## Rules

- Glossary terms are project-scoped; access via `ProjectAccessService`
- Do-not-translate terms must appear verbatim in output
- Preferred translations are hints, not hard replacements post-AI
