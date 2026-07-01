# OpenAPI Specification

REST API contract for translate.ai. Implemented with NestJS Swagger (`@nestjs/swagger`).

- **Base URL:** `/api/v1`
- **Swagger UI (dev):** `http://localhost:3000/api/docs`
- **OpenAPI JSON (dev):** `http://localhost:3000/api/docs-json`

Source of truth at runtime: Swagger decorators on controllers and DTOs in `backend/src/`.

---

## Info

```yaml
openapi: 3.0.3
info:
  title: translate.ai API
  version: 1.0.0
  description: Multi-tenant AI translation platform API
```

---

## Security schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Dashboard user session (JWT access token)
    apiKeyAuth:
      type: http
      scheme: bearer
      description: Project API key (Bearer token)
```

Most endpoints accept either scheme. `TenantGuard` resolves tenant from JWT claims or API key → project → tenant.

---

## Common schemas

### Success envelope

```yaml
SuccessResponse:
  type: object
  required: [success, data]
  properties:
    success:
      type: boolean
      example: true
    data:
      type: object
```

### Error envelope

```yaml
ErrorResponse:
  type: object
  required: [success, error]
  properties:
    success:
      type: boolean
      example: false
    error:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          example: VALIDATION_ERROR
        message:
          type: string
        details:
          type: array
          items:
            type: object
```

### Pagination

```yaml
PaginatedMeta:
  type: object
  properties:
    page:
      type: integer
      minimum: 1
    limit:
      type: integer
      minimum: 1
      maximum: 100
    total:
      type: integer
```

---

## Paths

### Auth

#### POST `/api/v1/auth/login`

Login with email and password. Returns JWT access + refresh tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

#### POST `/api/v1/auth/refresh`

Refresh access token.

#### POST `/api/v1/auth/register`

Register new tenant + admin user (MVP).

---

### Projects

#### GET `/api/v1/projects`

List projects for current tenant.

**Query:** `page`, `limit`, `status` (active | archived)

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Shop",
        "description": "E-commerce strings",
        "status": "active",
        "createdAt": "2026-06-25T12:00:00Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 1 }
  }
}
```

#### POST `/api/v1/projects`

**Request:**

```json
{
  "name": "Shop",
  "description": "E-commerce strings"
}
```

#### GET `/api/v1/projects/{projectId}`

#### PATCH `/api/v1/projects/{projectId}`

#### DELETE `/api/v1/projects/{projectId}`

Archive project (soft delete).

---

### Translation keys

#### GET `/api/v1/projects/{projectId}/keys`

**Query:** `page`, `limit`, `search`, `localizationObjectId`, `keyPrefix`

#### POST `/api/v1/projects/{projectId}/keys`

**Request:**

```json
{
  "key": "cart.checkout",
  "description": "Checkout button label",
  "context": "Primary CTA on cart page"
}
```

#### PATCH `/api/v1/projects/{projectId}/keys/{keyId}`

#### DELETE `/api/v1/projects/{projectId}/keys/{keyId}`

#### POST `/api/v1/projects/{projectId}/keys/bulk-import`

Bulk upsert translation keys.

**Request:** `{ keys: [{ key, sourceText, description?, context? }] }`

**Response:** `{ created, total }`

---

### Translations

#### GET `/api/v1/projects/{projectId}/translations`

**Query:** `language`, `status`, `keys`, `localizationObjectId`, `keyPrefix`

#### GET `/api/v1/projects/{projectId}/translations/{translationId}`

---

### AI config

#### GET `/api/v1/config/ai`

Authenticated (JWT or project API key). Returns server AI provider defaults — no API keys or model secrets.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "defaultProvider": "gemini",
    "supportedProviders": ["openai", "gemini", "ollama"],
    "providerFallback": ["openai"]
  }
}
```

---

### Translation jobs

#### POST `/api/v1/jobs`

Create async translation job. Returns immediately; processing via BullMQ.

**Request:**

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "languages": ["de", "fr", "es"],
  "keys": ["cart.checkout", "cart.total"],
  "provider": "gemini",
  "clientRequestId": "optional-idempotency-key"
}
```

`provider` is **optional**. When omitted, the server uses `AI_PROVIDER` env (default `gemini`). The dashboard does not send `provider`; set it only for explicit API overrides.

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "jobId": "660e8400-e29b-41d4-a716-446655440001",
    "status": "pending"
  }
}
```

#### GET `/api/v1/jobs`

List jobs. **Query:** `projectId`, `status`, `page`, `limit`

#### GET `/api/v1/jobs/{jobId}`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "provider": "openai",
    "progress": {
      "total": 6,
      "completed": 6,
      "failed": 0
    },
    "placeholderSummary": {
      "placeholdersTotal": 134,
      "placeholdersPreserved": 134
    },
    "createdAt": "2026-06-25T12:00:00Z",
    "completedAt": "2026-06-25T12:00:05Z"
  }
}
```

