# P1-05 — Export UI + async export queue

**Phase:** 1 · **Priority:** Medium · **Status:** Backlog

## Goal

Users download translations from dashboard; large exports don't block API.

## Current state

- **Backend:** `GET /projects/:projectId/export?format=&language=&status=` — synchronous
- Formats: json, yaml, csv, android-xml, ios-strings, po
- Queue `translation.export` registered in constants — **no worker processor**
- **Frontend:** no export button/page

## Proposed fit

| Layer | Change |
|-------|--------|
| **Command** | `RequestExportCommand` → enqueue `translation.export` |
| **Worker** | Processor in `worker/processors/` → write temp file or S3-compatible storage |
| **Schema** | `export_jobs` (projectId, format, status, downloadUrl, expiresAt) |
| **API** | `POST /projects/:id/exports`, `GET /exports/:id` |
| **Frontend** | Project → Export tab: format, languages, status filter, download link |
| **Webhook** | Optional `export.completed` event |

Keep sync endpoint for small projects (<500 keys) as fast path.

## Dependencies

- None

## Acceptance criteria

- [ ] UI export generates file for json + po
- [ ] Export >1000 keys uses queue; poll status in UI
- [ ] Audit log entry on export
- [ ] Unit tests for `ExportFormatService` unchanged; integration for async path
