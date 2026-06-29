# ADR 0015: Glossary sets (multi-glossary, single active)

## Status

Accepted

## Context

Projects need more than one terminology set (e.g. Default vs Legal vs Marketing) while translation jobs must inject **one** consistent glossary into AI prompts. ADR 0005 assumed one glossary per project.

## Decision

Allow **multiple glossaries per project** with metadata:

- `name` — unique per project (e.g. `Default`, `Legal`)
- `isDefault` — bootstrap set created on first use
- `isActive` — exactly one active set per project at a time

**Rules:**

- Translation workers and upsert APIs target the **active** glossary only.
- `ensureDefaultGlossary()` creates `Default` (`isDefault=true`, `isActive=true`) when a project has no glossaries.
- `activateGlossary(id)` runs in a transaction: deactivate all others for the project, then set active.
- Term CRUD list endpoints accept optional `glossaryId` for viewing inactive sets; writes always go to active (or explicit active via upsert).
- Existing single-glossary rows migrate to `name='Default'`, `isDefault=true`, `isActive=true`.

## Consequences

**Positive:**

- Teams can maintain parallel term sets without separate projects
- Clear injection point for jobs (active only)
- Upsert/bulk-upsert/presets/drift share one code path

**Negative:**

- UI must show which set is active to avoid confusion
- App-layer invariant for single active (DB partial unique deferred)

## Related

- [ADR 0005](./0005-project-glossary.md) — original glossary model
- Glossary consistency platform — presets and drift upsert into active set
