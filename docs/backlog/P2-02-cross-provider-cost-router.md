# P2-02 — Cross-provider cost router

**Phase:** 2 · **Priority:** High · **Status:** Backlog

## Goal

Route strings to the right **provider + model** by content type, length, and tenant policy — optimize cost vs quality.

## Current state

- Fallback chain on **failure** only: `ProviderRegistryService` (openai → gemini → ollama)
- **Ollama-only** model pick by contentType: `OllamaModelRouterService` (ADR 0007)
- OpenAI/Gemini use fixed env models; job-level `provider` single choice
- `ProviderConfig` in schema — **unused**

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | Use/wire `ProviderConfig` per tenant or project |
| **Service** | `TranslationRouterService` in `ai-provider` |
| **Rules** | e.g. `ui|placeholder` → ollama fast; `legal|technical` → claude/gpt-4; `marketing` → gpt-4o |
| **Job runner** | Resolve provider per item from router (override job default) |
| **Analytics** | Cost saved vs "always GPT-4" baseline |

### Config shape (YAML or DB)

```yaml
routing:
  ui: { provider: ollama, model: llama3.2:3b }
  legal: { provider: openai, model: gpt-4o }
  default: { provider: openai, model: gpt-4o-mini }
```

## Dependencies

- contentType on keys (shipped)
- Optional P2-03 for cost dashboards

## Acceptance criteria

- [ ] Same job can use different providers per item
- [ ] Tenant routing policy in DB + admin UI
- [ ] ADR extends 0007 or new 0012-cost-router
- [ ] Unit tests for rule resolution

## Overlap with raw.md

Item #9 — AI Cost Router.
