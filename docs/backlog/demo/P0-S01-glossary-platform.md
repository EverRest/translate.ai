# P0-S01 — Glossary / translation memory platform

**Phase:** FIFA/WIZ · **Importance:** Critical · **Status:** Shipped (improvements ongoing)

**Client idea:** #14 · **EverRest:** “General implementation is ready; expecting improvements in future”

## Goal

Terms like “Accreditation”, “Venue”, “Privilege”, “Registration Group” translate identically everywhere — glossary checked before AI translates; consistency across events.

## Shipped (baseline + recent)

| Capability | Location |
|------------|----------|
| Manual glossary CRUD | ADR 0005, `glossary` module |
| Auto glossary suggestions | ADR 0012, `glossary.analyze` queue |
| Upsert + bulk upsert | `GlossaryService.upsertTerm` |
| Multi-glossary sets | ADR 0015, activate per project |
| Presets | `ui_common_en`, `ui_common_en_ru`, `do_not_translate` |
| Terminology drift scan | P2-05, `terminology.scan` queue, Drift UI |
| AI prompt injection | `buildTranslationPrompts` + glossary terms |
| Semantic TM | [P1-01](../P1-01-semantic-translation-memory.md) — backlog enhancement |

## Remaining improvements (not blocking FIFA demo)

- [x] FIFA-specific preset pack ([P0-01](./P0-01-sport-domain-ai-context.md)) — `fifa_accreditation` (24 terms)
- [ ] Tenant-level glossary shared across event projects
- [x] Auto-scan after translate job ([P0-07](./P0-07-consistency-check.md) Wave 1)
- [ ] Per-language glossary target terms
- [ ] CSV glossary import

## Acceptance criteria (original #14)

- [x] Glossary terms applied during AI translation
- [x] Do-not-translate flag honored
- [x] Inconsistency detection across keys (terminology drift)
- [x] User can promote preferred term from drift resolve flow

## Notes

Client #4 consistency check is **partially addressed** via glossary + drift — see [P0-07](./P0-07-consistency-check.md).

---

## Agent review

**Verdict:** Agree — shipped for MVP. Remaining items are polish, not new platform work.

### Architecture

- **Tenant-level shared glossary** (remaining item): extend `Glossary` with optional `tenantId` scope or “shared set” copy-on-activate to event projects — ADR before schema change.
- Auto-scan after job: implement in P0-07 via event handler, not glossary module.

### Technical

- FIFA preset: add `fifa_sports_en_fr_es` to `glossary-presets.ts` — content work, not code architecture.
- CSV import: reuse bulk-upsert endpoint with CSV parser in `integration` module.

### UI

- Cross-project glossary: **Tenant Settings → Shared terminology** (future) — for MC26/WWC27 reuse.
- Translations page: ensure drift badge visible without manual scan after P0-07 ships.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Listed as “no new P0 work” | P0-01 FIFA preset + P0-07 auto-scan shipped in Wave 1 — remaining items are tenant-level shared glossary and CSV import |
