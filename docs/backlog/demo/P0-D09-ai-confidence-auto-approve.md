# P0-D09 — AI confidence + auto-approve

**Phase:** Deferred · **Importance:** Medium · **Difficulty:** Medium · **Status:** Deferred

**Client idea:** #16 · **EverRest:** Future

## Goal

Per translation confidence score (e.g. “Cancel” → “Annuler” 99%) — auto-approve above project threshold; legal text at 61% → human review.

## Current state

- [P2-03](../P2-03-analytics-v2.md) plans confidence metrics in analytics v2
- No provider confidence exposed consistently; statuses set manually or on job default

## Proposed fit

- Store `confidence` on translation from provider logprobs or LLM self-score
- Project setting `autoApproveThreshold` per contentType
- Job post-process promotes status when above threshold

## Dependencies

- Provider adapter support for confidence
- [P2-03](../P2-03-analytics-v2.md)

## Acceptance criteria

- [ ] Deferred
- [ ] When resumed: UI shows confidence; auto-approve configurable per project

## Notes

Useful for high-volume UI strings after Domain glossary stabilizes terminology.

---

## Agent review

**Verdict:** Agree — defer until glossary + drift stable; auto-approve without terminology enforcement risks publishing inconsistent Glossary terms.

### Architecture

- Implement as part of [P2-03](../P2-03-analytics-v2.md) — confidence from `TranslationQualityMetric` or provider logprobs where available.
- Auto-approve must **never** bypass `PlaceholderValidator` failures or open terminology drift issues — gate logic in job post-processor.

### Technical

- Ollama/local models may not expose logprobs — fallback to heuristic score or skip auto-approve for those providers.

### UI

- Confidence badge in translation detail + bulk filter “low confidence” — grid column optional.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Auto-approve for simple UI strings | Only safe after P0-07 auto-scan (shipped) + glossary preset applied — order dependency |
