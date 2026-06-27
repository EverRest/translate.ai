# Ollama local setup

## Recommended: native Ollama (Mac)

Use **Ollama.app** on the host. translate.ai API/worker talk to it; the optional Docker `ollama` container can stay stopped or running — we do not use it by default.

| How you run translate.ai | `OLLAMA_BASE_URL` | Config file |
|--------------------------|-------------------|-------------|
| `make dev-backend` + `make dev-worker` | `http://127.0.0.1:11434` | `backend/.env` |
| `docker compose up api worker` | `http://host.docker.internal:11434` | `backend/.env.docker` |

Use **`127.0.0.1`**, not `localhost`, when Docker Ollama also binds `:11434` — otherwise requests may hit the wrong instance.

Quick setup:

```bash
cp backend/.env.dev.example backend/.env   # if starting fresh
ollama pull llama3.2:3b                      # ~2 GB, good for daily dev
make dev-infra
make dev-backend    # terminal 1
make dev-worker     # terminal 2
make dev-frontend   # terminal 3
```

Set `MOCK_TRANSLATIONS=false` in `backend/.env` for real translations.

Verify native Ollama:

```bash
curl http://127.0.0.1:11434/api/tags
ollama run llama3.2:3b "Translate to Ukrainian: Hello"
```

After changing `backend/.env.docker`, restart containers (no image rebuild):

```bash
docker compose up -d api worker
```

## Optional: Docker Ollama profile

Heavy 7B models for production-like tests only (high RAM). Not used when `OLLAMA_BASE_URL` points to the host.

```bash
docker compose --profile ollama up -d ollama
```

Models in the container volume (separate from native):

```bash
docker exec translateai-ollama-1 ollama pull qwen2.5:7b
docker exec translateai-ollama-1 ollama pull llama3.1:8b
```

## Timeouts

Each translation item uses `OLLAMA_TIMEOUT_MS` (default **600000** = 10 minutes).
Large models on CPU can exceed 2 minutes per string.

For UI/API testing without AI, set `MOCK_TRANSLATIONS=true`.

## Related

- [backend/.env.dev.example](../../backend/.env.dev.example)
- [issues/001-docker-compose-full-stack-with-ollama-7b-models-freezes-host-out-of-ram.md](../../issues/001-docker-compose-full-stack-with-ollama-7b-models-freezes-host-out-of-ram.md)
- [docs/features/ollama.md](../../docs/features/ollama.md)
- [docs/adr/0007-ollama-model-router.md](../../docs/adr/0007-ollama-model-router.md)
