# P0-D05 — Locale split

**Phase:** FIFA/WIZ Deferred · **Importance:** Medium · **Difficulty:** High · **Status:** Deferred

**Client idea:** #25 · **EverRest:** “Need additional models and controller; in general doable”

## Goal

Support regional locales: FR-FR vs FR-CA vs FR-BE; ES-ES vs ES-MX vs ES-AR — not just language codes.

## Current state

- Projects configure **languages** (e.g. `fr`, `es`) without region subtags
- Single prompt per language; no locale-specific glossary rows by default

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | BCP-47 locales on project languages; glossary term optional `locale` scope |
| **Router** | Controller picks prompt variant / glossary subset per locale |
| **AI** | Locale notes in domain profile ([P0-01](./P0-01-sport-domain-ai-context.md)) |

## Dependencies

- Data model migration for existing projects
- Client must request which locales are in scope for MC26

## Acceptance criteria

- [ ] Deferred until base languages workflow stable
- [ ] When resumed: project supports `fr-CA` and `fr-FR` as distinct columns

## Notes

FIFA international audience eventually needs this; not blocking first Wiz demo.

---

## Agent review

**Verdict:** Agree with EverRest — defer. **Partial workaround in P0-01:** `localeNotes.fr` / `localeNotes.es` in domain context covers MC26 demo for FR/ES without full BCP-47 split.

### Architecture

- Migration: `ProjectLanguage.code` from `VarChar(5)` to BCP-47 (`fr-CA`) — breaking change for exports/API; needs ADR + migration path.
- Glossary terms need optional `locale` column — filter in `getTermsForProject`.
- “Controller” EverRest mentions = prompt router in `ai-provider`, not HTTP controller — extend `TranslateOptions.targetLocale`.

### Technical

- Do not duplicate language rows as `fr` + `fr-CA` without clear UX — translators confuse columns.

### UI

- Language setup wizard: “Add regional variant” advanced section — hidden until tenant enables locales feature flag.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Difficulty High | **High** for full split; **Low** for P0-01 locale notes as interim |
