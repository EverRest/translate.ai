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
