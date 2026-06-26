# ADR 0004: Multi-Tenant Isolation via tenant_id

## Status

Accepted

## Context

translate.ai is multi-tenant SaaS. Data leakage between tenants is unacceptable.

Options considered:

1. **Shared DB, tenant_id column** — row-level scoping
2. **Schema per tenant** — PostgreSQL schemas
3. **Database per tenant** — full isolation

## Decision

Use **shared PostgreSQL database** with `tenant_id` on all tenant-scoped tables.

Enforce via:

- `TenantGuard` on NestJS routes (JWT or API key → tenant resolution)
- Repository layer always filters by tenant
- Prisma middleware or base repository (future) as safety net

## Consequences

**Positive:**

- Simple schema and migrations
- Cost-effective at scale
- Standard pattern for B2B SaaS

**Negative:**

- One bug in query = potential data leak (high severity)
- Requires rigorous testing of tenant scoping
- No physical isolation for enterprise customers (future: dedicated DB option)

## Rules

- Never query tenant data without `tenant_id` filter
- Never trust `tenantId` from request body
- Integration tests must include cross-tenant access denial cases
- Audit log all admin cross-tenant actions (future)
