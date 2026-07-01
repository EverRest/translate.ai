# P3-12 — Localization objects (nested structure)

**Phase:** 3 · **Priority:** High · **Status:** Shipped (P3-12a/b/c + polish)

## Goal

Let teams model **domain objects** (forms, pages, modals, emails) as a **tree** — fields, buttons, placeholders, validation errors, success messages — while keeping today’s **flat key → value** pipeline (jobs, memory, QA, export) unchanged.

Example: a **Registration Form** object contains nested UI copy instead of dozens of unrelated flat keys.

## Current state (translate.ai)

| Area | Today |
|------|--------|
| **Schema** | [`TranslationKey`](../../backend/prisma/schema.prisma) — flat `key`, `sourceText`, optional `description`, `context`, `contentType` |
| **Jobs** | `TranslationJobItem` → `translation_key_id` × language — no grouping |
| **UI** | Project tabs: Keys (flat grid), Translations (flat grid) — [`ProjectDetailLayout`](../../frontend/src/features/projects/pages/ProjectDetailLayout.tsx) |
| **Export** | Flat json/yaml/csv/android-xml — [`export` module](../../backend/src/export/) |
| **AI** | `contentType` on keys drives prompts (ui, placeholder, email, …) — [`docs/domain/translation.md`](../domain/translation.md) |
| **Backlog vision** | This file was a product brainstorm (DSL, screenshot import, templates) — **not** aligned to codebase |

**Rule:** Projects may use **only flat keys**, **only objects**, or **both**. No migration of existing data required.

## Proposed fit (non-breaking)

### Principle: tree for authoring, flat keys for execution

```text
LocalizationObject (authoring / UX)
 └── LocalizationNode tree (structure + metadata)
 └── leaf nodes ──materialize──► TranslationKey rows (existing)
 │
 ▼
 Jobs · Memory · QA · Export (unchanged)
```

Materialization writes or updates `TranslationKey` rows using a stable dotted path:

```text
registration_form.title
registration_form.fields.email.label
registration_form.fields.email.placeholder
registration_form.fields.email.errors.required
registration_form.buttons.submit
```

### Schema (new tables)

| Model | Purpose |
|-------|---------|
| `LocalizationObject` | Top-level object: `projectId`, `slug`, `name`, `description`, `templateType` (form \| page \| modal \| email \| api \| custom), `status` (draft \| materialized) |
| `LocalizationNode` | Tree node: `objectId`, `parentId?`, `sortOrder`, `nodeType`, `slug`, `label?`, `sourceText?` (leaves), `contentType?`, `description?`, `context?`, `translationKeyId?` (FK after materialize) |

Optional on **`TranslationKey`** (nullable, backward compatible):

- `localizationObjectId` — group/filter in UI and export
- `nodeId` — link back to tree leaf

Indexes: `(projectId, slug)` on object; `(objectId, parentId, sortOrder)` on nodes.

### Backend module

New Nest module **`localization-object`** (or subfolder under `translation` if preferred — decide in ADR):

| Layer | Artifacts |
|-------|-----------|
| **Domain** | `NodeType` enum, `flattenTreeToKeyPaths()`, `materializeObjectService` |
| **CQRS** | `CreateLocalizationObjectCommand`, `UpsertNodeCommand`, `MaterializeObjectCommand`, `ListObjectsQuery`, `GetObjectTreeQuery` |
| **Queue** | `localization-object.generate` (phase 2) — AI structure from name + description |
| **API** | `GET/POST /projects/:id/objects`, `GET/PATCH /objects/:id`, `POST /objects/:id/nodes`, `POST /objects/:id/materialize`, `POST /objects/:id/translate` (creates job for materialized keys only) |

**Materialize** is idempotent: re-run updates keys by path; does not delete orphan flat keys outside the object unless explicit “prune” action.

### AI (phased — not MVP)

| Phase | Feature |
|-------|---------|
| P3-12a (shipped) | Manual tree editor + materialize |
| P3-12b (shipped) | AI generate structure queue + UI **Generate with AI** |
| P3-12c (shipped) | Templates: Login Form, Registration Form |
| P3-12d | Import hierarchy from Excel / AI detect (from original vision) |
| P3-12e | Screenshot / OpenAPI / TSX extract (defer) |

