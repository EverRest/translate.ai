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

---

## Agent review

**Verdict:** Agree — Critical + Low is correct. EverRest “easy win” is accurate **if** scope stays prompt + preset, not a new domain engine.

### Architecture

- **Do not add `domainProfile` JSON on `Project` in v1.** KISS: extend existing `project.description` + structured optional fields (`domain`, `tone`, `eventName`) as nullable columns, or a single validated DTO stored in `description` with a delimiter block. JSON blobs without migration/versioning become prompt-debug nightmares.
- Inject via existing `TranslateOptions` in `buildTranslationPrompts` (`prompt.builder.ts`) — same path as glossary and `contentType` hints. No new AI provider method.
- FIFA glossary preset belongs in `glossary/domain/glossary-presets.ts` (same pattern as `ui_common_en_ru`), activated by one click — not a separate “domain presets” API unless presets exceed glossary semantics.
- Cross-event consistency: tenant-scoped glossary set (future) beats per-project domain copy — flag for P0-S01, not P0-01.

### Technical

- Add unit tests in `prompt.builder.spec.ts` for domain block presence/absence — TDD per AGENTS.md.
- `localeNotes` per language should map to **target-language paragraph in system prompt**, not separate API calls.
- Side-by-side demo: use two projects or “context off” toggle on retranslate — do not run double AI in one job without explicit UX label (cost doubling).

### UI

- **Project Settings → General** (not new top-level tab): collapsible “Domain & tone” with preset dropdown (`FIFA Accreditation`, `FIFA Venue Ops`, Custom).
- Show read-only **prompt preview** snippet (system prompt excerpt) so PMs see what AI receives — builds trust in demo.
- Link “Apply FIFA glossary preset” CTA next to preset picker (empty glossary state pattern already exists).

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Difficulty **Low** | Low for MVP prompt injection; **Medium** if you add preview UI, multiple presets, and locale-specific notes with validation |
| `GET /projects/:id/domain-presets` | Prefer static preset list in frontend + shared `glossary-presets.ts`; server endpoint only if presets become tenant-editable |
