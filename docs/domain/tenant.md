# Tenant Domain

Multi-tenant organization and user management.

## Aggregates

### Tenant

| Field | Description |
|-------|-------------|
| id | UUID |
| name | Organization name |
| slug | URL-safe identifier |
| created_at | Timestamp |

### User

| Field | Description |
|-------|-------------|
| id | UUID |
| tenant_id | FK → Tenant |
| email | Unique per tenant |
| password | Hashed (argon2/bcrypt) |
| role | admin, reviewer, developer, viewer |
| created_at | Timestamp |

## Relations

```text
Tenant 1 ── * User
Tenant 1 ── * Project
```

## RBAC

| Role | Permissions |
|------|-------------|
| admin | Full tenant access, billing, user management |
| developer | Projects, API keys, jobs, exports |
| reviewer | Approval workflow, comments |
| viewer | Read-only dashboard |

Future: granular permissions table (`roles`, `permissions`, pivot).

## Multi-tenant isolation

**Critical rule:** Every query on tenant-scoped data MUST filter by `tenant_id`.

Implementation:

- `TenantGuard` extracts tenant from JWT claims or API key → project → tenant chain.
- Repository base class or Prisma middleware enforces tenant scope.
- Never accept raw `tenantId` from request body without guard validation.

## Commands

- `RegisterTenantCommand`
- `InviteUserCommand`
- `UpdateUserRoleCommand`

## Queries

- `GetCurrentUserQuery`
- `ListTenantUsersQuery`

## Security

- JWT access token + refresh token rotation.
- Refresh tokens stored hashed.
- Password hashing: argon2 preferred.

## Related

- [adr/0004-multi-tenant-isolation.md](../adr/0004-multi-tenant-isolation.md)
- [patterns.md](../patterns.md) — multi-tenant scoping
