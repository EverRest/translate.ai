# P0-01 — Sport-domain AI context

**Phase:** P0 · **Importance:** Critical · **Difficulty:** Low · **Status:** Shipped

**Slug:** `P0-01-sport-domain-ai-context-shipped` · Reference spec — not active backlog.

> See [shipped-baseline](../shipped-baseline.md) and [demo/README](./README.md#shipped-tasks-reference).

**Client idea:** #9 · **EverRest:** “Easy win; will be done”

## Goal

AI translations use sports domain context — formal accreditation tone, official terminology for FR/ES, and consistent sports vocabulary across events (MC26 → WWC27).

**Demo hook:** Apply Sport accreditation preset → translate → glossary + domain block steer “Accreditation”, “Venue”, “Privilege” consistently.

## Shipped

| Layer | Change |
|-------|--------|
| **Schema** | Optional `Project.domainProfile` JSON (`domain`, `event`, `tone`, `audience`, `notes`, `localeNotes`) |
| **API** | `GET /projects/:id/domain-presets` — `fifa_accreditation`, `fifa_venue_ops` seed profiles |
| **API** | `PATCH /projects/:id` accepts `domainProfile`; `POST .../copy-settings` copies `domainProfile` and/or glossary from another tenant project |
| **API** | `GET/POST .../glossary/presets` — list and apply `fifa_accreditation` preset (24 terms) |
| **Prompts** | `buildTranslationPrompts` injects domain block before glossary rules; per-job `localeNotes` for target language |
| **UI** | Settings → **Domain context** — preset picker, structured fields, prompt preview, apply Domain glossary CTA |
| **UI** | Post-create **onboarding modal** on Projects — Domain preset (+ glossary checkbox), copy from project, or skip |

## Code locations

| Area | Path |
|------|------|
| Domain presets | `backend/src/shared/domain/domain-presets.ts` |
| DTO + controller | `backend/src/project/presentation/dto/domain-profile.dto.ts`, `projects.controller.ts` |
| Handlers | `domain-presets.handler.ts`, `copy-project-settings.handler.ts`, `update-project.handler.ts` |
| Prompt injection | `backend/src/ai-provider/infrastructure/prompt.builder.ts` |
| Domain glossary preset | `backend/src/glossary/domain/glossary-presets.ts` |
| Domain context UI | `frontend/src/features/project-settings/components/DomainContextPanel.tsx` |
| Onboarding | `frontend/src/features/projects/components/ProjectOnboardingModal.tsx` |

## Dependencies

- Glossary platform ([P0-S01](./P0-S01-glossary-platform-shipped.md)) — preset apply reuses glossary upsert
- Consistency workflow ([P0-07](./P0-07-consistency-check-shipped.md)) — glossary preset → translate → auto drift scan

## Acceptance criteria

- [x] Project stores structured domain profile (domain, event, tone, audience, notes, localeNotes)
- [x] accreditation and venue ops presets available via API
- [x] Domain block included in AI translation prompts
- [x] Settings UI to edit domain context with prompt preview
- [x] Post-create onboarding offers Domain preset, copy-settings, or skip
- [x] `copy-settings` copies domain profile and/or glossary from another project
- [x] Domain glossary preset (`fifa_accreditation`, 24 terms) list + apply

## Deferred

- Full brand voice versioning → [P2-04](../P2-04-brand-voice.md)
- BCP-47 locale split (FR-FR vs FR-CA) → [P0-D05](./P0-D05-locale-split.md); interim: `localeNotes` per language

## Notes

`localeNotes.fr` / `localeNotes.es` in domain profile cover MC26 demo for FR/ES without full locale-split routing.

## Agent review

**Verdict:** Shipped — correct architecture (domain block in prompt + glossary preset, not a separate AI product).

### Workflow order

glossary preset (this task) → translate → auto drift scan ([P0-07](./P0-07-consistency-check-shipped.md)) → resolve in Glossary Drift tab ([P2-05](../P2-05-terminology-drift.md) MVP).
