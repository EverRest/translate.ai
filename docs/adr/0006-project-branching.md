# ADR 0006: Project Branching

## Status

Accepted

## Context

Teams need Git-like branches to experiment with translations (e.g. staging, feature releases) without affecting production strings on `main`. Merging promotes branch changes into the canonical translation set.

## Decision

Add a `branching` bounded context with:

- `ProjectBranch` — named branch per project; `main` is the default branch (`isDefault`)
- `BranchTranslation` — translation snapshots/overrides on feature branches only

**Main branch** continues to use the existing `translations` table (jobs, approvals, export). Feature branches store copies in `branch_translations` at branch creation. **Diff** compares branch values to main. **Merge** upserts changed rows into `translations` and marks the branch `merged`.

API under `/projects/:projectId/branches`.

## Consequences

**Positive:**

- No change to existing job/approval flows (they target main)
- Clear promotion path via merge
- Diff is straightforward value comparison

**Negative:**

- Two storage locations for translations (main vs branches)
- Branch edits do not trigger webhooks/approvals until merge
- Large projects copy all translations on branch create (acceptable for MVP)

## Rules

- Only one `main` branch per project; cannot merge or delete main
- Branch names unique per project; `main` reserved
- Merged branches are read-only
- Merge requires admin or developer role
