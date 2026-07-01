# FIFA / WIZ Client Backlog

Prioritized from [client-ideas-fifa-wiz.md](../demo.md) with EverRest review comments (Jun 2026).

**Goal:** zero-friction adoption for BMA/PMA/SEQ teams (Confluence + Excel today) → AI-assisted localization before runtime API.

---

## Agent review — prioritisation (Jun 2026)

Cross-cutting review against [AGENTS.md](../../../AGENTS.md), existing modules, and CQRS/worker constraints.

### Agree with overall ordering

P0-02 Excel is the next **adoption** priority (Wave 1 complete: P0-01 sport context, P0-S02 placeholder summary, P0-07 consistency UX; P0-03 Confluence import shipped). EverRest’s deferrals (runtime API, multi-model, standalone consistency AI) match platform reality.

### Suggested wave changes (disagree partially with README waves)

| Current wave | Issue | Suggested change |
|--------------|-------|------------------|
| Wave 1: P0-02 Excel | Excel round-trip is **Medium–High** if byte-identical output is required; parsing must run on **backend + queue**, not browser only | **Wave 1 complete** (P0-01, P0-S02, P0-07 shipped); **P0-03 Confluence import shipped** (file + OAuth) |
| Wave 3: P0-05 objects | Client #1 is “must have” but **P3-12 already covers 60% of demo** (tree + translate all) | Demo can show objects in Wave 2; full object-batch AI (single prompt per field) stays Wave 3 |
| Wave 3: P0-10 extension | Marked same wave as debt dashboard but difficulty **High** and needs client DOM cooperation | POC only after P0-03 key naming is stable; consider **export preview page** as interim demo (no extension) |
| P0-11 in P0 list | EverRest: conditional on static bundle model | **Demote to P1** until Wiz confirms import path; do not build snapshots in parallel with P0-02/03 |

### Shared architecture (apply to all import/report tasks)

1. **New bounded context `integration`** (or sub-module under `project`) — parsers for Excel + Confluence HTML share `ImportParser` interface; one ADR `0016-external-import.md` covers P0-02 + P0-03 (do not duplicate ADRs).
2. **All file ingest/export via BullMQ** — never parse 800+ rows or call AI in HTTP handlers ([ADR 0002](../../../adr/0002-bullmq-queues.md)).
3. **Reporting read model** — P0-06 heatmap + P0-09 debt share `project` query handlers or materialized view; avoid three separate SQL aggregations.
4. **Post-job reactions** — P0-07 auto-scan should use `TranslationJobCompletedEvent` handler (same pattern as webhooks), not poll from frontend.
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

**Priority score** = importance first, then lower difficulty wins ties (quick wins early).

---

## P0 — Current version (ordered)

| ID | Feature | Importance | Difficulty | Client # | EverRest note |
|----|---------|------------|------------|----------|---------------|
| [P0-02](./P0-02-excel-delta-import.md) | Excel round-trip + delta import | Critical | Medium | #10, #17 | Planned; zero migration friction |
| [P0-04](./P0-04-stale-translation-detection.md) | Stale translation detection | Critical | Medium | #12 | Must have |
| [P0-05](./P0-05-context-aware-object-translation.md) | Context-aware object translation | Critical | Medium | #1 | Must have; builds on P3-12 |
| [P0-06](./P0-06-translation-coverage-heatmap.md) | Translation coverage heatmap | High | Medium | #6 | Liked from UX perspective |
| [P0-08](./P0-08-translation-inheritance.md) | Translation inheritance between events | High | Medium–High | #13 | Reuse MC26 → WWC27 |
| [P0-09](./P0-09-translation-debt-dashboard.md) | Translation debt dashboard | Medium | Medium | #28 | Good for demo |
| [P0-10](./P0-10-live-browser-injection.md) | Live browser injection (extension) | High | High | #29 | Killer demo feature |
| [P0-11](./P0-11-new-keys-alert.md) | New keys alert (post-release diff) | Medium | Medium | #8 | **Conditional** — demote to Wave 4; see agent review |

