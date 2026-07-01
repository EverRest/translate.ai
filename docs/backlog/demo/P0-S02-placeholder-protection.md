# P0-S02 — Placeholder protection

**Phase:** FIFA/WIZ · **Importance:** Critical · **Status:** Shipped

> Moved out of active backlog — see [shipped-baseline](../shipped-baseline.md) and [demo/README](./README.md#already-shipped--covered-no-new-p0-work).

**Client idea:** #11 · **EverRest:** “Ok” (with open questions on email templates / GDPR)

## Goal

`%%PLACEHOLDER%%` and similar tokens stay untouched during AI translation — never translated or altered.

**Demo hook:** “847 keys processed, 134 placeholders preserved.”

## Shipped

| Capability | Location |
|------------|----------|
| `PlaceholderValidator` | `translation/application/validators/placeholder.validator.ts` |
| Patterns | `{{…}}` and `%%…%%` — count + exact match |
| Job QA chain | ADR 0008; failed validation → retry or flag |
| Placeholder summary | `buildJobPlaceholderSummary` — `GET /jobs/:id`, `job.completed` / `job.failed` webhooks |
| Job detail UI | Green banner when `placeholderSummary` present |
| Workflow doc | `docs/workflows/translation-job.md` |

## Open edge cases (future, not blocking)

- Email templates with mixed HTML + GDPR merge fields — validate parser on real Wiz samples
- Placeholders in **translatable** surrounding prose (lock token only, not whole sentence)
- Confluence Hints → auto-tag keys with placeholder strict mode ([P0-03](./P0-03-documentation-import))
- Wiz email template fixtures in e2e suite

## Acceptance criteria (original #11)

- [x] `%%TOKEN%%` preserved in output or job fails QA
- [x] `{{name}}` style placeholders preserved
- [x] Report placeholder count in job summary (demo hook)
- [ ] Wiz email template fixtures in e2e suite (deferred — needs real Wiz samples)

## Notes

Core requirement and demo metric shipped. Email/GDPR edge cases remain open until Wiz provides sample templates.

---

## Agent review

**Verdict:** Agree — shipped including demo metric.

### Architecture

- Counter: `buildJobPlaceholderSummary` aggregates per unique key from source text during job status query and webhook dispatch.
- Email/GDPR edge cases: extend validator with HTML-aware token extraction only after **real Wiz email fixtures** — do not guess merge-field syntax.

### Technical

- Job summary API: `{ placeholdersPreserved, placeholdersTotal }` — optional, omitted when zero.
- E2e: `translation-flow.e2e-spec.ts` asserts placeholder summary on completed job.

### UI

- Job completion detail: **“134 placeholders preserved”** green check — sales demo hook.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| Open questions on email/GDPR | Valid — need Wiz sample before changing validator; current %%/{{}} logic may miss `{variable}` styles |
