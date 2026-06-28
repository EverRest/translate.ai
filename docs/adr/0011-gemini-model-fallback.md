# ADR 0011: Gemini model tier fallback

## Status

Accepted

## Context

ADR 0010 adds transient HTTP retry (502/503/429) on a **single** `GEMINI_MODEL`. When a specific model tier is overloaded (e.g. `gemini-2.5-flash-lite`), retries on the same model may all fail while another Gemini model (e.g. `gemini-2.0-flash`) remains available.

Provider fallback (`AI_PROVIDER_FALLBACK=gemini,ollama`) switches to **Ollama**, not another Gemini model.

## Decision

Add optional **`GEMINI_MODEL_FALLBACK`** inside `GeminiProvider`:

1. Run transient retry loop on primary `GEMINI_MODEL` (ADR 0010)
2. If primary exhausts transient retries → try `GEMINI_MODEL_FALLBACK` with its own transient retry loop
3. If all Gemini models fail → throw → `ProviderRegistry` fallback to Ollama

Model fallback triggers **only on transient HTTP exhaustion**, not on 401, empty response, or other errors.

Defaults:

- `GEMINI_MODEL_FALLBACK` empty → behavior identical to ADR 0010 only
- Example: primary `gemini-2.5-flash-lite`, fallback `gemini-2.0-flash`

`usage.model` records the model that succeeded. Provider-level `usedFallback` (gemini→ollama) unchanged.

## Consequences

- Better resilience when one Gemini tier is saturated
- Up to 2× transient retry budget when fallback model configured (6 HTTP calls max before Ollama)
- No change to job API or provider registry surface

## Alternatives considered

- Comma-separated model list — deferred (KISS)
- Model fallback on any error — rejected; avoids masking auth/config bugs
- Per-project model routing — deferred to P2-02 cost router

## Related

- ADR 0010 (transient retry per model)
- ADR 0003 (provider abstraction)
- [docs/backlog/P2-02-cross-provider-cost-router.md](../backlog/P2-02-cross-provider-cost-router.md)
