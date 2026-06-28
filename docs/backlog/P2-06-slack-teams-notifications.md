# P2-06 — Slack / Teams / Discord notifications

**Phase:** 2 · **Priority:** Low · **Status:** Backlog

## Goal

Notify teams when jobs fail, reviews pending, or drift detected — complement webhooks.

## Current state

- Outbound webhooks with HMAC — customer implements Slack themselves
- No first-party Slack/Teams apps

## Proposed fit

| Layer | Change |
|-------|--------|
| **Module** | Extend `webhook` or `integration` — `NotificationChannel` abstraction |
| **Schema** | `notification_channels` (projectId, type: slack|teams|discord, webhookUrl encrypted) |
| **Events** | Reuse `TranslationJobFailedEvent`, approval events |
| **Frontend** | Project Settings → Notifications |

## Dependencies

- Webhook infrastructure (shipped)

## Acceptance criteria

- [ ] Configure Slack incoming webhook; job.failed posts formatted message
- [ ] Link to job detail in dashboard
- [ ] No secrets in logs

## Overlap with raw.md

Stage 2 "Slack/Discord/Teams інтеграції".
