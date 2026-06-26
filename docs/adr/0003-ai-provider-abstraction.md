# ADR 0003: AI Provider Abstraction

## Status

Accepted

## Context

The platform must support multiple AI translation backends:

- OpenAI, Gemini, Claude (cloud APIs)
- Ollama (local, zero cost, privacy)
- Future: DeepL, custom providers

Customers need provider switching, failover, and cost optimization without code changes.

## Decision

Introduce `AiProvider` interface in the `ai-provider` module. All translation workers call providers through this abstraction.

Implementations: `OpenAiProvider`, `GeminiProvider`, `ClaudeProvider`, `OllamaProvider`.

Provider selection configured per project with fallback chain.

## Consequences

**Positive:**

- Single integration point for translation workers
- Easy to add providers and A/B test
- Failover without changing translation domain logic
- Testable with mock providers

**Negative:**

- Lowest-common-denominator interface may miss provider-specific features
- Prompt tuning varies per provider — need per-provider prompt templates

## Rules

- No direct OpenAI/Gemini SDK imports outside `ai-provider/infrastructure/`
- Check Translation Memory before any provider call
- Map provider errors to domain exceptions
