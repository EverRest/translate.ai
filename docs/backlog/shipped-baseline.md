# Shipped baseline (not backlog)

Reference only — do **not** re-implement. Details live in `docs/domain/`, `docs/adr/`, and code.

| Capability | Where |
|------------|--------|
| Translation memory (Postgres hash + pgvector semantic) | `TranslationMemoryService`, `SemanticMemoryService`, ADR 0012 |
| Multi-provider fallback | `ProviderRegistryService`, ADR 0003 |
| Ollama model router + classifier | ADR 0007, `OllamaModelRouterService` |
| Key context + contentType in prompts | `translation-context.utils`, `prompt.builder` |
| Output sanitize + heuristic validation + 3 retries | ADR 0008, `translation-sanitize.utils`, `TranslationOutputValidator` |
| QA validators (placeholders, HTML tag balance) | ADR 0008, `translation/application/validators/`, `TRANSLATION_QA_VALIDATORS_ENABLED` |
| Manual glossary | ADR 0005, `glossary` module |
| Branching | ADR 0006, `branching` module |
| Approval + retranslate | `approval` module |
| Webhooks (job + publish) | `webhook` module |
| Usage + quality analytics | `billing` module, Analytics UI |
| Export API (sync) | `export` module — json/yaml/csv/android-xml/ios-strings/po |
| Export UI + async queue | `ExportJob`, `translation.export` worker, project Export tab |

When extending the platform, **build on these modules** — do not fork parallel implementations.