Structure-generation prompt outputs JSON; server validates and maps node types → `contentType` for leaves (button→`ui`, placeholder→`placeholder`, error→`ui`, email body→`email`).

### Frontend — new project tab **Objects**

Add tab in [`ProjectDetailLayout`](../../frontend/src/features/projects/pages/ProjectDetailLayout.tsx):

```text
Overview | Keys | Translations | Objects | Glossary | …
```

**Objects list** (`/projects/:id/objects`):

- Cards: name, template type badge, leaf count, materialized %, last updated
- CTA: Create object

**Object detail** (`/projects/:id/objects/:objectId`):

- Header: name, description, actions (Materialize, Translate all languages, Export subset)
- **Tree panel** (primary): collapsible nodes, type icons (field, button, error, …), inline edit `sourceText` on leaves
- **Sidebar**: node inspector — `nodeType`, `contentType`, description, context (same fields as flat keys)
- Link “Open in Translations grid” → filters flat grid by `localizationObjectId` or key prefix

Match existing design: slate-900 cards, sky accents, `DataGrid` patterns where list views apply; tree uses indented rows + chevrons (not a second grid paradigm).

**Keys / Translations tabs:** unchanged default behavior; optional filter chip “Object: Registration Form” when navigated from object detail.

### Export / import

- **MVP:** Materialized keys appear in existing export as today (flat paths).
- **Later:** `export format=object-json` exports nested JSON rebuilt from tree + translations; import round-trip.

## Dependencies

- Shipped translation job workflow — [translation-job.md](../workflows/translation-job.md)
- Shipped `contentType` + QA validators — ADR 0008
- Related later: [P3-04](./P3-04-dependency-graph.md) (links between keys), [P3-07](./P3-07-localization-pipeline-as-code.md) (pipeline steps)

## Out of scope (first PR)

- Replacing flat Keys tab
- Breaking job API contract
- Screenshot / OpenAPI / React file import
- Full Localization DSL editor

## Acceptance criteria

### MVP (P3-12a)

- [x] Create `LocalizationObject` + nested `LocalizationNode` tree via API
- [x] `POST /objects/:id/materialize` creates/updates `TranslationKey` rows; flat-only projects unaffected
- [x] Create translation job from object uses **same** `CreateTranslationJobCommand` with materialized key paths
- [x] **Objects** tab: list + tree editor + materialize + link to translations
- [x] Unit tests: flatten tree, materialize idempotency, path slug rules, tenant scoping
- [x] ADR 0014 — dual model (tree authoring + flat execution)
- [x] Docs: `docs/domain/localization-object.md`, openapi.md, changelog

### Phase 2 (P3-12b/c)

- [x] AI generate structure queue + UI “Generate” button
- [x] Object templates seed (Login Form, Registration Form)

### Polish (P3-12 follow-up)

- [x] Filter keys/translations by `localizationObjectId` or key prefix
- [x] Node inspector sidebar — `contentType`, `description`, `context`
- [x] Edit object name/description in UI
- [x] Optional prune on materialize (`?prune=true`)
- [x] List cards: materialized % + last updated; node type icons

## Implementation notes

| Topic | Decision |
|-------|----------|
| **Branch** | `feature/p3-12-localization-objects` from `develop` |
| **TDD** | Red → green for `flatten-tree.utils`, `materialize-object.service`, API handlers |
| **Tenant** | All queries filter by `tenantId` via project access |
| **Key paths** | `{objectSlug}.{path}` — validate slug `[a-z0-9_]+` segments |

## Example (after materialize)

Object **Registration Form** (`slug: registration_form`):

```text
registration_form
├── title → "Create account"
├── description → "Create your account to continue."
├── fields
│ └── email
│ ├── label → "Email"
│ ├── placeholder → "Enter email"
│ └── errors
│ ├── required → "Email is required"
│ └── invalid → "Invalid email"
└── buttons
 ├── submit → "Create account"
 └── cancel → "Cancel"
```

Each leaf becomes one `TranslationKey` with appropriate `contentType` for the existing AI pipeline.

## Overlap with raw vision

Original brainstorm (DSL, screenshot, tone packs) remains valid as **later phases** — this task delivers the **data model + UX foundation** inside translate.ai’s modular monolith.
