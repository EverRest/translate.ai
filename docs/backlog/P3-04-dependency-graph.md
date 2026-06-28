# P3-04 — Translation dependency graph

**Phase:** 3 · **Priority:** Medium · **Status:** Backlog

## Goal

When product name changes, show affected keys, emails, PDFs, apps — impact analysis.

## Current state

- Flat keys per project; optional `context` text field
- Branching merges translations — no graph model
- No asset types (email, PDF, screenshot) linked

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `translation_key_links` (fromKeyId, toKeyId, relation: uses|contains|derived_from) |
| **Schema** | Optional `localization_assets` (type: email|pdf|page|screenshot, metadata JSON) |
| **Import** | Manual linking UI + future VCS parser hints |
| **Query** | `GetImpactAnalysisQuery` — BFS from changed key |
| **Frontend** | Key detail → "Used by" graph visualization |

## Dependencies

- P1-02 VCS can auto-suggest links from file paths

## Acceptance criteria

- [ ] Change key A shows dependent keys B, C
- [ ] Graph query ≤100ms for 5k keys
- [ ] Unit test BFS traversal

## Overlap with raw.md

Item #5 — Translation Dependency Graph.
