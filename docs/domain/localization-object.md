# Localization objects

Optional **tree authoring** layer for forms, pages, emails, and other UI domains. Execution still uses flat `TranslationKey` rows (jobs, memory, QA, export).

See [ADR 0014](../adr/0014-localization-objects.md) and [ADR 0017](../adr/0017-entity-collections.md).

---

## Concepts

| Entity | Role |
|--------|------|
| `EntityCollection` | Grouping folder (scope): `slug`, `name` — UI label **Collection** |
| `LocalizationObject` | **Entity** in UI: `slug`, `name`, `templateType` (form, page, api, …) |
| `LocalizationNode` | Tree node: `nodeType`, `slug`, optional `sourceText` on leaves |
| **Materialize** | Writes/updates `TranslationKey` at `{entitySlug}.{path}` (collection slug not in key path) |

Projects may use flat keys only, entities only, or both.

---

## Node types

`section`, `field`, `button`, `label`, `placeholder`, `hint`, `validation`, `error`, `success`, `tooltip`, `email_subject`, `email_body`, `notification`, `text`

Leaves with `sourceText` become translation keys. `contentType` defaults from node type (e.g. `placeholder` → `placeholder`, `button` → `ui`).

Node metadata (`description`, `context`, `contentType`) is editable in the UI inspector and flows to materialized keys.

---

## Workflow

1. Optional: create collection (`POST /projects/:id/collections`)
2. Create entity (`POST /projects/:id/objects`) — assign `collectionId` or default **General**
3. Add nodes (`POST /objects/:id/nodes`) — build tree
4. Or import from OpenAPI (`POST /collections/:id/import/openapi`) — one entity per API tag
5. **Materialize** (`POST /objects/:id/materialize`) — flat keys for pipeline
6. Optional **prune** (`POST /objects/:id/materialize?prune=true`)
7. **Translate** (`POST /objects/:id/translate`) — materialize + create job for all entity keys

Deleting an entity removes the tree; materialized keys remain with `localizationObjectId` cleared.

---

## OpenAPI import

Upload OpenAPI 3 JSON into a collection:

- `POST .../collections/:collectionId/import/openapi/preview` — tag list + entity preview
- `POST .../collections/:collectionId/import/openapi` — creates `api` template entities with trees from paths, summaries, parameters, and response descriptions

Large specs (>200 nodes total) enqueue `integration.openapi.import` on the worker.

---

## Filtering flat grids

List keys or translations with:

- `localizationObjectId` — keys materialized from one object
- `keyPrefix` — e.g. `registration_form.`

Object detail links open **Keys** / **Translations** with the object filter applied.

---

## UI

Project tab **Entities** (routes `/projects/:id/entities`) — collection sidebar, entity cards, tree editor, OpenAPI import, materialize, translate.

Existing **Keys** and **Translations** tabs unchanged; optional entity filter chip when navigated from entity detail.
