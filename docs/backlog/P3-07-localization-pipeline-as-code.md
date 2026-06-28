# P3-07 — Localization pipeline as code

**Phase:** 3 · **Priority:** High · **Status:** Backlog

## Goal

**Localization Pipeline as Code** — YAML/DSL in repo defines extract → TM → glossary → translate → QA → PR.

## Current state

- App CI only (`.github/workflows/ci.yml`) — not customer-facing
- API + webhooks for custom pipelines
- Vision in raw.md DSL example

## Proposed fit

| Layer | Change |
|-------|--------|
| **File** | `.translate.ai/pipeline.yaml` in customer repo |
| **Parser** | `PipelineDefinitionService` — validate schema |
| **GitHub Action** | `translate-ai/action` — calls API with pipeline steps |
| **Steps map to** | existing queues: sync (P1-02), job create, export (P1-05), PR (P1-06), QA (P1-04) |
| **Backend** | Optional `POST /pipelines/run` executes step list |

### Example pipeline.yaml

```yaml
pipeline:
  - extract: { paths: ["locales/en.json"] }
  - translation_memory: { semantic: true }
  - glossary: true
  - ai_translate: { provider: ollama, languages: [de, fr] }
  - qa: [placeholders, html]
  - pull_request: { branch: main }
```

## Dependencies

- P1-02, P1-04, P1-05, P1-06 (composable steps)

## Acceptance criteria

- [ ] Documented pipeline.yaml schema
- [ ] GitHub Action runs on push → PR with translations
- [ ] ADR: `0014-localization-pipeline-as-code.md`

## Overlap with raw.md

Item #18 + closing vision "Localization Pipeline as Code".
