# ADR 0007: Ollama Multi-Model Router

## Status

Accepted

## Context

Local Ollama translation currently uses a single configured model (`OLLAMA_MODEL`). Different content types benefit from different models: Qwen for natural marketing copy, Llama for short UI strings, NLLB for literal legal/technical text. The feature spec in [features/ollama.md](../features/ollama.md) describes a router + classifier + optional polish pipeline.

## Decision

Keep `ollama` as one provider in the fallback chain. Model selection happens **inside** `OllamaProvider` via:

1. `ContentClassifierService` — rule-based inference from `contentType`, tone, context, text length; optional AI classifier when `OLLAMA_ROUTING_MODE` is `classifier` or `rules_then_classifier`
2. `OllamaModelRouterService` — maps content type to configured model names
3. `OllamaClient` — shared HTTP client for `/api/generate`
4. `OllamaPolishService` — optional second pass when `OLLAMA_POLISH_ENABLED=true` (skipped for legal/literal content)

`AiUsageLog.model` records the primary selected model; polish adds a `+polish` suffix when applied.

## Consequences

**Positive:**

- No change to provider fallback chain or job API surface
- Per-content-type quality without cloud API cost
- Feature flags for classifier and polish allow incremental rollout

**Negative:**

- Multiple Ollama calls per translation when classifier + polish enabled
- Model names must be pulled locally; misconfiguration causes runtime failures
- NLLB may need prompt tuning on `/api/generate` (no separate translate API yet)

## Rules

- Routing logic lives only in `ai-provider` module
- Classifier failures fall back to rule-based classification
- Polish is disabled for `legal` content type
- Docker Compose `ollama` profile is optional for local dev

## Related

- [features/ollama.md](../features/ollama.md)
- [adr/0003-ai-provider-abstraction.md](./0003-ai-provider-abstraction.md)