`placeholderSummary` is **optional** — present only when `placeholdersTotal` > 0 (computed per unique key from source text; counts `{{…}}` and `%%…%%` tokens). Omitted when zero.

When `progress.failed` > 0, response also includes `failures` (grouped error summary) and `failedItems` (per key/language).

#### GET `/api/v1/jobs/{jobId}/stream`

Server-Sent Events stream for real-time job progress (dashboard). **Public** endpoint — JWT passed as `token` query param (EventSource cannot send `Authorization` header).

**Query:** `projectId` (required), `token` (required, JWT access token)

**Events:** `progress` — `{ completed, total, failed }`; stream closes when job reaches terminal status.

#### POST `/api/v1/jobs/{jobId}/retry`

Retry failed items.

#### POST `/api/v1/jobs/{jobId}/cancel`

Cancel pending/processing job.

---

### Approval

#### GET `/api/v1/projects/{projectId}/reviews`

Pending translations for review.

#### POST `/api/v1/translations/{translationId}/approve`

#### POST `/api/v1/translations/{translationId}/reject`

**Request:**

```json
{
  "comment": "Tone is too informal"
}
```

#### POST `/api/v1/translations/{translationId}/publish`

---

### Localization objects

Tree authoring for forms/pages; materializes to flat keys. See [domain/localization-object.md](../domain/localization-object.md).

#### GET `/api/v1/projects/{projectId}/objects`

**Query:** `page`, `limit`, `search`, `collectionId`

#### POST `/api/v1/projects/{projectId}/objects`

**Request:** `{ name, slug, description?, templateType?, collectionId? }` — `templateType`: `form` | `page` | `modal` | `email` | `api` | `custom`. Assigns **General** collection when `collectionId` omitted.

#### GET `/api/v1/projects/{projectId}/objects/{objectId}`

Returns entity metadata + nested `tree` (includes `collectionId`, `collectionName`).

#### PATCH `/api/v1/projects/{projectId}/objects/{objectId}`

Update `name`, `description`, `templateType`, `collectionId`.

#### DELETE `/api/v1/projects/{projectId}/objects/{objectId}`

Deletes tree; materialized translation keys remain.

#### POST `/api/v1/projects/{projectId}/objects/{objectId}/nodes`

**Request:** `{ slug, nodeType, parentId?, sortOrder?, label?, sourceText?, description?, context?, contentType? }`

#### PATCH `/api/v1/projects/{projectId}/objects/{objectId}/nodes/{nodeId}`

#### DELETE `/api/v1/projects/{projectId}/objects/{objectId}/nodes/{nodeId}`

#### POST `/api/v1/projects/{projectId}/objects/{objectId}/materialize`

**Query:** `prune` — `true` to delete materialized keys no longer present in the tree (default `false`).

**Response:** `{ created, updated, pruned, total }`

#### POST `/api/v1/projects/{projectId}/objects/{objectId}/translate`

**Request:** `{ languages: ["de", "fr"] }` — materializes then creates translation job.

#### GET `/api/v1/projects/{projectId}/objects/templates`

Built-in templates: `login_form`, `registration_form`.

#### POST `/api/v1/projects/{projectId}/objects/{objectId}/generate-structure`

Queues AI structure generation (requires worker + `GEMINI_API_KEY` or `OPENAI_API_KEY`).

#### POST `/api/v1/projects/{projectId}/objects/{objectId}/apply-template`

**Request:** `{ templateId: "login_form" }` — replaces tree with built-in template.

---

### Entity collections

Group localization entities (objects) per project. See [ADR 0017](../adr/0017-entity-collections.md).

#### GET `/api/v1/projects/{projectId}/collections`

Returns `{ items: EntityCollection[] }` with `entityCount`. Ensures **General** collection exists.

#### POST `/api/v1/projects/{projectId}/collections`

**Request:** `{ name, slug, description? }`

#### PATCH `/api/v1/projects/{projectId}/collections/{collectionId}`

#### DELETE `/api/v1/projects/{projectId}/collections/{collectionId}`

Cannot delete `general` slug; entities reassigned to General.

#### POST `/api/v1/projects/{projectId}/collections/{collectionId}/import/openapi/preview`

**Request:** `{ spec: string (JSON), selectedTags?: string[] }`

#### POST `/api/v1/projects/{projectId}/collections/{collectionId}/import/openapi`

**Request:** `{ spec, selectedTags?, materialize?: boolean }` — creates one `api` entity per tag; large specs queued on `integration.openapi.import`.

