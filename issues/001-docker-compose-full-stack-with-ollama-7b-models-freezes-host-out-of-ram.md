# Docker Compose full stack with Ollama 7B models freezes host (out of RAM)

<!--
Metadata (not part of the filename — keep slug aligned with Problem section):

| Field     | Value |
|-----------|-------|
| ID        | 001 |
| Status    | Open — solution to discuss |
| Reported  | 2026-06-27 |
| Area      | local-dev, docker, ollama, ai-providers |
| Commands  | make docker-ollama-app, docker compose --profile ollama up |
-->

## Problem

When running the full Docker stack with the Ollama profile and **production-sized models**, the machine becomes unresponsive (UI freezes, Docker hangs, eventual recovery or force-quit).

**Typical command:**

```bash
make docker-ollama-app
# or
docker compose --profile ollama up -d --build
```

After pulling models recommended in docs (`qwen2.5:7b`, `llama3.1:8b`, optionally more for router/classifier/polish), the host appears to run out of RAM.

---

## Context

### What runs in Compose

| Service | Rough RAM |
|---------|-----------|
| postgres | ~100–300 MB |
| redis | ~50 MB |
| api + worker (Node) | ~300–600 MB each |
| frontend | ~100–200 MB |
| **ollama** + **7B models** | **~4–6 GB per loaded model** |

Default env (`backend/.env.docker`) configures **three model slots**:

- `OLLAMA_MODEL_DEFAULT=qwen2.5:7b`
- `OLLAMA_MODEL_FAST=llama3.1:8b`
- `OLLAMA_MODEL_LITERAL=llama3.1:8b`

The model router may load **more than one** model during a job batch (different content types → different models). Ollama keeps recently used models in memory unless evicted.

### Why it hurts on Mac

- Docker Desktop runs Linux VMs inside a memory limit you set in Settings.
- Ollama **inside** Docker does not use Apple Metal as efficiently as **native** Ollama.
- Full stack + Ollama container + multiple 7B/8B weights ≈ easy OOM on 16 GB machines; painful on 8 GB.

### Related docs

- [infra/ollama/README.md](../infra/ollama/README.md)
- [docs/features/ollama.md](../docs/features/ollama.md)
- `MOCK_TRANSLATIONS` — already supported for non-AI dev ([translate-text.service.ts](../backend/src/translation/application/services/translate-text.service.ts))

---

## Options

### A. Host Ollama + one small model (proposed)

**Idea:** Do not run Ollama in Docker for daily dev. Install [Ollama for macOS](https://ollama.com/download), run infra in Compose, run API/worker on the host.

```bash
make dev-infra          # postgres + redis only
ollama pull qwen2.5:3b  # or llama3.2:3b — one model only
make dev-backend        # terminal 1
make dev-worker         # terminal 2
make dev-frontend       # terminal 3
```

Point all router env vars at the **same** small model in `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_DEFAULT=qwen2.5:3b
OLLAMA_MODEL_FAST=qwen2.5:3b
OLLAMA_MODEL_LITERAL=qwen2.5:3b
OLLAMA_ROUTING_MODE=rules
OLLAMA_POLISH_ENABLED=false
```

**Pros:** Native GPU/Metal, no Docker VM overhead, one model ≈ 2–3 GB, matches “real” Ollama path.  
**Cons:** Hybrid setup (some services in Docker, some on host); quality lower than 7B (fine for dev).

---

### B. `MOCK_TRANSLATIONS=true` (no Ollama at all)

Best when working on **UI, API, queues, approval, export** — not translation quality.

```env
MOCK_TRANSLATIONS=true
```

Used today in CI, Playwright, and translation-flow e2e.

**Pros:** Zero AI RAM; fast jobs; deterministic.  
**Cons:** Does not exercise Ollama provider or model router.

---

### C. Docker app **without** Ollama profile + host Ollama

Keep `make docker-app` (api, worker, frontend in containers) but connect to host Ollama:

```yaml
# api/worker need host.docker.internal on Mac
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

**Pros:** Full stack parity in Docker; AI on host with Metal.  
**Cons:** Extra networking config; still need small model discipline.

---

### D. Dev env file — single model, polish/classifier off

Add something like `backend/.env.dev` (or document overrides) so dev never pulls production triple:

| Setting | Production | Local dev |
|---------|------------|-----------|
| Models | 7B × 2–3 | One 3B for all slots |
| `OLLAMA_POLISH_ENABLED` | optional | `false` |
| `OLLAMA_ROUTING_MODE` | `rules` / classifier | `rules` only |
| Ollama location | server / compose | **host native** |

Optional Ollama server env: `OLLAMA_MAX_LOADED_MODELS=1` to force unload between models.

---

### E. Cloud API for occasional “real quality” checks

Use Gemini/OpenAI for spot checks; keep local loop on mock or tiny Ollama.

**Pros:** No local RAM for quality validation.  
**Cons:** Needs API keys; not offline; costs (usually low for dev).

---

### F. Ollama in Docker with memory limits (partial fix)

```yaml
ollama:
  deploy:
    resources:
      limits:
        memory: 6G
```

**Pros:** Caps runaway container.  
**Cons:** Does not fix Docker Desktop VM size; swapping makes freeze *worse*; still no Metal. **Not recommended as primary dev path on Mac.**

---

## Recommendation (for discussion)

Use a **tiered local dev** approach:

| Goal | Setup |
|------|--------|
| UI / API / workflows | `MOCK_TRANSLATIONS=true` or mock + `make dev-infra` |
| Queue + Ollama integration | Host Ollama, **one 3B model**, all `OLLAMA_MODEL_*` equal, `make dev-*` |
| Router / multi-model behavior | Manual test with 2 models on **32 GB+** or CI/staging only |
| Production-like quality | Staging server or cloud API — not local Docker full stack |

**Default stance:** **`make docker-ollama-app` is not the recommended daily driver on Mac.** Prefer `make dev-infra` + native Ollama + single small model, or mock translations.

---

## Follow-ups (if we adopt)

- [ ] Add `backend/.env.dev.example` with single-model overrides
- [ ] Document hybrid dev in [docs/README.md](../docs/README.md) and [infra/ollama/README.md](../infra/ollama/README.md)
- [ ] Makefile target `dev-ollama-hybrid` with hints
- [ ] Compose: optional `host.docker.internal` Ollama URL for `docker-app` without `ollama` profile
- [ ] Warn in `make docker-ollama-app` about RAM on ≤16 GB hosts

---

## Decision log

| Date | Notes |
|------|-------|
| 2026-06-27 | Issue filed. Leaning toward **Option A** (host Ollama + one small model) for AI dev, **Option B** (mock) for everything else. |
