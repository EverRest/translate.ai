# P0-D07 — Multi-model tournament

**Phase:** FIFA/WIZ Deferred · **Importance:** Low · **Difficulty:** Medium · **Status:** Deferred

**Client idea:** #27 · **EverRest:** “Needs RAG otherwise expensive; difficulty low; postponed till next iteration”

## Goal

For high-stakes strings (email subject, legal), run Gemini + GPT-4o + Claude in parallel; reviewer picks winner; system learns preferred model.

## Current state

- Single provider per job ([P2-02](../P2-02-cross-provider-cost-router.md) router backlog)
- No side-by-side variant UI

## Proposed fit

- Job mode `tournament` with 3 provider calls
- Store variants; reviewer selection feeds router weights
- RAG from approved translations as few-shot

## Dependencies

- [P2-02](../P2-02-cross-provider-cost-router.md)
- [P1-01](../P1-01-semantic-translation-memory.md) for RAG

## Acceptance criteria

- [ ] Deferred to next iteration per EverRest

## Notes

3× cost per key — reserve for email/legal content types only.

---

## Agent review

**Verdict:** Agree with EverRest — defer. **Disagree** with “difficulty low” in EverRest comment — parallel 3-provider orchestration + variant UI + learning loop is **Medium–High**, not low.

### Architecture

- Implement under [P2-02](../P2-02-cross-provider-cost-router.md) as job mode — not FIFA-specific.
- RAG few-shot from approved translations requires P1-01 — without RAG, tournament is just expensive A/B with no memory.

### Technical

- Store variants in job item metadata JSON; winner promoted to `Translation.value`.
- Learning “preferred model first” = router weight update — persistent in tenant settings.

### UI

- Review UI: side-by-side 3 columns for high-stakes keys only — do not default for UI labels.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| EverRest “difficulty is low” | Orchestration is straightforward; **product UX + cost governance** make it Medium–High |
