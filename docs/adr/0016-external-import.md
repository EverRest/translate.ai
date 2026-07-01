# ADR 0016: External import pipeline (integration module)

## Status

Accepted

## Context

Wiz/FIFA teams store translation keys in Confluence pages and Excel exports. translate.ai needs file-based import with preview/diff before apply, shared by Confluence (P0-03) and Excel round-trip (P0-02). Current `POST /keys/bulk-import` only inserts new keys and skips updates/context.

## Decision

Add an **`integration`** bounded context (symmetric to `export`):

- **`ImportParser`** interface — each source format implements `parse()` → `ImportDocument` (rows + warnings + stats); parsers never write to DB
- **Staging model** — `ImportSession` + `ImportSessionItem` hold parsed rows and diff until user clicks **Apply**
- **Key mapping** — flat `TranslationKey.key` as exported; `scope` and `hints` encoded in `TranslationKey.context`:
  ```text
  scope: BMA/Login
  hints: %%userName%% must be kept
  strictPlaceholders: true
  ```
- **`externalSource` / `externalId`** on session items for future sync and stale detection (P0-04)
- **Queues** (ADR 0002): `integration.import.parse`, `integration.import.apply` — no parsing or bulk upsert in HTTP handlers for large files
- **No AI during import** — import source of truth only; translation jobs run separately

Phase 1 sources: Confluence HTML/CSV/ZIP export, paste HTML. Phase 2: Atlassian OAuth live sync. Excel parser added under same module for P0-02.

## Consequences

**Positive:**

- Preview diff before mutating project keys
- Extensible parser registry (Notion, JSON, etc.)
- Idempotent re-import: unchanged rows skipped, sourceText updates feed stale flow

**Negative:**

- New tables and async UX complexity
- HTML table variance requires fixture-driven parser tests

## Rules

- Tenant isolation via `ProjectAccessService` on every handler
- Sync parse/apply when ≤200 rows; queue above (same threshold as OpenAPI import)
- Apply upserts on `(projectId, key)` unique constraint
- Upload files stored under configurable import storage dir (mirror export storage)
