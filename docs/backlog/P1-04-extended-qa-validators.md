# P1-04 — Extended QA validators

**Phase:** 1 · **Priority:** High · **Status:** Backlog

## Goal

Reject or flag bad AI output: broken HTML, wrong placeholders, markdown issues — beyond current heuristic validator.

## Current state

- `TranslationOutputValidator` — empty, refusal phrases, identical source, length ratio, script checks (ADR 0008)
- `sanitizeTranslationOutput` — fences, quotes, prefixes
- Prompt preserves `{{name}}`, `%%...%%` — not validated post-hoc
- No HTML/markdown structure checks

## Proposed fit

| Layer | Change |
|-------|--------|
| **Module** | `translation/application/validators/` — composable validators |
| **Pattern** | Chain of responsibility; each returns `{ valid, reason, severity: error/warn }` |
| **Validators** | `PlaceholderValidator`, `HtmlTagBalanceValidator`, `MarkdownFenceValidator`, `LinkIntegrityValidator` |
| **Integration** | Run after sanitize, before or with `TranslationOutputValidator` in job runner |
| **Config** | Per-project `qaProfile`: strict | standard | off |

### Example rules

- Placeholder count in output = count in source
- HTML tag stack balanced
- No translated variable names inside `{{}}`

## Dependencies

- Builds on ADR 0008 (extend, don't replace)

## Acceptance criteria

- [ ] Placeholder mismatch fails validation → retry (same 3-attempt loop)
- [ ] Unit tests per validator with fixtures
- [ ] Job item `errorMessage` names failing validator
- [ ] Optional warn-only mode for markdown links

## Overlap with raw.md

Stage 1 "QA (HTML, placeholders, Markdown)" + item #13 (partial — full PR review in P2-07).
