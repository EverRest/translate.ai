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

- [ ] FIFA-specific preset pack ([P0-01](./P0-01-sport-domain-ai-context.md))
- [ ] Tenant-level glossary shared across event projects
- [ ] Auto-scan after translate job ([P0-07](./P0-07-consistency-check.md))
- [ ] Per-language glossary target terms
- [ ] CSV glossary import

## Acceptance criteria (original #14)

- [x] Glossary terms applied during AI translation
- [x] Do-not-translate flag honored
- [x] Inconsistency detection across keys (terminology drift)
- [x] User can promote preferred term from drift resolve flow

## Notes

Client #4 consistency check is **partially addressed** via glossary + drift — see [P0-07](./P0-07-consistency-check.md).
