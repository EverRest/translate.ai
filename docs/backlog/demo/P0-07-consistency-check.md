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
