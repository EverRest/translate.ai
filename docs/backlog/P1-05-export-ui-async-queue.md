# P1-05 — Export UI + async export queue

**Phase:** 1 · **Priority:** Medium · **Status:** Partial (sync UI shipped)

## Goal

Users download translations from dashboard; large exports don't block API.

## Current state

- **Backend:** `GET /projects/:projectId/export?format=&language=&status=` — synchronous (audit log on export)
- Formats: json, yaml, csv, android-xml, ios-strings, po
- **Frontend:** project **Export** tab (`/projects/:id/export`) — sync download with format, language, status filters
- Queue `translation.export` registered in constants — **no worker processor**

## Proposed fit (remaining)

| Layer | Change |
|-------|--------|
| **Command** | `RequestExportCommand` → enqueue `translation.export` |
| **Worker** | Processor in `worker/processors/` → write temp file or S3-compatible storage |
| **Schema** | `export_jobs` (projectId, format, status, downloadUrl, expiresAt) |
| **API** | `POST /projects/:id/exports`, `GET /exports/:id` |
| **Webhook** | Optional `export.completed` event |

Keep sync endpoint as fast path for small/medium projects.

## Dependencies

- None

## Acceptance criteria

- [x] UI export generates file for json + po (all 6 formats via same control)
- [x] Audit log entry on export (backend; unchanged)
- [ ] Export >1000 keys uses queue; poll status in UI
- [ ] Unit tests for `ExportFormatService` unchanged; integration for async path
