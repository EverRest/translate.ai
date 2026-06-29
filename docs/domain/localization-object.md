# Localization objects

Optional **tree authoring** layer for forms, pages, emails, and other UI domains. Execution still uses flat `TranslationKey` rows (jobs, memory, QA, export).

See [ADR 0014](../adr/0014-localization-objects.md).

---

## Concepts

| Entity | Role |
|--------|------|
| `LocalizationObject` | Container: `slug`, `name`, `templateType` (form, page, …) |
| `LocalizationNode` | Tree node: `nodeType`, `slug`, optional `sourceText` on leaves |
| **Materialize** | Writes/updates `TranslationKey` at `{objectSlug}.{path}` |

Projects may use flat keys only, objects only, or both.

---

## Node types

`section`, `field`, `button`, `label`, `placeholder`, `hint`, `validation`, `error`, `success`, `tooltip`, `email_subject`, `email_body`, `notification`, `text`

Leaves with `sourceText` become translation keys. `contentType` defaults from node type (e.g. `placeholder` → `placeholder`, `button` → `ui`).

---

## Workflow

1. Create object (`POST /projects/:id/objects`)
2. Add nodes (`POST /objects/:id/nodes`) — build tree
3. **Materialize** (`POST /objects/:id/materialize`) — flat keys for pipeline
4. **Translate** (`POST /objects/:id/translate`) — materialize + create job for all object keys

Deleting an object removes the tree; materialized keys remain with `localizationObjectId` cleared.

---

## UI

Project tab **Objects** — list cards, tree editor, materialize, translate all target languages.

Existing **Keys** and **Translations** tabs unchanged.
