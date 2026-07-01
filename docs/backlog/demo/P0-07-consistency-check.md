# P0-07 — Consistency check (post-translate)

**Phase:** FIFA/WIZ P0 · **Importance:** High · **Difficulty:** Low–Medium · **Status:** Wave 1 shipped

> Wave 1 moved out of active backlog — see [shipped-baseline](../shipped-baseline.md) and [demo/README](./README.md#already-shipped--covered-no-new-p0-work). Wave 2 (LLM consistency reviewer) deferred below.

**Client idea:** #4 · **EverRest:** Postponed as standalone feature — “resolve with glossaries + post-validation by another model”

## Goal

After translation, ensure the same English term maps to one target everywhere (e.g. “Submit” → always “Envoyer”, never “Soumettre” in one field).

## Current state

- **Glossary** enforces explicit terms at translate time (shipped)
- **P2-05 terminology drift** MVP shipped: scan, resolve, drift tab
- **Wave 1:** auto-scan after job, grid hints, settings toggle, post-job toast
- No LLM “another model” validator yet (Wave 2 deferred)

## Shipped (Wave 1)

| Layer | Change |
|-------|--------|
| **Setting** | `Project.autoTerminologyScan` default `true`; Settings → Consistency |
| **Event** | `TerminologyScanOnJobCompletedHandler` on `TranslationJobCompletedEvent` |
| **UI** | Post-job toast with issue count; translations grid drift icon; Glossary badge |

## Deferred (Wave 2)

- LLM consistency reviewer behind feature flag
- `terminologyScanJobId` on job status response
- `includeTerminologyIssues` on translations list API (replaced by `key-hints` endpoint for MVP)
- 5-minute scan debounce delay (jobId dedup only for now)

## Dependencies

- P2-05 terminology drift (MVP shipped)
- Glossary platform (shipped)

## Acceptance criteria

- [x] Project toggle: auto-scan after job success
- [x] Open drift issues visible from Translations page without manual navigation
- [x] Documented workflow: glossary first → drift scan → resolve (replaces standalone “consistency AI”)
- [ ] Optional: LLM spot-check behind feature flag (defer if cost concern)

## Notes

EverRest explicitly deferred a dedicated consistency AI in favor of glossary + validation. This P0 item tracks **UX completion** of that strategy, not a new AI product surface.

## Agent review

**Verdict:** Strongly agree with EverRest — **do not build standalone “consistency AI”** for FIFA. Glossary + drift scan is the correct architecture.

### Architecture

- Wave 1: **`TerminologyScanOnJobCompletedHandler`** listening to `TranslationJobCompletedEvent` (same bus as `TranslationJobCompletedWebhookHandler`).
- Project setting: `autoTerminologyScan: boolean` default `true`.
- Wave 2 LLM reviewer: **defer** unless drift scan false-negative rate is measured.

### Workflow order

glossary preset (P0-01) → translate → auto drift scan → resolve in Glossary Drift tab.
