# Shipped baseline (not backlog)

Reference only — do **not** re-implement. Details live in `docs/domain/`, `docs/adr/`, code, and **`docs/backlog/demo/*-shipped.md`** specs.

| Capability | Where | Spec |
|------------|--------|------|
| Translation memory (Postgres hash) | `TranslationMemoryService`, ADR implicit in patterns | — |
| Multi-provider fallback | `ProviderRegistryService`, ADR 0003 | — |
| Gemini-primary cloud stack | `AI_PROVIDER`, `AI_PROVIDER_FALLBACK`, ADR 0010/0011/0013, `OpenAiProvider`, `GeminiProvider` | — |
| Ollama model router + classifier | ADR 0007, `OllamaModelRouterService` | — |
| Key context + contentType in prompts | `translation-context.utils`, `prompt.builder` | — |
| Output sanitize + heuristic validation + 3 retries | ADR 0008, `translation-sanitize.utils`, `TranslationOutputValidator` | — |
| QA validators (placeholders, HTML tag balance) | ADR 0008, `translation/application/validators/`, `TRANSLATION_QA_VALIDATORS_ENABLED` | — |
| Manual glossary | ADR 0005, `glossary` module | — |
| Auto glossary suggestions | ADR 0012, `GlossarySuggestion`, `glossary.analyze` queue | — |
| Glossary platform (P0-S01) | `glossary` module; presets; `fifa_accreditation` preset (24 terms) | [P0-S01-shipped](demo/P0-S01-glossary-platform-shipped.md) |
| Branching | ADR 0006, `branching` module | — |
| Approval + retranslate | `approval` module | — |
| Webhooks (job + publish) | `webhook` module | — |
| Usage + quality analytics | `billing` module, Analytics UI | — |
| Export API (sync) | `export` module — json/yaml/csv/android-xml/ios-strings/po | — |
| Export UI + async queue | `ExportJob`, `translation.export` worker, project Export tab | — |
| Confluence file import (P0-03 Phase 1) | ADR 0016, `integration` module, `ImportSession`, parsers, Import tab | [P0-03-shipped](demo/P0-03-documentation-import-shipped.md) |
| Confluence live sync (P0-03 Phase 2) | OAuth 3LO, `ConfluenceConnection`, `integration.confluence.sync` queue | [P0-03-shipped](demo/P0-03-documentation-import-shipped.md) |
| Confluence hardening (P0-03b) | Site picker, label filter, scheduled sync, tenant BYO OAuth | [P0-03b-shipped](demo/P0-03b-confluence-hardening-shipped.md) |
| Placeholder protection + job summary (P0-S02) | `PlaceholderValidator`, `placeholder.utils.ts`; `placeholderSummary` on jobs | [P0-S02-shipped](demo/P0-S02-placeholder-protection-shipped.md) |
| Sport-domain AI context (P0-01) | `Project.domainProfile`, domain presets, copy-settings, Domain context UI | [P0-01-shipped](demo/P0-01-sport-domain-ai-context-shipped.md) |
| Terminology drift detection (P2-05 MVP) | `terminology_drift_issues`, scan queue, Glossary drift tab | [P2-05](P2-05-terminology-drift.md) |
| Consistency check UX Wave 1 (P0-07) | `autoTerminologyScan`, post-job scan, grid drift hints | [P0-07-shipped](demo/P0-07-consistency-check-shipped.md) |
| Excel round-trip + delta import (P0-02 MVP) | `excel.parser.ts`, Classic import preset, Excel Import tab | [P0-02-shipped](demo/P0-02-excel-delta-import-shipped.md) |
| Stale translation detection (P0-04 MVP) | `sourceTextSnapshot`, stale API, `onlyStale` jobs, grid UX | [P0-04-shipped](demo/P0-04-stale-translation-detection-shipped.md) |
| Translation coverage heatmap (P0-06 MVP) | `CoverageMatrixService`, reports API, Analytics heatmap, Launch readiness | [P0-06-shipped](demo/P0-06-translation-coverage-heatmap-shipped.md) |

When extending the platform, **build on these modules** — do not fork parallel implementations.
