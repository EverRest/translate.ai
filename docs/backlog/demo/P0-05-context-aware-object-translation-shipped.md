# P0-05 — Context-aware object translation

**Phase:** P0 · **Importance:** Critical · **Difficulty:** Medium · **Status:** Shipped (MVP)

**Slug:** `P0-05-context-aware-object-translation-shipped` · Reference spec — not active backlog.

**Client idea:** #1 · **EverRest:** Must have

## Goal

AI treats a **field** (localization object node) as one unit: label + placeholder + error translated in **unified tone**, not as unrelated dictionary entries. User selects N fields → **Translate selected** → progress tracks **objects**, not individual keys.

## Shipped (MVP)

- [x] Translate all leaves under one field node in a **single AI request** (JSON batch prompt per field group × language)
- [x] Multi-select N objects → one `object_batch` job; object-level progress via `GET /jobs/:id` (`objectProgress`)
- [x] UI progress: **Field X of Y** on job detail; Entities list multi-select + **Translate selected (N fields)**
- [x] QA validators run per output string (placeholders, HTML)
- [x] E2e: field with label + placeholder + error → three keys, one batch call (mock provider)
- [x] `POST .../objects/translate-batch`; single-object `POST .../objects/:id/translate` uses same pipeline
- [x] Extended `translation.process` with `batchGroupId` (no separate queue)

## Deferred

- Dictionary vs field-mode demo toggle (side-by-side quality comparison)
- SSE `objectProgress` on job stream (polling sufficient for MVP)
- Reference-chaining fallback if JSON batch fails on small/Ollama models
- Progress modal with per-field substatus (expandable failed fields + retry)
- Field-level translation memory behavior (document when added)

## Code pointers

- `backend/src/localization-object/domain/group-field-batches.utils.ts`
- `backend/src/localization-object/application/services/object-batch-translation.service.ts`
- `backend/src/ai-provider/infrastructure/object-batch-prompt.builder.ts`
- `backend/src/translation/application/services/translation-job-runner.service.ts` — `processObjectBatchItem`
- `backend/src/translation/application/utils/object-batch-progress.utils.ts`
- `backend/src/localization-object/presentation/localization-objects.controller.ts` — `translate-batch`
- `frontend/src/features/localization-objects/pages/ProjectObjectsPage.tsx`
- `frontend/src/features/translation-jobs/pages/JobDetailPage.tsx`

## Dependencies (shipped)

- [P3-12](../../P3-12-nested-translation.md) localization objects
- [P0-01-shipped](./P0-01-sport-domain-ai-context-shipped.md) domain tone in prompts
- [P0-07-shipped](./P0-07-consistency-check-shipped.md) post-batch terminology scan
