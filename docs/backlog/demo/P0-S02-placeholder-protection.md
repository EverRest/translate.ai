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

---

## Agent review

**Verdict:** Agree — shipped. Demo hook metric is **Wave 1 quick win** — implement placeholder counter in job completion summary.

### Architecture

- Counter: increment in `PlaceholderValidator` or aggregate during job runner when validator passes — store on `TranslationJob` summary JSON or job completion event payload.
- Email/GDPR edge cases: extend validator with HTML-aware token extraction only after **real Wiz email fixtures** — do not guess merge-field syntax.

### Technical

- Job summary API: `{ placeholdersPreserved: 134, placeholdersTotal: 134 }` — computed from source texts in job scope.
- E2e: Wiz fixture strings with `%%USER_NAME%%` in HTML email template.

### UI

- Job completion modal: **“134 placeholders preserved”** green check — sales demo hook.
- Confluence Hints integration (P0-03): auto-set strict mode when hint matches regex — links import to QA.

### Disagreements

| Backlog claim | Issue |
|---------------|-------|
| “Nice-to-have” counter | **Promote to Wave 1** — explicit EverRest demo hook; ~half-day backend work |
| Open questions on email/GDPR | Valid — need Wiz sample before changing validator; current %%/{{}} logic may miss `{variable}` styles |
