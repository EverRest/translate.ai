# P0-03 — Confluence import

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Medium–High · **Status:** Backlog

**Client idea:** #5 · **EverRest:** “Killer feature”

## Goal

Wiz developers store translation keys on Confluence pages (BMA/PMA/SEQ). translate.ai connects (or accepts export), parses scope/key/value structure, and imports into a project automatically.

**Demo hook:** “Connected Confluence — 847 keys imported in 10 seconds.”

**Fallback (phase 1):** Confluence HTML/CSV export file → import without live API credentials.

## Current state

- Keys created via UI, API, bulk JSON import, localization object materialize
- No Confluence connector, no HTML table parser for Wiz page format
- No scope concept matching client’s Confluence hierarchy (may map to key prefix or tags)

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

- [ ] **Phase 1:** Upload Confluence HTML export → keys + source text imported with scope preserved
- [ ] **Phase 2:** OAuth connect; sync specified pages; idempotent upsert
- [ ] Demo script: ≥800 keys from sample export in <30s (no AI)
- [ ] Hints column stored and visible in key detail / translation grid
- [ ] ADR: `0016-confluence-import.md`
- [ ] E2e: fixture HTML → expected key count and paths

## Notes

Start with file import to unblock demo without Atlassian app review; live API is phase 2.
