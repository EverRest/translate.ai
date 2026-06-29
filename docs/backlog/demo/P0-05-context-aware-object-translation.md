# P0-05 — Context-aware object translation

**Phase:** FIFA/WIZ P0 · **Importance:** Critical · **Difficulty:** Medium · **Status:** Partial

**Client idea:** #1 · **EverRest:** Must have

## Goal

AI treats a **field** (or localization object) as one unit: Label + Placeholder + Error message translated in **unified tone**, not as unrelated dictionary entries. User selects 50 fields → **Translate All** → progress bar tracks **objects**, not individual keys.

**Demo hook:** same form field — dictionary mode vs object-batch mode visible on screen.

## Current state

- [P3-12](../P3-12-nested-translation.md) **shipped:** `LocalizationObject`, tree editor, materialize, `POST .../objects/:id/translate`
- Object translate creates standard translation job for all materialized keys — **same prompt per key**, no cross-node context bundle
- Job progress UI is key-based, not object-based
- No multi-object batch (“translate 50 selected fields”)

## Proposed fit

| Layer | Change |
|-------|--------|
| **AI** | New job mode `object-batch`: one prompt includes all sibling leaves under a node (label, placeholder, error) with structure JSON |
| **Queue** | `localization-object.translate-batch` — chunk by object/node; one AI call per field group |
| **Schema** | Optional `TranslationJob.metadata.objectIds[]`, progress `{ objectsDone, objectsTotal }` |
| **API** | `POST /projects/:id/objects/translate-batch` body `{ objectIds[], languages[] }` |
| **Frontend** | Objects list: multi-select + Translate All; progress bar “12 / 50 fields”; link to key grid optional |
| **Prompt** | “Translate the following form field copy as one coherent UI element; keep tone consistent across label, placeholder, and error.” |

## Dependencies

- P3-12 localization objects (shipped)
- [P0-01](./P0-01-sport-domain-ai-context.md) for domain tone
- [P0-07](./P0-07-consistency-check.md) post-batch scan recommended

## Acceptance criteria

- [ ] Translate all leaves under one field node in a **single AI request** (or structured multi-turn with shared context)
- [ ] Multi-select  N objects → one job with object-level progress events (SSE/WebSocket or poll)
- [ ] UI progress: “Field 12 of 50”, not “Key 847 of 2100”
- [ ] QA validators still run per output string (placeholders, HTML)
- [ ] E2e: object with label+placeholder+error → three keys, one batch call (mock provider)

## Notes

Structural authoring is done (P3-12). This item is **AI batching + UX** — the visible “must have” difference for FIFA demo.
