# ADR 0001: Modular Monolith

## Status

Accepted

## Context

translate.ai is a new SaaS platform. We need an architecture that supports:

- Multiple DDD bounded contexts (translation, project, tenant, approval, webhooks)
- Async AI processing
- Future scale to thousands of tenants

Options considered:

1. **Microservices from day one** — independent deployable services per domain
2. **Modular monolith** — single NestJS app, strict module boundaries
3. **Serverless** — Lambda + managed queues

## Decision

Start with a **modular monolith**: one NestJS API + separate BullMQ worker processes.

Modules map to bounded contexts under `src/`. Cross-module communication via events and command/query buses only.

## Consequences

**Positive:**

- Lower operational cost and complexity at MVP
- Easier local development and debugging
- Single deployment artifact; faster iteration
- Can extract modules to microservices later when boundaries are proven

**Negative:**

- Shared runtime — blast radius if API process crashes
- Requires discipline to avoid tight coupling between modules
- Single codebase can grow large without enforcement

## Enforcement

- No direct imports of another module's Prisma repositories
- ADR required before extracting a service or merging modules
- Module communication: events, CommandBus, QueryBus, shared interfaces only
