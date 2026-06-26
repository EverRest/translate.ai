# Ollama Multi-Model Translation Router

Local Ollama integration with automatic model selection per content type, optional AI classification, and an optional polish pass.

## Architecture

```text
Translation job item
  → TranslateTextService
  → ProviderRegistryService (fallback chain unchanged)
  → OllamaProvider
      → ContentClassifierService
      → OllamaModelRouterService
      → OllamaClient (primary model)
      → OllamaPolishService (optional)
```

Do not call Ollama models directly from workers or controllers — always go through `AiProvider`.

## Model matrix

| Content type | Model (env) | Use case |
|--------------|-------------|----------|
| `legal`, `technical` | `OLLAMA_MODEL_LITERAL` (default `nllb`) | Literal, precise translation |
| `ui`, `chat`, short text (&lt;200 chars) | `OLLAMA_MODEL_FAST` (default `llama3.1:8b`) | Forms, buttons, live copy |
| `email`, `marketing`, `article`, `general` | `OLLAMA_MODEL_DEFAULT` (default `qwen2.5:7b`) | Natural, fluent translation |

## Content classification

### Rule-based (default)

`ContentClassifierService` infers `ContentType` from:

- Explicit `TranslateOptions.contentType` (highest priority)
- Keywords in translation key `context` / `description` (`legal`, `marketing`, `ui`, etc.)
- `tone: technical` → technical/literal lean
- Text length &lt; 200 → `chat`/fast model

### AI classifier

Set `OLLAMA_ROUTING_MODE=classifier` or `rules_then_classifier`. A small model (`OLLAMA_CLASSIFIER_MODEL`) returns one label: `ui`, `email`, `legal`, `marketing`, `article`, `chat`, `general`. Invalid responses fall back to rules.

## Polish pipeline

When `OLLAMA_POLISH_ENABLED=true`:

1. Primary model translates source text
2. `OLLAMA_POLISH_MODEL` refines output for fluency (skipped for `legal`)

Usage log model field: `{primaryModel}+polish` when polish runs.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base |
| `OLLAMA_MODEL` | `qwen2.5` | Legacy alias for default model |
| `OLLAMA_MODEL_DEFAULT` | `qwen2.5:7b` | General translation |
| `OLLAMA_MODEL_FAST` | `llama3.1:8b` | Short / UI text |
| `OLLAMA_MODEL_LITERAL` | `nllb` | Legal / literal |
| `OLLAMA_ROUTING_MODE` | `rules` | `rules`, `classifier`, `rules_then_classifier` |
| `OLLAMA_CLASSIFIER_MODEL` | `llama3.1:8b` | Classifier model |
| `OLLAMA_POLISH_ENABLED` | `false` | Enable polish pass |
| `OLLAMA_POLISH_MODEL` | `llama3.1:8b` | Polish model |

## Docker (local dev)

```bash
docker compose --profile ollama up -d
```

Pull models (see [infra/ollama/README.md](../../infra/ollama/README.md)):

```bash
ollama pull qwen2.5:7b
ollama pull llama3.1:8b
ollama pull nllb
```

Set `OLLAMA_BASE_URL=http://ollama:11434` when API/worker run inside Compose with the profile.

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ProviderUnavailableException: ollama` | Ollama not running | Start Ollama or Compose profile |
| HTTP 404 on generate | Model not pulled | `ollama pull <model>` |
| Slow jobs | Classifier + polish enabled | Disable polish or use `rules` mode |
| Wrong model | Missing context keywords | Set key context or pass `contentType` |

## Related

- [adr/0007-ollama-model-router.md](../adr/0007-ollama-model-router.md)
- [domain/ai-provider.md](../domain/ai-provider.md)
- [llm.md](../llm.md)
