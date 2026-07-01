# API Conventions

REST API served by NestJS. Base path: `/api/v1`.

## Versioning

- URI versioning: `/api/v1/...`, `/api/v2/...`
- Breaking changes require new version; old version maintained during deprecation window.

## Authentication

| Method | Header | Use case |
|--------|--------|----------|
| JWT | `Authorization: Bearer <token>` | Dashboard / user sessions |
| API Key | `Authorization: Bearer <project-api-key>` | Programmatic integration |

All authenticated routes run through `JwtAuthGuard` or `ApiKeyGuard` + `TenantGuard`.

## Request / response format

- Content-Type: `application/json`
- Dates: ISO 8601 UTC
- IDs: UUID strings

### Success response

```json
{
 "success": true,
 "data": { }
}
```

### Error response

```json
{
 "success": false,
 "error": {
 "code": "VALIDATION_ERROR",
 "message": "Human-readable message",
 "details": []
 }
}
```

HTTP status codes:

| Code | Usage |
|------|-------|
| 200 | OK (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No content (DELETE) |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (wrong tenant/role) |
| 404 | Not found |
| 409 | Conflict (duplicate key) |
| 429 | Rate limited |
| 500 | Internal error |

## Core endpoints

### Translation jobs

```http
POST /api/v1/jobs
```

Request:

```json
{
 "projectId": "uuid",
 "languages": ["de", "fr"],
 "keys": ["cart.checkout", "cart.total"]
}
```

Response:

```json
{
 "success": true,
 "data": { "jobId": "uuid" }
}
```

```http
GET /api/v1/jobs/{id}
```

### Projects

```http
GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/projects/{id}
PATCH /api/v1/projects/{id}
```

### Translation keys

```http
GET /api/v1/projects/{id}/keys
POST /api/v1/projects/{id}/keys
PATCH /api/v1/projects/{id}/keys/{keyId}
```

### Export

```http
GET /api/v1/projects/{id}/export?format=json
```

Formats: `json`, `yaml`, `csv`, `xlsx`, `android-xml`, `ios-strings`, `po`.

### Webhooks (management)

```http
GET /api/v1/projects/{id}/webhooks
POST /api/v1/projects/{id}/webhooks
DELETE /api/v1/projects/{id}/webhooks/{webhookId}
```

## Validation

- All input validated via DTOs + class-validator.
- Unknown fields rejected (`forbidNonWhitelisted: true`).
- Pagination: `?page=1&limit=20` (default limit 20, max 100).

## Rate limiting

- `ThrottlerModule`: default 10 req/sec per API key / user.
- Stricter limits on job creation endpoints.

## Swagger

- OpenAPI docs at `/api/docs` (non-production or auth-gated in production).
- Keep DTO decorators in sync with validation rules.

## Correlation

- Accept or generate `X-Request-Id` header.
- Propagate through logs, jobs, and webhook payloads.

## Related

- [workflows/translation-job.md](../workflows/translation-job.md)
- [coding-standards.md](../coding-standards.md)
