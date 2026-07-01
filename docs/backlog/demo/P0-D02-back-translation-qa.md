# P0-D02 — Back-translation QA

**Phase:** Deferred · **Importance:** Medium · **Difficulty:** High · **Status:** Deferred

**Client idea:** #20 · **EverRest:** “Agree — interesting but expensive”

## Goal

After EN→FR translation, auto back-translate FR→EN and compare to source. Semantic drift (e.g. “Submit Registration” → back “Send Your Data”) flags QA issue without human.

## Current state

- QA chain: placeholders, HTML balance (shipped)
- No back-translation step; would double AI cost per string

## Proposed fit

| Layer | Change |
|-------|--------|
| **Queue** | Optional post-job step `qa.back-translate` for flagged content types (legal, email) |
| **Scoring** | Embedding similarity or LLM judge between source and back-translation |
| **Config** | Per-project enable + contentType allowlist |

## Dependencies

- [P2-02](../P2-02-cross-provider-cost-router.md) cheap model for back-translate
- Cost approval from client

## Acceptance criteria

- [ ] Deferred — revisit when cost model acceptable
- [ ] If enabled: failing back-translate marks translation `needs_review` with reason

## Notes

Consider sampling (10% of keys) instead of 100% for cost control.

---

## Agent review

**Verdict:** Agree with EverRest — defer. Cost doubles minimum; terminology drift ([P2-05](../P2-05-terminology-drift.md) MVP shipped) catches many consistency issues without back-translate.

### Architecture

- If ever built: post-process step on `translation.process` completion, not separate queue — same worker, optional flag on job.
- Prefer **embedding similarity** (cheaper than second full translate) between source and back-translated text — aligns with P1-01 pgvector direction.

### Technical

- Use cheapest model via P2-02 router for back-translate leg only.
- Mark failures as `review` status with `qualityMetrics` entry — reuse existing quality metric table.

### UI

- Show back-translate score in translation detail drawer (Analytics v2) — not grid column by default.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| `needs_review` status in AC | Use `review` enum value |
| 10% sampling in Notes | Make sampling the **default** if built — 100% is not economically viable for client volume |
