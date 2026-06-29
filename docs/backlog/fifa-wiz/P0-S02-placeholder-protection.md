# P0-S02 — Placeholder protection

**Phase:** FIFA/WIZ · **Importance:** Critical · **Status:** Shipped (edge cases open)

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
| Workflow doc | `docs/workflows/translation-job.md` |

## Open edge cases (future, not blocking)

- Email templates with mixed HTML + GDPR merge fields — validate parser on real Wiz samples
- Placeholders in **translatable** surrounding prose (lock token only, not whole sentence)
- Confluence Hints → auto-tag keys with placeholder strict mode ([P0-03](./P0-03-confluence-import.md))

## Acceptance criteria (original #11)

- [x] `%%TOKEN%%` preserved in output or job fails QA
- [x] `{{name}}` style placeholders preserved
- [ ] Report placeholder count in job summary (nice-to-have for demo hook)
- [ ] Wiz email template fixtures in e2e suite

## Notes

Core requirement met. Demo metric (“134 placeholders preserved”) needs job summary counter — small follow-up if sales wants exact hook.
