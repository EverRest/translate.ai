# ADR 0013: OpenAI model tier fallback

## Status

Accepted

## Context

ADR 0011 adds optional **`GEMINI_MODEL_FALLBACK`** inside `GeminiProvider` when the primary Gemini tier exhausts transient HTTP retries (502/503/429).

`OpenAiProvider` previously used a single `OPENAI_MODEL` with no in-provider model fallback. When `gpt-4.1-mini` is saturated, another OpenAI tier (e.g. `gpt-4.1`) may remain available without switching to Gemini.

## Decision

Add optional **`OPENAI_MODEL_FALLBACK`** inside `OpenAiProvider`, mirroring ADR 0011:

1. Run transient retry loop on primary `OPENAI_MODEL` (same 502/503/429 policy as Gemini, reusing `GEMINI_TRANSIENT_RETRIES` / `GEMINI_TRANSIENT_RETRY_DELAY_MS`)
2. If primary exhausts transient retries → try `OPENAI_MODEL_FALLBACK` with its own transient retry loop
3. If all OpenAI models fail → throw → `ProviderRegistry` cross-provider fallback (e.g. gemini → openai)

Model fallback triggers **only on transient HTTP exhaustion**, not on 401, empty response, or other errors.

Defaults:

- `OPENAI_MODEL_FALLBACK` empty → single-model behavior (pre-ADR)
- Example: primary `gpt-4.1-mini`, fallback `gpt-4.1`

`usage.model` records the model that succeeded.

## Consequences

- Better resilience when one OpenAI tier is saturated
- Symmetric behavior with Gemini model-tier fallback
- No change to job API or provider registry surface

## Alternatives considered

- Separate OpenAI retry env vars — rejected; same transient semantics as Gemini
- Model fallback on any error — rejected; avoids masking auth/config bugs

## Related

- ADR 0011 (Gemini model tier fallback)
- ADR 0010 (transient HTTP retry)
- ADR 0003 (provider abstraction)
- [docs/domain/ai-provider.md](../domain/ai-provider.md)
- [docs/backlog/shipped-baseline.md](../backlog/shipped-baseline.md)
