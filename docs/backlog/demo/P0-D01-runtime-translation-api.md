# P0-D01 — Runtime translation API

**Phase:** FIFA/WIZ Deferred · **Importance:** High · **Difficulty:** High · **Status:** Deferred

**Client idea:** #19 · **EverRest:** “Needs horizontal scaling; for now postponed”

## Goal

Evo Core calls translate.ai API at runtime instead of export/import bundles. Change translation → live on prod within ~30 seconds.

## Current state

- REST API exists for CRUD keys/translations and jobs — not optimized as low-latency read CDN
- No edge cache, no tenant-scoped public read tokens for app runtimes
- Client architecture today is file-based (Excel / Confluence)

## Proposed fit

| Layer | Change |
|-------|--------|
| **API** | High-read `GET /v1/runtime/:projectId/:locale/bundle` with ETag + CDN |
| **Infra** | Horizontal scaling, Redis cache, cache invalidation on publish |
| **Auth** | Service API keys per environment; rate limits |
| **SDK** | Thin client for Evo Core (JS/Java) |
| **Publish** | Explicit publish step: draft vs live separation |

## Dependencies

- [P0-04](./P0-04-stale-translation-detection.md) publish workflow
- Platform ops: scaling runbook

## Acceptance criteria

- [ ] Documented deferral rationale and prerequisites in ADR
- [ ] When resumed: p99 read < 100ms at 1k RPS with cache warm
- [ ] Invalidation within 30s of publish

## Notes

Architectural shift for client — not MVP. Extension preview ([P0-10](./P0-10-live-browser-injection.md)) validates value before this investment.
