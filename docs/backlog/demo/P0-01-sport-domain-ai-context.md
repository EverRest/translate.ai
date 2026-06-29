# P0-01 — Sport-domain AI context

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Low · **Status:** Backlog

**Client idea:** #9 · **EverRest:** “Easy win; plus will be done”

## Goal

When translating FIFA / Wiz accreditation copy, AI knows domain context: *“FIFA World Cup accreditation form, formal tone, official sports terminology”* — especially critical for FR/ES where FIFA terminology is highly specific.

**Demo hook:** side-by-side generic AI vs contextual AI on the same field labels; quality difference is obvious.

## Current state

- Project has `description` field; injected into translation prompts at job level
- `contentType` on keys (ui, placeholder, email, …) adjusts prompt fragments
- Glossary presets exist (`ui_common_en`, `do_not_translate`) — no FIFA-specific preset
- No first-class **domain profile** (sport, event name, formality, audience)

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | Optional `Project.domainProfile` JSON: `{ domain: 'sports', event: 'FIFA WC 2026', tone: 'formal', audience: 'accreditation', localeNotes: { fr: '…', es: '…' } }` |
| **Prompts** | Extend `buildTranslationPrompts` with domain block before glossary rules |
| **Presets** | `GET /projects/:id/domain-presets` — `fifa_accreditation`, `fifa_venue_ops` seed copy |
| **Glossary** | Ship FIFA starter glossary preset (Accreditation, Venue, Privilege, Registration Group) via existing apply-preset |
| **Frontend** | Project Settings → **Domain context** textarea + preset picker; preview prompt snippet |

## Dependencies

- Glossary module (shipped)
- Optional: [P2-04](../P2-04-brand-voice.md) for tone versioning later

## Acceptance criteria

- [ ] Project can set domain context (free text + structured fields)
- [ ] Translation jobs inject domain context into every AI call for that project
- [ ] FIFA glossary preset available (≥20 sport terms, do-not-translate where needed)
- [ ] Manual smoke: same key translated with/without context shows measurable tone/terminology difference
- [ ] Docs: domain profile in `docs/domain/translation.md`; changelog entry

## Notes

Lowest-effort P0 — mostly prompt + preset content. Does not require new AI models.
