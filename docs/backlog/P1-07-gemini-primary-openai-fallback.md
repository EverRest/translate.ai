# P1-07 — Gemini-primary cloud provider stack

**Phase:** 1 · **Priority:** High · **Status:** In progress

## Goal

Production-ready Gemini-first translation with OpenAI as sole cross-provider fallback;
local/testing uses `gemini-2.5-flash-lite` → `gpt-4.1-mini`.

## Current state

- `ProviderRegistryService` fallback on failure (shipped, ADR 0003)
- Gemini transient + model-tier fallback (ADR 0010/0011)
- OpenAI model-tier fallback via `OPENAI_MODEL_FALLBACK` (ADR 0013)
- `AI_PROVIDER` env wired as default job provider when API/UI omit provider
- Cost rates for `gpt-4.1-*` and `gemini-2.5-flash-lite`

## Proposed fit

| Layer | Change |
|-------|--------|
| **Env** | `GEMINI_MODEL`, `OPENAI_MODEL`, `AI_PROVIDER_FALLBACK=openai` |
| **Config** | `AI_PROVIDER` default job provider; `OPENAI_MODEL_FALLBACK` |
| **UI** | Create job modal defaults to `gemini` |
| **Analytics** | Cost rates for new models in `prompt.builder` |
| **Future** | Production secrets via env / `ProviderConfig` (P3-11) |

## Dependencies

- Shipped `ProviderRegistryService` (ADR 0003)
- Distinct from P2-02 (cost router by content type — success-path routing)

## Acceptance criteria

- [x] Local `.env`: `gemini-2.5-flash-lite` primary, `gpt-4.1-mini` fallback
- [x] `AI_PROVIDER_FALLBACK=openai` (no Ollama in cloud testing chain)
- [x] UI + API default provider = `gemini`
- [x] Fallback audited + visible in analytics (shipped infra)
- [x] `OPENAI_MODEL_FALLBACK` optional (`gpt-4.1`, ADR 0013)
- [x] Docs + env templates updated
- [ ] Production deployment with rotated API keys (ops)

## Related

- [docs/domain/ai-provider.md](../domain/ai-provider.md)
- [docs/adr/0013-openai-model-fallback.md](../adr/0013-openai-model-fallback.md)
- [P2-02](./P2-02-cross-provider-cost-router.md) — success-path routing builds on this baseline
