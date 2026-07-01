  # P0-03 — Confluence import

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Medium–High · **Status:** Shipped (Phase 1 + Phase 2 OAuth)

**Client idea:** #5 · **EverRest:** “Killer feature”

## Goal

Wiz developers store translation keys on Confluence pages (BMA/PMA/SEQ). translate.ai connects (or accepts export), parses scope/key/value structure, and imports into a project automatically.

**Demo hook:** “Connected Confluence — 847 keys imported in 10 seconds.”

**Fallback (phase 1):** Confluence HTML/CSV export file → import without live API credentials.

## Current state

**Phase 1 (shipped):**

- `integration` module with Confluence HTML/CSV/ZIP + paste parsers ([ADR 0016](../../adr/0016-external-import.md))
- Import wizard: upload or paste → preview diff → apply; `ImportSession` staging
- Scope and hints stored in `TranslationKey.context`; hints column on Translations grid
- E2e: fixture CSV/HTML + 850-key perf demo (&lt;30s, no AI)

**Phase 2 (shipped):**

- Atlassian OAuth 3LO connect per project (`ConfluenceConnection`)
- Live page fetch + parse via `integration.confluence.sync` queue
- Settings → Integrations → Confluence: connect, pick pages, sync now
- Optional auto-apply or preview via Import session
- When OAuth env vars are missing: UI shows `setupHint` (Atlassian app steps, scopes, env vars, docs link); Connect/Sync disabled; **Import** tab file upload still works

## Proposed fit

| Layer | Change |
|-------|--------|
| **Phase 1 — File import** | Parser for exported Confluence page HTML/tables: Scope, Key, EN, Hints columns |
| **Phase 2 — Live API** | Atlassian OAuth; `ConfluenceConnection` per tenant; page ID or space + label filter |
| **Schema** | `confluence_connections`, `confluence_sync_configs` (pageIds, lastSyncedAt, parseRules) |
| **Queue** | `integration.confluence.sync` — fetch pages, parse, upsert keys + sourceText |
| **Hints** | Parse “Hints” column → `TranslationKey.context` or glossary hints (e.g. placeholder rules) |
| **API** | `POST /projects/:id/integrations/confluence/sync`, webhook optional (page updated) |
| **Frontend** | Settings → Integrations → Confluence; manual sync + last sync stats |

### Parse rules (Wiz)

```text
Table columns: Scope | Key | Default (EN) | Hints
Key path: {scope}.{key} or as-is per client convention
Hints containing "%%…%% must be kept" → flag key context for QA
```

## Dependencies

- [P0-02](./P0-02-excel-delta-import.md) shares import UX patterns
- [P0-S02](./P0-S02-placeholder-protection.md) for %% hints

## Acceptance criteria

- [x] **Phase 1:** Upload Confluence HTML export → keys + source text imported with scope preserved
- [x] **Phase 2:** OAuth connect; sync specified pages; idempotent upsert
- [x] Demo script: ≥800 keys from sample export in <30s (no AI)
- [x] Hints column stored and visible in key detail / translation grid
- [x] ADR: `0016-external-import.md`
- [x] E2e: fixture HTML → expected key count and paths

## Notes

Start with file import to unblock demo without Atlassian app review; live API is phase 2.

---

## Agent review

**Verdict:** Agree — killer feature; **phase 1 file import should be Wave 2 priority #1** (before Excel if Confluence is primary source of truth for Wiz).

### Architecture

- **Shared parser interface** with P0-02:
  ```text
  ImportParser.parse(buffer) → { rows: ImportRow[], warnings[], stats }
  ImportRow: { scope, key, sourceText, hints?, externalId? }
  ```
- Confluence HTML export is messy (merged cells, macros). Phase 1: support **Confluence “Export to Word/HTML” table** + **CSV export** if Wiz uses it — get **one real page sample** from client before coding parser.
- Map `scope` → key prefix `{scope}.{key}` **or** store `scope` tag on key (`TranslationKey.context` prefix line `scope:Interface Elements`) — explicit tag beats fragile prefix index ([P0-06](./P0-06-translation-coverage-heatmap.md) depends on this).
- Hints column → `TranslationKey.context`; regex-detect `%%…%%` and append `strictPlaceholders: true` hint for QA.
- Phase 2 OAuth: store tokens encrypted in tenant settings; `integration.confluence.sync` queue — never call Confluence from HTTP handler.

### Technical

- HTML parser: `cheerio` + table row normalizer; unit tests with **sanitized fixture HTML** (no live Confluence in CI).
- Idempotent upsert: `(projectId, key)` unique — update `sourceText` only if changed → triggers P0-04 stale flow.
- Rate limits on live API: batch page fetch, respect Atlassian 429 with BullMQ backoff.

### UI

- Phase 1: **Import → Confluence export file** in same wizard shell as Excel (shared step 1 upload component).
- Phase 2: **Project Settings → Integrations → Confluence** — connect, pick pages/spaces, “Sync now”, last sync diff summary (`+12 keys, ~3 source changed`).
- Key detail / grid: show **Hints** column (truncated) — translators must see Confluence rules.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Difficulty Medium–High | Phase 1 file-only is **Medium**; live OAuth + webhooks is **High** — split AC by phase |
| `Key path: {scope}.{key}` | Confirm with Wiz — their Evo import may use flat keys with scope in separate column; wrong guess breaks round-trip |
| Separate ADR 0016 only for Confluence | One ADR for external import (Excel + Confluence + future) |
