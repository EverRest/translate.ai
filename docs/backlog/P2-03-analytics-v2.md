# P2-03 — Analytics v2

**Phase:** 2 · **Priority:** Medium · **Status:** Backlog

## Goal

Enterprise dashboard: cache hits, prompt cost, confidence, human edits, glossary misses.

## Current state

- Token usage by user/model/project: `usage-analytics.service`
- Quality summary/logs: `translation-quality.service` (excludes unverified `job_completion` from verified stats)
- Dashboard + Analytics pages with charts
- **Missing:** cache hit rate, per-prompt cost, glossary miss tracking, duplicate counts

## Proposed fit

| Layer | Change |
|-------|--------|
| **Metrics** | Extend `AiUsageLog` or new `TranslationPipelineMetric` events |
| **API** | `/analytics/pipeline/summary`, `/analytics/cache`, `/analytics/edits` |
| **Frontend** | Analytics page tabs: Usage | Quality | Cache | Edits |
| **Prometheus** | Optional counters in `MetricsService` |

### KPIs (from raw.md #19)

- Top languages, expensive keys/files, avg confidence, human edit rate, token usage, glossary misses, cache hits

## Dependencies

- Shipped semantic TM (ADR 0013) for semantic/exact cache split metrics
- P2-01 for per-prompt-version cost

## Acceptance criteria

- [ ] Dashboard shows cache hit % for last 30 days
- [ ] Human edit rate = approvals with editor source / total approved
- [ ] Export CSV for enterprise reports

## Overlap with raw.md

Item #10 (Translation Score dashboards) + #19 (Analytics) — merge quality dimensions into this epic.
