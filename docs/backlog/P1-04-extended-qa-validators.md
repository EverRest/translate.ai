# P1-04 — Extended QA validators

**Phase:** 1 · **Priority:** High · **Status:** Partial (MVP shipped)

## Goal

Reject or flag bad AI output: broken HTML, wrong placeholders, markdown issues — beyond current heuristic validator.

## Current state

- `TranslationOutputValidator` — heuristics + **QA chain (MVP)** — see ADR 0008
- `translation/application/validators/` — `PlaceholderValidator`, `HtmlTagBalanceValidator`
- `sanitizeTranslationOutput` — fences, quotes, prefixes
- Prompt preserves `{{name}}`, `%%...%%` — **validated post-hoc (MVP)**
- HTML tag balance checked when source contains tags
- No markdown/link validators yet; no per-project `qaProfile`

## Proposed fit (remaining)

| Layer | Change |
|-------|--------|
| **Validators** | `MarkdownFenceValidator`, `LinkIntegrityValidator` |
| **Config** | Per-project `qaProfile`: strict \| standard \| off |

### Example rules (remaining)

- Optional warn-only mode for markdown links

## Dependencies

- Builds on ADR 0008 (extend, don't replace)

## Acceptance criteria

- [x] Placeholder mismatch fails validation → retry (same 3-attempt loop)
- [x] Unit tests per validator with fixtures
- [x] Job item `errorMessage` names failing validator
- [ ] Optional warn-only mode for markdown links
- [ ] Markdown fence validator
- [ ] Per-project `qaProfile`

## Overlap with raw.md

Stage 1 "QA (HTML, placeholders, Markdown)" — placeholders + HTML done; markdown/links deferred. Full PR review in P2-07.
