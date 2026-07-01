# P0-01 — Sport-domain AI context

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Low · **Status:** Shipped

> Moved out of active P0 backlog — see [shipped-baseline](../shipped-baseline.md) and [demo/README](./README.md#already-shipped--covered-no-new-p0-work).

**Client idea:** #9 · **EverRest:** “Easy win; plus will be done”

## Goal

When translating FIFA / Wiz accreditation copy, AI knows domain context: *“FIFA World Cup accreditation form, formal tone, official sports terminology”* — especially critical for FR/ES where FIFA terminology is highly specific.

**Demo hook:** side-by-side generic AI vs contextual AI on the same field labels; quality difference is obvious.

## Shipped

| Capability | Location |
|------------|----------|
| `Project.domainProfile` JSON | Prisma schema; `PATCH /projects/:id` accepts `domainProfile` |
| Domain presets API | `GET /projects/:id/domain-presets` — `fifa_accreditation`, `fifa_venue_ops` (`shared/domain/domain-presets.ts`) |
| Prompt injection | `buildTranslationPrompts` — domain block before glossary rules; `localeNotes[targetLang]` per job item |
| FIFA glossary preset | `fifa_accreditation` in `glossary-presets.ts` (24 terms); `GET/POST .../glossary/presets` list + apply |
| Domain context UI | Project **Settings → Domain context** — preset picker, structured fields, prompt preview, apply FIFA glossary CTA |
| Copy settings API | `POST /projects/:id/copy-settings` — copy `domainProfile` and/or glossary from another tenant project |
| Post-create onboarding | **Projects** modal after create — FIFA preset (+ optional glossary), copy from another project, or skip |
| Docs | `docs/domain/translation.md`, `docs/domain/project.md` — domain profile pipeline and onboarding |

## Deferred (not blocking demo)

- Manual smoke: same key translated with/without context shows measurable tone/terminology difference — use two projects or context-off retranslate for side-by-side demo (no automated e2e yet)
- Tenant-scoped glossary shared across event projects — see [P0-S01](./P0-S01-glossary-platform.md)

## Acceptance criteria

- [x] Project can set domain context (free text + structured fields)
- [x] Translation jobs inject domain context into every AI call for that project
- [x] FIFA glossary preset available (≥20 sport terms, do-not-translate where needed)
- [ ] Manual smoke: same key translated with/without context shows measurable tone/terminology difference (deferred — demo script, not automated test)
- [x] Post-create onboarding: FIFA preset, copy from project, or skip
- [x] Docs: domain profile in `docs/domain/translation.md`; changelog entry

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

**Shipped note:** Implementation used `domainProfile` JSON on `Project` and server `GET /projects/:id/domain-presets` per product scope — agent review disagreements retained for historical context.
