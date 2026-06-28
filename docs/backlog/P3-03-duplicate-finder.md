# P3-03 — Semantic duplicate finder

**Phase:** 3 · **Priority:** Medium · **Status:** Backlog

## Goal

Find duplicate/near-duplicate keys ("Login", "Log in", "Sign In") — consolidate maintenance.

## Current state

- Keys unique by `projectId + key` string only
- No clustering of `sourceText` values

## Proposed fit

| Layer | Change |
|-------|--------|
| **Queue** | `translation.analyze_duplicates` on-demand |
| **Service** | Cluster by normalized + embedding similarity |
| **API** | `GET /projects/:id/duplicates` |
| **Frontend** | Keys page → "Find duplicates" panel; merge/suggest canonical key |
| **Optional** | Merge command updates references (hard — needs key alias table) |

## Dependencies

- Shipped semantic TM (ADR 0012) embeddings
- Shares clustering with P2-05 terminology drift

## Acceptance criteria

- [ ] Report lists clusters with ≥3 similar strings
- [ ] Export CSV for content team
- [ ] No auto-merge without explicit user action

## Overlap with raw.md

Item #6 — Semantic Duplicate Finder.
