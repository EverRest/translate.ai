# P2-05 — Terminology drift detection

**Phase:** 2 · **Priority:** Medium · **Status:** MVP shipped

> MVP moved out of active backlog — see [shipped-baseline](./shipped-baseline.md). Full P2-05 scope (scheduled scan, LLM synonyms, token-in-string drift) remains deferred below.

## Goal

Detect inconsistent translations for the same source term over time (e.g. Customer → Клієнт vs Замовник).

## Current state

- Glossary enforces **explicit** terms at translate time
- **Terminology drift scan** detects cross-key inconsistencies; resolve → upsert glossary
- Manual scan via `POST .../terminology/scan`; auto-scan after jobs when `autoTerminologyScan` enabled (P0-07)

## Shipped (MVP)

| Layer | Change |
|-------|--------|
| **Queue** | On-demand `terminology.scan` (BullMQ) |
| **Service** | `TerminologyDriftService` — identical source text across keys, variant comparison per language |
| **Schema** | `terminology_drift_issues` |
| **Frontend** | Glossary → Terminology drift tab; resolve → glossary upsert; nav badge |
| **Tests** | `terminology-drift.utils.spec.ts`, handler specs |

## Deferred (full P2-05)

- Scheduled weekly scan
- LLM synonym classification
- Shared clustering with P3-03 duplicate finder
- Token-in-long-string drift (reduces false positives)

## Acceptance criteria

- [x] Scan finds ≥2 variants for same EN term in UA with suggestion
- [x] User promotes variant to glossary preferred term
- [x] Unit tests with fixture corpus

## Overlap with raw.md

Item #12 — Terminology drift.