### Suggested implementation waves

```text
Wave 1 (demo-ready, ≤2 weeks) — COMPLETE
  P0-01 Sport-domain AI context
  P0-S02 Placeholder summary in job status
  P0-07 Auto-scan after translate job (event handler) + drift UX

Wave 2 (client onboarding, 2–4 weeks)
  P0-02 Excel delta import (Wiz Classic preset)
  P0-04 Stale detection
  P0-06 Coverage heatmap

Wave 3 (differentiation, 4–8 weeks)
  P0-05 Object-batch translation + progress by object
  P0-08 Event inheritance
  P0-09 Debt dashboard
  P0-10 Browser extension POC (or interim preview page)

Wave 4 / conditional
  P0-11 New keys alert — only after Wiz confirms static bundle workflow
```

> **Note:** Revised from original README per agent review — Wave 1 complete (P0-01, P0-S02, P0-07); P0-03 Confluence import shipped; P0-11 demoted.

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

| Client # | Feature | Backlog / code |
|----------|---------|----------------|
| #4 | Consistency check (post-translate) | [shipped-baseline](../shipped-baseline.md), [P0-07](./P0-07-consistency-check.md) Wave 1 — auto drift scan, grid hints, settings toggle; Wave 2 LLM reviewer deferred |
| #5 | Confluence import | [shipped-baseline](../shipped-baseline.md), [P0-03](./P0-03-documentation-import.md) — file import + OAuth live sync |
| #9 | Sport-domain AI context | [shipped-baseline](../shipped-baseline.md), [P0-01](./P0-01-sport-domain-ai-context.md) — `domainProfile`, presets API, copy-settings, FIFA glossary, Domain context UI, post-create onboarding |
| #14 | Glossary / TM | [shipped-baseline](../shipped-baseline.md), [P0-S01](./P0-S01-glossary-platform.md), [P2-05](../P2-05-terminology-drift.md) drift MVP |
| #11 | Placeholder protection | [shipped-baseline](../shipped-baseline.md), [P0-S02](./P0-S02-placeholder-protection.md) — validator + job summary metric |
| #24 | Brand voice training | Glossary + [P2-04](../P2-04-brand-voice.md) brand voice per project |
| #1 (partial) | Object structure | [P3-12](../P3-12-nested-translation.md) localization objects shipped; tone batching = P0-05 |

See [P0-01](./P0-01-sport-domain-ai-context.md) · [P0-03](./P0-03-documentation-import.md) · [P0-07](./P0-07-consistency-check.md) · [P0-S01](./P0-S01-glossary-platform.md) · [P0-S02](./P0-S02-placeholder-protection.md) for acceptance criteria already met.

---

## Mapping to existing roadmap

| FIFA/WIZ | Existing backlog |
|----------|------------------|
| P0-05 Context-aware objects | Extends [P3-12](../P3-12-nested-translation.md) |
| P0-07 Consistency (Wave 1 shipped) | [P0-07](./P0-07-consistency-check.md), [P2-05](../P2-05-terminology-drift.md) + glossary |
| P0-01 Sport context (shipped) | [P0-01](./P0-01-sport-domain-ai-context.md), [P2-04](../P2-04-brand-voice.md) tone versioning later |
| P0-D06 CI/CD | [P3-07](../P3-07-localization-pipeline-as-code.md) |
| P0-D03 Screenshot | [P3-06](../P3-06-screenshot-regression.md) |
| P0-D07 Multi-model | [P2-02](../P2-02-cross-provider-cost-router.md) |

---

## Source

- Raw ideas: [client-ideas-fifa-wiz.md](../demo.md)
- EverRest inline comments (Jun 29–30, 2026)
- Platform baseline: [shipped-baseline.md](../shipped-baseline.md)
- Agent rules: [AGENTS.md](../../../AGENTS.md)
