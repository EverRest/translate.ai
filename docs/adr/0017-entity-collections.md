# ADR 0017: Entity collections (grouping layer)

## Status

Accepted

## Context

Localization objects (user-facing **entities**) model forms, pages, and APIs as trees. Product teams organize copy by **scope** (e.g. login, accreditation). A flat list of entities per project does not match how teams think about their domains.

## Decision

Add **`EntityCollection`** as a project-scoped grouping container:

- Collections have `slug`, `name`, optional `description`
- Each `LocalizationObject` may belong to one collection via optional `collectionId`
- **Key paths unchanged:** `{entitySlug}.{nodePath}` — collection slug is **not** prefixed to translation keys
- Default **General** collection created per project (migration + `ensureDefaultCollection` on list)

OpenAPI import targets a collection and creates one entity per selected API tag.

## Consequences

**Positive:**

- Non-breaking for flat keys, jobs, export
- Aligns UI with scope-based client workflows
- OpenAPI import has a clear target container

**Negative:**

- Entities without collection land in General — document in UI
- Cannot delete General collection

## Rules

- Tenant isolation via `ProjectAccessService`
- Deleting a collection reassigns entities to General
- Collection grouping is UX/reporting only — execution pipeline unchanged (ADR 0014)
