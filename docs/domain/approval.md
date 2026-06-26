# Approval Domain

Human-in-the-loop review before translations go live.

## Entities

### Review

| Field | Description |
|-------|-------------|
| id | UUID |
| translation_id | FK → Translation |
| reviewer_id | FK → User |
| status | pending, in_review, approved, rejected |
| created_at | Timestamp |

### Approval

Records final approval action with audit trail.

### Comment

Reviewer notes on a translation or key.

## Workflow

```text
Draft
  │
  ▼
In Review
  │
  ├── Approve ──► Approved ──► Published
  │
  └── Reject ──► Rejected (back to Draft or re-translate)
```

## Reviewer actions

- Edit translation text
- Approve / reject
- Add comment
- Reassign reviewer
- Bulk approve (same language batch)

## Commands

- `SubmitForReviewCommand`
- `ApproveTranslationCommand`
- `RejectTranslationCommand`
- `AddReviewCommentCommand`
- `PublishTranslationCommand`

## Events

- `TranslationSubmittedForReviewEvent`
- `TranslationApprovedEvent`
- `TranslationRejectedEvent`
- `TranslationPublishedEvent`

Triggers webhook `translation.approved` on publish.

## UI (React)

Approval screen columns:

| Key | Language | Original | Translation | Status | Reviewer | Actions |

Actions: Approve, Reject, Edit, Bulk Approve.

## Rules

- Only users with `reviewer` or `admin` role can approve.
- Published translations are immutable; changes create new version.
- All approval actions logged in `audit` module.

## Related

- [domain/translation.md](./translation.md)
- [workflows/webhooks.md](../workflows/webhooks.md)
