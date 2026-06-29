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

Node metadata (`description`, `context`, `contentType`) is editable in the UI inspector and flows to materialized keys.

---

## Workflow

1. Create object (`POST /projects/:id/objects`)
2. Add nodes (`POST /objects/:id/nodes`) — build tree
3. **Materialize** (`POST /objects/:id/materialize`) — flat keys for pipeline
4. Optional **prune** (`POST /objects/:id/materialize?prune=true`) — remove stale keys linked to the object but absent from the current tree
5. **Translate** (`POST /objects/:id/translate`) — materialize + create job for all object keys

Deleting an object removes the tree; materialized keys remain with `localizationObjectId` cleared.

---

## Filtering flat grids

List keys or translations with:

- `localizationObjectId` — keys materialized from one object
- `keyPrefix` — e.g. `registration_form.`

Object detail links open **Keys** / **Translations** with the object filter applied.

---

## UI

Project tab **Objects** — list cards (materialized %, last updated), tree editor with node inspector, materialize (optional prune), translate all target languages.

Existing **Keys** and **Translations** tabs unchanged; optional object filter chip when navigated from an object.
