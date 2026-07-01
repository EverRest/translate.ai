# P0-04 — Stale translation detection

**Phase:** P0 · **Slug:** `P0-04-stale-translation-detection-shipped` · **Status:** Shipped (MVP)

> Reference spec — not active backlog. Code pointers: [shipped-baseline](../shipped-baseline.md) · [translation domain](../../domain/translation.md).

## Shipped (MVP)

- [x] `Translation.sourceTextSnapshot` + backfill migration
- [x] Changing `sourceText` on a key (Keys page or import apply) marks non-empty translations `review`
- [x] `isStale` on list translations; `stale-summary` + `stale-key-hints` API
- [x] `onlyStale` on job create; grid stale indicator + filter; overview widget; bulk retranslate stale
- [x] Whitespace normalization — no false-positive on trim-only edits
- [x] Unit + e2e tests

## Deferred

- Slack notify on stale ([P2-06](../P2-06-slack-teams-notifications.md))
- `bulk-import` source upsert invalidation
- Paginated `GET .../translations/stale` list
- `sourceRevision` counter on key
