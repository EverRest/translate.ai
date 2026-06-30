# P0-02 — Excel round-trip + delta import

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Medium · **Status:** Backlog

**Client ideas:** #10 Excel round-trip · #17 Delta import from Classic · **EverRest:** “Planned”

## Goal

Accept the client’s existing Excel export (with Field ID column), fill **empty translation cells** with AI, return a file in **identical format** for import back into their system — zero migration friction.

**Demo hook:** upload 847-row export → download completed file in 2 minutes; every column preserved.

## Current state

- Frontend exports grid to `.xlsx` via `xlsx` library (generic columns)
- `POST /projects/:id/keys/bulk-import` accepts JSON keys — not client Excel schema
- No column-mapping profiles; no “fill empty only” mode
- Translation jobs operate on in-app keys, not file-in/file-out round-trip

## Proposed fit

| Layer | Change |
|-------|--------|
| **Module** | `import` subfolder or extend `translation-key` — `ExcelImportProfile`, parsers |
| **Schema** | `import_profiles` per project: column map (fieldId, scope, key, sourceLang, targetLang columns) |
| **API** | `POST /projects/:id/import/excel/preview` — parse, validate, stats (empty cells count) |
| **API** | `POST /projects/:id/import/excel/delta-translate` — enqueue job for empty cells only |
| **API** | `GET /projects/:id/import/excel/:jobId/download` — same layout as input |
| **Queue** | Reuse `translation.job` with `mode: delta-import`, key refs from row IDs |
| **Frontend** | Import wizard: upload → map columns (or pick Wiz Classic preset) → preview → translate → download |

### Wiz Classic preset (initial)

```text
Columns: Field ID | Scope | Key | EN (source) | FR | ES | …
Rule: never modify Field ID / Scope / Key / source columns
Fill: only blank target-language cells
```

## Dependencies

- [P0-01](./P0-01-sport-domain-ai-context.md) recommended for translation quality
- Placeholder validator (shipped) must run on filled cells

## Acceptance criteria

- [ ] Upload client Excel; system detects empty translation cells per language
- [ ] Delta translate fills empties only; existing human translations untouched
- [ ] Downloaded file: same sheet structure, column order, and Field ID values as input
- [ ] Import profile saved per project (Wiz Classic preset ships out of box)
- [ ] E2e: fixture xlsx → job → output byte-compatible layout (spot-check rows)
- [ ] ADR if new import bounded context

## Notes

#10 and #17 are the same workflow from the client perspective — one backlog item.

---

## Agent review

**Verdict:** Agree on goal and merge of #10/#17. **Disagree** with difficulty **Medium** — byte-identical Excel round-trip is **Medium–High**; MVP “fill empties + download” without full DB sync can stay Medium.

### Architecture

- **New `integration` module** (ADR 0016 shared with P0-03): `ExcelImportProfile`, `ParseExcelCommand`, `ExportExcelCommand` — not a subfolder buried in `translation-key` (keeps import/export symmetric with existing `export` module).
- **Two-phase pipeline** (required by AGENTS.md — no AI in HTTP):
  1. `integration.excel.parse` — validate file, store original blob (local disk dev / S3 prod), return preview stats
  2. `integration.excel.delta-translate` → creates normal `translation.process` items for empty cells only
  3. `integration.excel.compose` — merge AI results back into **stored original workbook** (preserve styles, extra sheets, formulas)
- **Do not require full key materialization** for round-trip demo: row-level `externalId` (Field ID) maps to job items; optional “also import keys to project” checkbox for ongoing editing in UI.
- Reuse `PlaceholderValidator` on every filled cell; failed rows stay empty in output + error column (Wiz can re-import).

### Technical

- Parse with **`exceljs`** on backend (preserve formatting better than sheetjs); frontend `xlsx` only for small preview if needed.
- Wiz Classic preset: versioned JSON fixture in `backend/test/fixtures/wiz-classic-export.xlsx` — e2e must assert column order + untouched Field IDs.
- Idempotency: same file hash + profile → skip re-translate unless `force=true`.
- Job metadata: `{ importProfileId, sourceFileId, mode: 'delta-import' }` on `TranslationJob` — may need nullable JSON column or link table (plan in ADR).

### UI

- **Import wizard** (modal or `/projects/:id/import`): Steps — Upload → Preset (Wiz Classic) → Preview table (first 20 rows + “847 empty cells in FR”) → Languages → Start → Progress → Download.
- Show **before/after diff** for sample rows in preview — demo gold.
- Do not use Translations grid as primary UX for this flow; grid is for ongoing work after optional import.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| `GET .../import/excel/:jobId/download` sync | Large files must be async; poll job status then download link |
| Reuse `translation.job` with mode only | Need compose step queue job; translation job alone cannot rebuild xlsx |
| Wave 1 item | Move to Wave 2 after P0-03 file import unless Wiz sends Excel before Confluence export sample |
