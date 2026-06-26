# Ollama local setup

Optional Docker profile for local AI translation without cloud API keys.

## Start Ollama

```bash
docker compose --profile ollama up -d ollama
```

Or with the full stack:

```bash
docker compose --profile ollama up -d
```

API and worker use `OLLAMA_BASE_URL=http://ollama:11434` when running via Compose.

## Pull models

Run inside the Ollama container or on a host with the Ollama CLI:

```bash
ollama pull qwen2.5:7b
ollama pull llama3.1:8b
```

For legal/technical content the router uses `OLLAMA_MODEL_LITERAL` (default `llama3.1:8b`).
The legacy `nllb` tag is not available in the Ollama library.

## Verify

```bash
curl http://localhost:11434/api/tags
```

Create a translation job with `provider=ollama` in the UI or API.

## Timeouts

Each translation item calls Ollama with `OLLAMA_TIMEOUT_MS` (default **600000** = 10 minutes).
On CPU-only hosts, `qwen2.5:7b` can take several minutes per string — if jobs show items failing with
`This operation was aborted`, increase the timeout in `backend/.env.docker` and restart `api` + `worker`.

For UI/API testing without waiting on inference, set `MOCK_TRANSLATIONS=true` in `backend/.env.docker`.

## Related

- [docs/features/ollama.md](../../docs/features/ollama.md)
- [docs/adr/0007-ollama-model-router.md](../../docs/adr/0007-ollama-model-router.md)
