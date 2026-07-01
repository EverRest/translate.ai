# P3-10 — Shared cache (premium)

**Phase:** 3 · **Priority:** Low · **Status:** Backlog

## Goal

Anonymous cross-tenant TM — new customer gets instant translations for common strings ("Privacy Policy") — **Save 70% AI costs** tier.

## Current state

- TM scoped by `tenantId` — full isolation (ADR 0004)
- Exact hash only

## Proposed fit

| Layer | Change |
|-------|--------|
| **Schema** | `global_translation_memory` — no tenant source text stored raw; hash + anonymized bucket |
| **Privacy** | Opt-in tenant flag; only contribute/use after legal review |
| **Lookup order** | tenant TM → global TM (if premium) → semantic → LLM |
| **Billing** | Plan feature flag on `Tenant` |

## Dependencies

- P1-01 semantic layer
- Legal/privacy ADR required before build

## Acceptance criteria

- [ ] Premium tenant hits global cache for common EN→DE string
- [ ] Free tenant never reads global cache
- [ ] ADR: `0015-shared-translation-memory.md` with privacy model
- [ ] Audit log on global cache hits

## Overlap with raw.md

Item #1 premium section — Shared Cache.
