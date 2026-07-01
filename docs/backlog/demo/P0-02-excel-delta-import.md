# P0-02 — Excel round-trip + delta import

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Medium · **Status:** Shipped (MVP)

> Moved out of active backlog — see [shipped-baseline](../shipped-baseline.md) and [demo/README](./README.md#already-shipped--covered-no-new-p0-work). Client ideas #10 and #17 merged into this item.

**Client ideas:** #10 Excel round-trip · #17 Delta import from Classic · **EverRest:** “Planned”

## Goal

Accept the client’s existing Excel export (with Field ID column), fill **empty translation cells** with AI, return a file in **identical format** for import back into their system — zero migration friction.

**Demo hook:** upload 847-row export → download completed file in 2 minutes; every column preserved.

## Shipped (MVP)

| Layer | Change |
|-------|--------|
| **Parser** | `exceljs` parse + compose; Wiz Classic preset (`Field ID \| Scope \| Key \| EN \| FR \| ES…`); empty-cell detection per language |
| **Queues** | `integration.excel.parse`, `integration.excel.compose` — parse preview + merge AI results into stored original workbook |
| **Schema** | `ImportSession.translationJobId`, `outputStoragePath`, `excelLayoutJson`; `Project.excelImportProfile` |
| **API** | `POST .../import/excel/preview`, profile GET/PUT, session GET, `delta-translate`, `download` |
| **UI** | Import tab → **Excel round-trip** — upload → empty-cell stats + sample rows → translate → download |
| **Tests** | `excel.parser.spec.ts`, `import-excel.e2e-spec.ts` (mock translations) |

## Code locations

| Area | Path |
|------|------|
| Parser + compose | `backend/src/integration/domain/parsers/excel.parser.ts`, `wiz-classic-preset.ts` |
| Controller + DTOs | `backend/src/integration/presentation/excel-import.controller.ts`, `dto/excel-import.dto.ts` |
| Handlers | `backend/src/integration/application/handlers/excel.handlers.ts` |
| Delta translate + compose | `excel-delta-translate.service.ts`, `excel-compose.service.ts`, `excel-job-runner.service.ts` |
| Queues | `excel-queue.service.ts`, `worker/processors/excel.processor.ts` |
| Import tab UI | `frontend/src/features/import/components/ExcelImportPanel.tsx`, `pages/ProjectImportPage.tsx` |

## Deferred

- Optional “also import keys to project” checkbox (round-trip demo does not materialize keys)
- Idempotency: same file hash + profile → skip re-translate unless `force=true`
- Custom column-mapping wizard UI (API supports `custom` preset; UI ships Wiz Classic only)
- Before/after diff highlight in preview (sample rows only for MVP)

## Dependencies

- [P0-01](./P0-01-sport-domain-ai-context.md) recommended for translation quality
- Placeholder validator (shipped) must run on filled cells

## Acceptance criteria

- [x] Upload client Excel; system detects empty translation cells per language
- [x] Delta translate fills empties only; existing human translations untouched
- [x] Downloaded file: same sheet structure, column order, and Field ID values as input
- [x] Import profile saved per project (Wiz Classic preset ships out of box)
- [x] E2e: fixture xlsx → job → output byte-compatible layout (spot-check rows)
- [x] ADR if new import bounded context (reuses ADR 0016 `integration` module)

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
