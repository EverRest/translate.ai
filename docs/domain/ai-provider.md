# AI Provider Domain

Abstraction over external and local LLM translation APIs.

## Interface

```typescript
interface AiProvider {
  translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options?: TranslateOptions,
  ): Promise<string>;
}

interface TranslateOptions {
  context?: string;       // key description, UI context
  tone?: 'formal' | 'friendly' | 'technical';
  glossary?: GlossaryTerm[];
  contentType?: ContentType;  // ui | email | legal | marketing | article | chat | technical | general
}
```

## Implementations

| Provider | Class | Use case |
|----------|-------|----------|
| Google Gemini | `GeminiProvider` | **Primary** (cloud default: `gemini-2.5-flash-lite`) |
| OpenAI | `OpenAiProvider` | **Cross-provider fallback** (`gpt-4.1-mini` → optional `gpt-4.1`) |
| Ollama | `OllamaProvider` | Local/dev, privacy, zero API cost |
| Anthropic Claude | `ClaudeProvider` | Quality alternative (not implemented) |

Recommended local model: `qwen2.5:7b` (best multilingual accuracy via Ollama).

## Ollama model router

When provider is `ollama`, `OllamaProvider` selects a model by content type:

| Type | Model env | Use case |
|------|-----------|----------|
| legal, technical | `OLLAMA_MODEL_LITERAL` | Literal translation |
| ui, chat, short text | `OLLAMA_MODEL_FAST` | Buttons, forms |
| marketing, email, article | `OLLAMA_MODEL_DEFAULT` | Natural copy |

Optional AI classifier (`OLLAMA_ROUTING_MODE`) and polish pass (`OLLAMA_POLISH_ENABLED`). See [features/ollama.md](../features/ollama.md) and [adr/0007-ollama-model-router.md](../adr/0007-ollama-model-router.md).

## Provider config (DB)

`provider_configs` table per tenant/project:

- default provider
- API keys (encrypted)
- model name
- rate limits
- prompt templates

## Fallback chain

Cloud testing / production default (`AI_PROVIDER_FALLBACK=openai`):

```text
Primary (Gemini: gemini-2.5-flash-lite)
  │ transient retry (ADR 0010)
  │ optional GEMINI_MODEL_FALLBACK tier (ADR 0011)
  │ fail (timeout, rate limit, error)
  ▼
Secondary (OpenAI: gpt-4.1-mini)
  │ transient retry
  │ optional OPENAI_MODEL_FALLBACK tier (ADR 0013)
  │ fail
  ▼
Job item failed (no Ollama in cloud chain)
```

Local Ollama dev may use `AI_PROVIDER_FALLBACK=gemini,ollama` or `ollama` only.

Env vars:

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | Default job provider when API/UI omit `provider` (default `gemini`) |
| `AI_PROVIDER_FALLBACK` | Comma-separated cross-provider chain on failure |
| `GEMINI_MODEL` / `GEMINI_MODEL_FALLBACK` | Primary + optional in-provider Gemini tier |
| `OPENAI_MODEL` / `OPENAI_MODEL_FALLBACK` | Primary + optional in-provider OpenAI tier |

## Dashboard and API defaults

- **Dashboard:** Create Job does not send `provider`; server `AI_PROVIDER` applies.
- **API:** `GET /config/ai` exposes `defaultProvider`, `supportedProviders`, and `providerFallback` for clients.
- **Override:** `POST /jobs` optional `provider` field for programmatic per-job choice.

## Prompt rules

System prompt must instruct model to:

- Preserve formatting (HTML, placeholders like `{{name}}`)
- Keep tone per project settings
- Respect glossary (do-not-translate terms)
- Return translation only, no explanation

## Cost control

1. Check **Translation Memory** first (translation domain).
2. Chunk long texts before sending.
3. Track tokens/cost per job in analytics (future module).

## Hybrid pipeline (recommended)

```text
Pre-process (chunk, sanitize HTML)
  → Memory lookup
  → LLM translate
  → Optional post-edit pass (second model)
  → Store + cache
```

## Commands / services

- `TranslateTextService` — single text, used by workers
- `SelectProviderService` — resolve provider from project config + fallback

## Rules

- Never import OpenAI SDK directly outside `ai-provider/infrastructure/`.
- All provider errors mapped to domain exceptions (`ProviderUnavailableException`).
- Timeouts required on every external call.
- Gemini retries transient HTTP 502/503/429 in-process before fallback (ADR 0010).
- Optional `GEMINI_MODEL_FALLBACK` tries a second Gemini model tier after primary transient exhaustion (ADR 0011).
- Optional `OPENAI_MODEL_FALLBACK` tries a second OpenAI model tier after primary transient exhaustion (ADR 0013).

## Related

- [llm.md](../llm.md) — provider comparison and Node.js examples
- [adr/0003-ai-provider-abstraction.md](../adr/0003-ai-provider-abstraction.md)
- [patterns.md](../patterns.md) — translation memory
