# Client demo backlog

Prioritized from [demo.md](../demo.md) with EverRest review comments (Jun 2026).

**Goal:** zero-friction adoption for product teams (Confluence + Excel today) → AI-assisted localization before runtime API.

---

## Agent review — prioritisation (Jun 2026)

Cross-cutting review against [AGENTS.md](../../../AGENTS.md), existing modules, and CQRS/worker constraints.

### Agree with overall ordering

Wave 1 complete (P0-01 sport context, P0-S02 placeholder summary, P0-07 consistency UX; P0-03 Confluence import shipped). **P0-02 Excel round-trip shipped (MVP).** **P0-04 stale detection shipped (MVP).** Wave 2 adoption focus: P0-06 coverage heatmap. EverRest’s deferrals (runtime API, multi-model, standalone consistency AI) match platform reality.

### Suggested wave changes (disagree partially with README waves)

| Current wave | Issue | Suggested change |
|--------------|-------|------------------|
| Wave 1: P0-02 Excel | Excel round-trip is **Medium–High** if byte-identical output is required; parsing must run on **backend + queue**, not browser only | **Shipped (MVP)** — Classic import preset, delta fill, compose download; see [shipped-baseline](../shipped-baseline.md) (P0-02) |
| Wave 3: P0-05 objects | Client #1 is “must have” but **P3-12 already covers 60% of demo** (tree + translate all) | Demo can show objects in Wave 2; full object-batch AI (single prompt per field) stays Wave 3 |
| Wave 3: P0-10 extension | Marked same wave as debt dashboard but difficulty **High** and needs client DOM cooperation | POC only after P0-03 key naming is stable; consider **export preview page** as interim demo (no extension) |
| P0-11 in P0 list | EverRest: conditional on static bundle model | **Demote to P1** until Client confirms import path; do not build snapshots in parallel with P0-02/03 |

### Shared architecture (apply to all import/report tasks)

1. **New bounded context `integration`** (or sub-module under `project`) — parsers for Excel + Confluence HTML share `ImportParser` interface; one ADR `0016-external-import.md` covers P0-02 + P0-03 (do not duplicate ADRs).
2. **All file ingest/export via BullMQ** — never parse 800+ rows or call AI in HTTP handlers ([ADR 0002](../../../adr/0002-bullmq-queues.md)).
3. **Reporting read model** — P0-06 heatmap + P0-09 debt share `project` query handlers or materialized view; avoid three separate SQL aggregations.
4. **Post-job reactions** — shipped: P0-07 auto-scan via `TerminologyScanOnJobCompletedHandler` on `TranslationJobCompletedEvent` (same pattern as webhooks).
5. **Status enum** — use existing `TranslationStatus.review`, not a new `needs_review` / `stale` enum unless product insists (see P0-04 review).

Each task file below has per-feature **Agent review** (architecture · technical · UI).

---

## How to read

Each file follows the standard backlog template: **Goal**, **Current state**, **Proposed fit**, **Dependencies**, **Acceptance criteria**.

| Field | Meaning |
|-------|---------|
| **Importance** | Client / demo impact (Critical → Low) |
| **Difficulty** | Engineering effort (Low → High) |
| **Status** | Backlog · Partial · Shipped · Deferred |
| **Slug** | Active tasks: `P0-XX-feature-name.md` · Shipped reference: `P0-XX-feature-name-shipped.md` |

**Priority score** = importance first, then lower difficulty wins ties (quick wins early).

---

## P0 — Current version (ordered)

| ID | Feature | Importance | Difficulty | Client # | EverRest note |
|----|---------|------------|------------|----------|---------------|
| [P0-05](./P0-05-context-aware-object-translation.md) | Context-aware object translation | Critical | Medium | #1 | Must have; builds on P3-12 |
| [P0-06](./P0-06-translation-coverage-heatmap.md) | Translation coverage heatmap | High | Medium | #6 | Liked from UX perspective |
| [P0-08](./P0-08-translation-inheritance.md) | Translation inheritance between events | High | Medium–High | #13 | Reuse MC26 → WWC27 |
| [P0-09](./P0-09-translation-debt-dashboard.md) | Translation debt dashboard | Medium | Medium | #28 | Good for demo |
| [P0-10](./P0-10-live-browser-injection.md) | Live browser injection (extension) | High | High | #29 | Killer demo feature |
| [P0-11](./P0-11-new-keys-alert.md) | New keys alert (post-release diff) | Medium | Medium | #8 | **Conditional** — demote to Wave 4; see agent review |

### Suggested implementation waves

```text
Wave 1 (demo-ready) — COMPLETE — see Already shipped section below
 P0-01 Sport-domain AI context (shipped)
 P0-S02 Placeholder summary in job status (shipped)
 P0-07 Auto-scan after translate job + drift UX (shipped)
 P0-03 Confluence import file + OAuth (shipped)

Wave 2 (client onboarding, 2–4 weeks) — NEXT
 P0-06 Coverage heatmap

Wave 3 (differentiation, 4–8 weeks)
 P0-05 Object-batch translation + progress by object
 P0-08 Event inheritance
 P0-09 Debt dashboard
 P0-10 Browser extension POC (or interim preview page)

Wave 4 / conditional
 P0-11 New keys alert — only after Client confirms static bundle workflow
```

> **Note:** Revised from original README per agent review — Wave 1 complete (P0-01, P0-S02, P0-07, P0-03); P0-02 Excel shipped (MVP); P0-04 stale detection shipped (MVP); P0-11 demoted.

