# Project Domain

Manages customer projects and integration settings.

## Aggregate: Project

| Field | Description |
|-------|-------------|
| id | UUID |
| tenant_id | FK → Tenant (required on all queries) |
| name | Project name |
| description | Optional |
| status | active, archived |
| created_at | Timestamp |

## Child entities

### ApiKey

| Field | Description |
|-------|-------------|
| id | UUID |
| project_id | FK → Project |
| name | Label |
| secret | Hashed secret |
| active | Boolean |

Used for programmatic API access. Scoped to project + tenant.

### Webhook

| Field | Description |
|-------|-------------|
| id | UUID |
| project_id | FK → Project |
| url | HTTPS endpoint |
| secret | HMAC signing secret |
| enabled | Boolean |

### Environment (future)

Staging / production separation for keys and translations.

## Project structure (logical)

```text
Project
├── API Keys
├── Webhooks
├── Languages (configured targets)
├── Translation Keys
├── Translation Jobs
└── Settings (default provider, tone, glossary)
```

## Commands

- `CreateProjectCommand`
- `UpdateProjectCommand`
- `ArchiveProjectCommand`
- `CreateApiKeyCommand`
- `CreateWebhookCommand`

## Queries

- `GetProjectQuery`
- `ListProjectsQuery`
- `ListApiKeysQuery`

## Events

- `ProjectCreatedEvent`
- `WebhookConfiguredEvent`

## Rules

- Project belongs to exactly one tenant.
- Deleting a project is soft-delete (archive) unless explicitly purged.
- API keys and webhooks are never shared across projects.

## Related

- [domain/tenant.md](./tenant.md)
- [workflows/webhooks.md](../workflows/webhooks.md)