---

### Glossary suggestions

#### GET `/api/v1/projects/{projectId}/glossary/suggestions`

**Query:** `status` — `pending` (default), `approved`, `rejected`

**Response:** `{ success, data: { items: GlossarySuggestion[] } }`

#### POST `/api/v1/projects/{projectId}/glossary/suggestions/analyze`

Requires at least `GLOSSARY_ANALYZE_MIN_TRANSLATIONS` (default 100) translations. Enqueues `glossary.analyze` worker job.

**Response:** `{ success, data: { queued: true, translationCount: number } }`

#### POST `/api/v1/projects/{projectId}/glossary/suggestions/{suggestionId}/approve`

Creates or updates `GlossaryTerm`; marks suggestion `approved`.

**Response:** `{ success, data: { suggestion, term } }`

#### POST `/api/v1/projects/{projectId}/glossary/suggestions/{suggestionId}/reject`

**Response:** `{ success, data: { rejected: true } }`

**Dashboard:** Project → **Glossary** tab — **Suggest terms**, review pending table.

---

### Export

#### GET `/api/v1/projects/{projectId}/export`

Synchronous download (same filters as below). Audit log recorded.

**Response:** File download (`Content-Disposition: attachment`).

#### POST `/api/v1/projects/{projectId}/exports`

**Body:**

| Field | Values |
|-------|--------|
| `format` | json, yaml, csv, android-xml, ios-strings, po |
| `language` | Optional filter (e.g. `de`) |
| `status` | draft, review, approved, published (default: published) |

**Behavior:** If matching row count ≤ `EXPORT_ASYNC_THRESHOLD` (default 1000), completes inline and returns `exportStatus: completed` with `downloadUrl`. Otherwise enqueues `translation.export` and returns `exportStatus: pending`.

**Response:** `{ success, data: ExportJob }`

#### GET `/api/v1/exports/{exportJobId}`

Poll export job status. **Response:** `{ success, data: ExportJob }`

#### GET `/api/v1/exports/{exportJobId}/download`

Download completed export file. **Response:** File download.

**Dashboard:** Project → **Export** tab uses POST + poll + download.

---

### Import (Confluence / external)

See [ADR 0016](../adr/0016-external-import.md). Staging via `ImportSession`; parse/apply on BullMQ for large files.

#### POST `/api/v1/projects/{projectId}/import/sessions`

**Content-Type:** `multipart/form-data` — field `file` (Confluence HTML, CSV, or ZIP export).

**Response:** `{ success, data: ImportSession & { queued?: boolean } }` — sync parse when ≤200 rows and not ZIP; otherwise `integration.import.parse` queue.

#### POST `/api/v1/projects/{projectId}/import/sessions/paste`

**Request:** `{ html: string }` — pasted Confluence table HTML.

#### GET `/api/v1/projects/{projectId}/import/sessions`

List import sessions (paginated).

#### GET `/api/v1/projects/{projectId}/import/sessions/{sessionId}`

Session status and diff summary.

#### GET `/api/v1/projects/{projectId}/import/sessions/{sessionId}/preview`

**Query:** `page`, `limit`, `action?` — preview diff items before apply.

#### POST `/api/v1/projects/{projectId}/import/sessions/{sessionId}/apply`

**Request:** `{ conflictStrategy?: "skip" | "update" }` — upserts keys; scope/hints stored in `TranslationKey.context`.

**Dashboard:** Project → **Import** tab — upload or paste → preview → apply.

#### Confluence live sync (Phase 2)

Requires `ATLASSIAN_CLIENT_ID`, `ATLASSIAN_CLIENT_SECRET`, `ATLASSIAN_REDIRECT_URI` on the API. When credentials are not set, `GET .../integrations/confluence` returns `oauthAvailable: false` and `setupHint` (no secrets).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects/{projectId}/integrations/confluence` | Connection + sync config status; `oauthAvailable`, `setupHint` when OAuth not configured |
| GET | `/api/v1/projects/{projectId}/integrations/confluence/connect` | OAuth authorize URL |
| GET | `/api/v1/projects/{projectId}/integrations/confluence/connect/pending-sites` | List Confluence sites after OAuth callback (multi-site picker); **Query:** `pendingToken` |
| POST | `/api/v1/projects/{projectId}/integrations/confluence/connect/complete` | Complete OAuth after site selection — `{ pendingToken, cloudId }` |
| GET | `/api/v1/integrations/confluence/oauth/callback` | Public OAuth redirect (no auth) |
| PUT | `/api/v1/projects/{projectId}/integrations/confluence/config` | `{ pageIds, spaceKey?, autoApply?, labelFilter?, parseRulesJson?, syncEnabled?, syncIntervalMinutes? }` |
| GET | `/api/v1/projects/{projectId}/integrations/confluence/spaces` | List spaces |
| GET | `/api/v1/projects/{projectId}/integrations/confluence/spaces/{spaceId}/pages` | List pages |
| POST | `/api/v1/projects/{projectId}/integrations/confluence/sync` | `{ autoApply? }` → enqueues `integration.confluence.sync` |
| DELETE | `/api/v1/projects/{projectId}/integrations/confluence` | Disconnect |

**Tenant BYO OAuth (admin JWT only):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/tenant/integrations/atlassian` | Get tenant Atlassian OAuth app config (no secrets) |
| PUT | `/api/v1/tenant/integrations/atlassian` | Upsert `{ clientId, clientSecret, redirectUri?, scopes? }` |
| DELETE | `/api/v1/tenant/integrations/atlassian` | Remove tenant OAuth app |