---

## Deferred — not in current version

Postponed by product review or blocked on external architecture.

| ID | Feature | Importance | Difficulty | Client # | Reason deferred |
|----|---------|------------|------------|----------|-----------------|
| [P0-D01](./P0-D01-runtime-translation-api.md) | Runtime translation API | High | High | #19 | Needs horizontal scaling; architecture change |
| [P0-D02](./P0-D02-back-translation-qa.md) | Back-translation QA | Medium | High | #20 | Expensive (2× AI cost) |
| [P0-D03](./P0-D03-visual-context-screenshot.md) | Visual context (screenshot) | Medium | High | #21 | Future; complex cases only |
| [P0-D04](./P0-D04-character-limit-enforcement.md) | Character limit enforcement | Medium | Medium | #22 | Future; mobile labels |
| [P0-D05](./P0-D05-locale-split.md) | Locale split (FR-FR vs FR-CA) | Medium | High | #25 | Extra models + routing controller |
| [P0-D06](./P0-D06-cicd-pipeline-integration.md) | CI/CD pipeline integration | Medium | High | #26 | Not for MVP; see P3-07 |
| [P0-D07](./P0-D07-multi-model-tournament.md) | Multi-model tournament | Low | Medium | #27 | Needs RAG; expensive; next iteration |
| [P0-D08](./P0-D08-external-reviewer-link.md) | External reviewer link | Medium | Medium | #15 | Future |
| [P0-D09](./P0-D09-ai-confidence-auto-approve.md) | AI confidence + auto-approve | Medium | Medium | #16 | Future |

---

## Already shipped / covered (no new P0 work)

See [shipped-baseline.md](../shipped-baseline.md) for code pointers. Full specs live under **`docs/backlog/demo/*-shipped.md`** (reference only — not active backlog).

### Shipped tasks (reference)

| ID | Spec | Client # |
|----|------|----------|
| [P0-01](./P0-01-sport-domain-ai-context-shipped.md) | Sport-domain AI context | #9 |
| [P0-02](./P0-02-excel-delta-import-shipped.md) | Excel round-trip + delta import | #10, #17 |
| [P0-03](./P0-03-documentation-import-shipped.md) | Confluence file import + OAuth live sync | #5 |
| [P0-03b](./P0-03b-confluence-hardening-shipped.md) | Confluence hardening (site picker, scheduled sync, BYO OAuth) | #5 |
| [P0-04](./P0-04-stale-translation-detection-shipped.md) | Stale translation detection | #12 |
| [P0-07](./P0-07-consistency-check-shipped.md) | Consistency check Wave 1 (auto drift scan) | #4 |
| [P0-S01](./P0-S01-glossary-platform-shipped.md) | Glossary / TM platform | #14 |
| [P0-S02](./P0-S02-placeholder-protection-shipped.md) | Placeholder protection + job summary | #11 |

### Client idea index

| Client # | Feature | Notes |
|----------|---------|-------|
| #4 | Consistency check (post-translate) | [P0-07](./P0-07-consistency-check-shipped.md) Wave 1 — auto drift scan, grid hints, settings toggle; Wave 2 LLM reviewer deferred |
| #10, #17 | Excel round-trip + delta import | [P0-02](./P0-02-excel-delta-import-shipped.md) — Classic import preset, empty-cell fill, same-layout download |
| #12 | Stale translation detection | [P0-04](./P0-04-stale-translation-detection-shipped.md) — snapshot staleness, grid/overview UX, `onlyStale` jobs |
| #5 | Confluence import | [P0-03](./P0-03-documentation-import-shipped.md) + [P0-03b](./P0-03b-confluence-hardening-shipped.md) |
| #9 | Sport-domain AI context | [P0-01](./P0-01-sport-domain-ai-context-shipped.md) |
| #14 | Glossary / TM | [P0-S01](./P0-S01-glossary-platform-shipped.md) + [P2-05](../P2-05-terminology-drift.md) drift MVP |
| #11 | Placeholder protection | [P0-S02](./P0-S02-placeholder-protection-shipped.md) |
| #24 | Brand voice training | Glossary + [P2-04](../P2-04-brand-voice.md) brand voice per project |
| #1 (partial) | Object structure | [P3-12](../P3-12-nested-translation.md) localization objects shipped; tone batching = [P0-05](./P0-05-context-aware-object-translation.md) |

---

## Mapping to existing roadmap

| client | Existing backlog |
|----------|------------------|
| P0-05 Context-aware objects | Extends [P3-12](../P3-12-nested-translation.md) |
| P0-07 Consistency (Wave 1 shipped) | [P0-07-shipped](./P0-07-consistency-check-shipped.md), [P2-05](../P2-05-terminology-drift.md) + glossary |
| P0-01 Sport context (shipped) | [P0-01-shipped](./P0-01-sport-domain-ai-context-shipped.md), [P2-04](../P2-04-brand-voice.md) tone versioning later |
| P0-D06 CI/CD | [P3-07](../P3-07-localization-pipeline-as-code.md) |
| P0-D03 Screenshot | [P3-06](../P3-06-screenshot-regression.md) |
| P0-D07 Multi-model | [P2-02](../P2-02-cross-provider-cost-router.md) |

---

## Source

- Raw ideas: [demo.md](../demo.md)
- EverRest inline comments (Jun 29–30, 2026)
- Platform baseline: [shipped-baseline.md](../shipped-baseline.md)
- Agent rules: [AGENTS.md](../../../AGENTS.md)
