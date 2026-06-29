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
