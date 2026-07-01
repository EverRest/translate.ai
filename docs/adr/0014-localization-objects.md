# ADR 0014: Localization objects (tree authoring, flat execution)

## Status

Accepted

## Context

Teams need to model UI domains (forms, pages, emails) as structured trees — fields, buttons, placeholders, validation errors — not only as unrelated flat keys. Jobs, translation memory, QA validators, and export already operate on `TranslationKey` rows.

## Decision

Add a `localization-object` bounded context:

- **`LocalizationObject`** — project-scoped container (`slug`, `name`, `templateType`)
- **`LocalizationNode`** — tree nodes (`parentId`, `nodeType`, `slug`, optional `sourceText` on leaves)
- **`MaterializeObjectService`** — flattens leaves to dotted `TranslationKey` paths (`{objectSlug}.{segment...}`)

Flat-only projects are unchanged. Materialized keys participate in the existing job pipeline via `translation_key_id`.

Optional nullable `TranslationKey.localizationObjectId` groups keys for UI filters; link from node → key via `LocalizationNode.translationKeyId`.

## Consequences

**Positive:**

- Non-breaking: flat CRUD, jobs, export unchanged
- Reuses `contentType` and AI prompt routing on materialized keys
- Tree UI can evolve independently (templates, AI structure gen in later phases)

**Negative:**

- Dual source of truth until materialize (tree vs keys) — document that export uses keys
- Sibling slug uniqueness enforced in application layer (nullable `parentId` avoids DB unique on roots)

## Rules

- Access via `ProjectAccessService` (tenant isolation)
- Materialize is idempotent: updates existing keys by path within the project
- Deleting an object removes nodes; translation keys remain with `localizationObjectId` set null
