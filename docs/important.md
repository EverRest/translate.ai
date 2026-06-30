# AI-First Documentation Guide

For vibe coding (fast iterative development with AI/LLM), `docs/` must work as the **single source of context**, not as formal documentation nobody reads.

The idea is simple: you do not write everything — you write what **helps the agent avoid breaking architecture and make correct decisions quickly**.

---

## Recommended structure

```text
docs/
README.md
architecture.md
system-overview.md

adr/
0001-modular-monolith.md
0002-bullmq-queues.md

domain/
translation.md
project.md
tenant.md

api/
openapi.md
conventions.md

database/
schema.md

workflows/
translation-job.md
webhooks.md
queues.md

coding-standards.md
patterns.md
```

See [README.md](./README.md) for the current index.

---

## What actually matters (80/20)

### 1. `architecture.md` — most important file

Not academic theory — answers to:

- how the system is built (modular monolith / microservices)
- module boundaries
- how services communicate
- where business logic lives
- what must NOT be done

This is file #1 for Cursor / GPT agents.

### 2. `patterns.md`

Include:

- CQRS (how it is implemented here)
- Saga orchestration
- Jobs / queue rules
- Outbox pattern (if used)
- Idempotency rules

### 3. `coding-standards.md`

Short and practical:

- naming conventions
- service structure
- skinny controllers rule
- where business logic goes
- validation rules
- DTO conventions

### 4. `workflows/`

Critical for AI agents:

- how a translation job is created
- how events are processed
- how sagas run
- which jobs are enqueued

This replaces informal human context.

### 5. ADR (Architecture Decision Records)

Format: `0003-ai-provider-abstraction.md`

Each ADR covers:

- problem
- options
- decision
- consequences

### 6. `system-overview.md`

One page:

- what the system is
- key modules
- main data flows

---

## Vibe coding principle

> If an AI agent opens docs and cannot understand the system in 30–60 seconds — the docs are bad.

---

## Agent rules

See [../AGENTS.md](../AGENTS.md) in the project root. That file is the canonical agent instruction set (system prompt, TDD workflow, CQRS/DDD rules, full docs map).

When updating architecture or patterns, update `AGENTS.md`, relevant ADRs, and [changelog.md](./changelog.md) together.

---

## Maintenance

- Keep docs in **English**.
- Update [changelog.md](./changelog.md) for notable doc or architecture changes.
- New patterns require an ADR before implementation.