**Dashboard:** Project → **Settings → Integrations** — connect Confluence, select pages, sync now. If OAuth is not configured on the server, Connect/Sync are disabled and admin setup instructions are shown; file import via **Import** tab remains available.

**GET integration response (excerpt):**

```json
{
  "success": true,
  "data": {
    "connected": false,
    "oauthAvailable": false,
    "setupHint": {
      "steps": ["..."],
      "scopes": ["read:confluence-content.all", "read:confluence-space.summary", "offline_access"],
      "envVars": ["ATLASSIAN_CLIENT_ID", "ATLASSIAN_CLIENT_SECRET", "ATLASSIAN_REDIRECT_URI", "ATLASSIAN_SCOPES", "CONFLUENCE_TOKEN_ENCRYPTION_KEY"],
      "redirectUri": "http://localhost:3000/api/v1/integrations/confluence/oauth/callback",
      "docsUrl": "https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/"
    }
  }
}
```

When `oauthAvailable` is `true`, `setupHint` is `null`.

---

**Query (GET sync only):**

| Param | Values |
|-------|--------|
| `format` | json, yaml, csv, android-xml, ios-strings, po |
| `language` | Optional filter (e.g. `de`) |
| `status` | draft, review, approved, published (default: published) |

---

### API keys

#### GET `/api/v1/projects/{projectId}/api-keys`

#### POST `/api/v1/projects/{projectId}/api-keys`

**Response includes plain secret once:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "CI pipeline",
    "secret": "ta_live_...",
    "active": true
  }
}
```

#### DELETE `/api/v1/projects/{projectId}/api-keys/{keyId}`

---

### Webhooks

#### GET `/api/v1/projects/{projectId}/webhooks`

#### POST `/api/v1/projects/{projectId}/webhooks`

**Request:**

```json
{
  "url": "https://example.com/webhooks/translate",
  "secret": "whsec_...",
  "enabled": true
}
```

#### PATCH `/api/v1/projects/{projectId}/webhooks/{webhookId}`

#### DELETE `/api/v1/projects/{projectId}/webhooks/{webhookId}`

---

### Health

#### GET `/health`

No auth. Returns DB + Redis status.

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---

## Webhook events (outbound)

Not OpenAPI paths — documented for integrators. See [../workflows/webhooks.md](../workflows/webhooks.md).

| Event | Description |
|-------|-------------|
| `job.created` | Translation job created |
| `job.completed` | Job finished successfully |
| `job.failed` | Job failed or partially failed |
| `translation.approved` | Translation published |
| `project.created` | New project created |

**`job.completed` / `job.failed` payload (excerpt):**

```json
{
  "event": "job.completed",
  "timestamp": "2026-06-25T12:00:00Z",
  "data": {
    "jobId": "uuid",
    "projectId": "uuid",
    "status": "completed",
    "placeholderSummary": {
      "placeholdersTotal": 134,
      "placeholdersPreserved": 134
    }
  }
}
```

`placeholderSummary` is **optional** on `job.completed` and `job.failed` — included only when `placeholdersTotal` > 0 (same semantics as `GET /jobs/{jobId}`). `job.failed` also includes `failures` and `failedItems`.

---

## HTTP status codes

| Code | Usage |
|------|-------|
| 200 | OK |
| 201 | Created |
| 204 | No content |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 429 | Rate limited |
| 500 | Internal error |

See also [conventions.md](./conventions.md).

---

## Implementation notes

- Controllers live in `backend/src/*/presentation/`.
- DTOs use `class-validator` + `@ApiProperty()` decorators.
- Global prefix: `api/v1` (except `/health`).
- Correlation header: `X-Request-Id` (optional on request, returned on response).

When adding endpoints, update this doc and Swagger decorators in the same PR.
