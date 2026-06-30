# P0-07 — Consistency check (post-translate)

**Phase:** FIFA/WIZ P0 · **Importance:** High · **Difficulty:** Low–Medium · **Status:** Partial

**Client idea:** #4 · **EverRest:** Postponed as standalone feature — “resolve with glossaries + post-validation by another model”

## Goal

After translation, ensure the same English term maps to one target everywhere (e.g. “Submit” → always “Envoyer”, never “Soumettre” in one field).

## Current state

- **Glossary** enforces explicit terms at translate time (shipped)
- **P2-05 terminology drift** shipped: scan detects inconsistent variants; resolve → upsert glossary + optional re-translate
- Drift scan is **manual** (`POST .../terminology/scan`); badge hidden until scan runs
- No automatic post-job consistency pass; no LLM “another model” validator yet

## Proposed fit

| Layer | Change |
|-------|--------|
| **Wave 1** | Auto-enqueue `terminology.scan` after translation job completes (project setting) |
| **Wave 1** | Translations grid: inline hint when open drift issues touch visible keys |
| **Wave 2** | Optional LLM consistency reviewer: sample high-frequency source terms, flag variant translations |
| **Glossary** | Promote FIFA preset terms proactively ([P0-01](./P0-01-sport-domain-ai-context.md)) |
| **Frontend** | Post-job toast: “3 terminology issues found” → link to Glossary Drift tab |

## Dependencies

- P2-05 terminology drift (shipped)
- Glossary platform (shipped)

## Acceptance criteria

- [ ] Project toggle: auto-scan after job success
- [ ] Open drift issues visible from Translations page without manual navigation
- [ ] Documented workflow: glossary first → drift scan → resolve (replaces standalone “consistency AI”)
- [ ] Optional: LLM spot-check behind feature flag (defer if cost concern)

## Notes

EverRest explicitly deferred a dedicated consistency AI in favor of glossary + validation. This P0 item tracks **UX completion** of that strategy, not a new AI product surface.

---

## Agent review

**Verdict:** Strongly agree with EverRest — **do not build standalone “consistency AI”** for FIFA. Glossary + drift scan is the correct architecture.

### Architecture

- Wave 1 only: **`TerminologyScanOnJobCompletedHandler`** listening to `TranslationJobCompletedEvent` (same bus as `TranslationJobCompletedWebhookHandler`).
- Project setting: `autoTerminologyScan: boolean` default `true` for new FIFA template projects.
- Wave 2 LLM reviewer: **defer** unless drift scan false-negative rate is measured — second model doubles cost and overlaps P2-05 algorithmic detection.
- Workflow order: glossary preset (P0-01) → translate → auto drift scan → resolve in Glossary Drift tab.

### Technical

- Enqueue existing `terminology.scan` queue — no new worker processor logic.
- Debounce: if multiple jobs complete within 5 min, coalesce to one scan per project (BullMQ jobId dedup).
- API: extend job status response with `terminologyScanJobId` link when complete.
- Translations list API: optional `includeTerminologyIssues: true` batch-fetch open issues for visible keys (avoid N+1).

### UI

- Post-job toast: **“Translation complete — 3 terminology issues”** → link to `?tab=drift`.
- Translations grid: reuse `TerminologyDriftBadge` pattern — show per-row icon when key appears in open issues (requires scan first — make auto-scan default so demo always works).
- Remove manual “Scan” as required step from demo script once auto-scan ships.
- Do **not** add new “Consistency” top-level feature — stays under Glossary.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Wave 2 “LLM consistency reviewer” | Disagree for FIFA MVP — glossary + drift + FIFA preset terms should cover 90%; measure before building |
| Difficulty Low–Medium | Wave 1 (event + toast + grid hints) is **Low**; Wave 2 LLM is Medium–High |
