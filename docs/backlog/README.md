# Backlog — LocalizationOps roadmap

Product direction: from **AI translator** → **localization pipeline platform** (see [raw.md](./raw.md) vision).

**Baseline already in production:** [shipped-baseline.md](./shipped-baseline.md)  
**FIFA / WIZ client track:** [fifa-wiz/](demo/README.md) (P0-01 … P0-D09)  
**Agent rules:** [../AGENTS.md](../AGENTS.md)

---

## How to read tasks

Each file includes:

- **Goal** — business outcome
- **Current state** — what exists in translate.ai today
- **Proposed fit** — modules, schema, queues (NestJS + BullMQ + Prisma)
- **Dependencies** — order constraints
- **Acceptance criteria** — definition of done

Implement with **TDD**, **CQRS**, **ADR** for new cross-cutting patterns.

---

## Phase 1 — B2B MVP extensions (1–2 months)

Goal: paying teams — VCS sync, stronger QA, semantic memory, export UX.

| ID | Task | Priority |
|----|------|----------|
| [P1-01](./P1-01-semantic-translation-memory.md) | Semantic TM (pgvector) + cache metrics | High |
| [P1-02](./P1-02-github-gitlab-integration.md) | GitHub / GitLab key sync + webhooks | High |
| [P1-06](./P1-06-translation-pull-request.md) | PR workflow with translations | High |

---

## Phase 2 — Team platform (2–4 months)

Goal: cost control, brand consistency, observability, integrations.

| ID | Task | Priority |
|----|------|----------|
| [P2-01](./P2-01-prompt-versioning.md) | Prompt versioning, rollback, A/B | High |
| [P2-02](./P2-02-cross-provider-cost-router.md) | Cross-provider cost/quality router | High |
| [P2-03](./P2-03-analytics-v2.md) | Analytics v2 (cache, prompts, confidence) | Medium |
| [P2-04](./P2-04-brand-voice.md) | Brand voice / tone per project | Medium |
| [P2-05](./P2-05-terminology-drift.md) | Terminology drift detection | Medium — **MVP shipped** |
| [P2-06](./P2-06-slack-teams-notifications.md) | Slack / Teams / Discord alerts | Low |
| [P2-07](./P2-07-ai-pr-review.md) | Post-job PR review (links, code blocks) | Medium |

---

## Phase 3 — Enterprise moat (4+ months)

Goal: hard-to-replace infrastructure — replay, duplicates, CI pipeline, marketplace.

| ID | Task | Priority |
|----|------|----------|
| [P3-01](./P3-01-translation-replay-engine.md) | Translation replay engine | High |
| [P3-02](./P3-02-semantic-diff-reuse.md) | Semantic diff — skip re-translate | High |
| [P3-03](./P3-03-duplicate-finder.md) | Semantic duplicate finder | Medium |
| [P3-04](./P3-04-dependency-graph.md) | Translation dependency graph | Medium |
| [P3-05](./P3-05-domain-detection.md) | Domain detection (medical, legal, …) | Low |
| [P3-06](./P3-06-screenshot-regression.md) | Screenshot / UI overflow regression | Medium |
| [P3-07](./P3-07-localization-pipeline-as-code.md) | Localization CI/CD + pipeline DSL | High |
| [P3-08](./P3-08-simulator-advisor.md) | Cost simulator + localization advisor | Medium |
| [P3-09](./P3-09-feature-flag-localization.md) | Feature-flag–gated localization | Low |
| [P3-10](./P3-10-shared-cache-premium.md) | Tenant-shared anonymous TM (premium) | Low |
| [P3-11](./P3-11-ai-marketplace.md) | Plugin marketplace (validators, providers) | Low |
| [P3-12](./P3-12-nested-translation.md) | Localization objects (nested forms/pages → flat keys) | High |

---

## Dependency graph (simplified)

```text
Shipped QA validators (ADR 0008) ──► P2-07 (PR review)
P1-01 (pgvector) ──► P3-02 (semantic diff) ──► P3-03 (duplicates)
P2-01 (prompt versioning) ──► P3-01 (replay)
P2-02 (cost router) ──► P3-08 (simulator)
P1-02 (VCS) ──► P1-06 (PR) ──► P3-07 (pipeline as code)
P3-12 (localization objects) ──► P3-04 (dependency graph) · P3-07 (pipeline)
```

---

## Source

Ideas extracted from [raw.md](./raw.md) (LocalizationOps vision). Completed infra work removed from task list — see [shipped-baseline.md](./shipped-baseline.md).
