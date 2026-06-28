# Database Schema

PostgreSQL via Prisma. ~18–22 tables at MVP. All tenant-scoped tables include `tenant_id` where applicable.

## ER overview

```text
Tenant
├── User
└── Project
    ├── ApiKey
    ├── Webhook
    ├── TranslationJob
    │   └── TranslationJobItem
    └── TranslationKey
        └── Translation
            └── Review / Approval / Comment

TranslationMemory (global per tenant, keyed by hash)
AuditLog
ProviderConfig
Export (metadata)
```

## Core tables

### tenants

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR | |
| slug | VARCHAR UNIQUE | |
| created_at | TIMESTAMP | |

### users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | INDEX |
| email | VARCHAR | UNIQUE(tenant_id, email) |
| password | VARCHAR | hashed |
| role | ENUM | admin, developer, reviewer, viewer |
| created_at | TIMESTAMP | |

### projects

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | INDEX |
| name | VARCHAR | |
| description | TEXT | nullable |
| status | ENUM | active, archived |
| created_at | TIMESTAMP | |

### api_keys

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| name | VARCHAR | |
| secret_hash | VARCHAR | never store plain secret |
| active | BOOLEAN | |

### webhooks

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| url | VARCHAR | HTTPS only |
| secret | VARCHAR | HMAC key |
| enabled | BOOLEAN | |

### project_languages

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| code | VARCHAR(5) | ISO language code |
| is_default | BOOLEAN | default false |

UNIQUE(project_id, code)

### translation_keys

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| key | VARCHAR | e.g. cart.checkout |
| source_text | TEXT | Source string to translate |
| description | TEXT | |
| context | TEXT | AI context |

UNIQUE(project_id, key)

### translations

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| translation_key_id | UUID FK | |
| language | VARCHAR(5) | |
| value | TEXT | |
| status | ENUM | draft, review, approved, published |
| provider | VARCHAR | |
| version | INT | default 1 |

### translation_jobs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| status | ENUM | pending, processing, completed, failed |
| provider | VARCHAR | |
| created_at | TIMESTAMP | |

### translation_job_items

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| job_id | UUID FK | |
| translation_key_id | UUID FK | |
| language | VARCHAR(5) | |
| status | ENUM | pending, processing, completed, failed |

### translation_memory

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| source_language | VARCHAR(5) | |
| target_language | VARCHAR(5) | |
| source_text | TEXT | |
| translated_text | TEXT | |
| hash | VARCHAR(64) | INDEX |
| embedding | vector(768) | pgvector; nullable until backfill |
| embedded_at | TIMESTAMP | nullable |

### translation_memory_hits

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| project_id | UUID | nullable |
| job_id | UUID | nullable |
| job_item_id | UUID | nullable |
| hit_type | ENUM | exact, semantic |
| source_lang | VARCHAR(5) | |
| target_lang | VARCHAR(5) | |
| similarity | FLOAT | semantic hits only |
| created_at | TIMESTAMP | |

### audit_logs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| user_id | UUID FK | nullable (system actions) |
| entity | VARCHAR | |
| entity_id | UUID | |
| action | VARCHAR | |
| payload | JSONB | |
| created_at | TIMESTAMP | |

### provider_configs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| project_id | UUID FK | nullable (tenant default) |
| provider | VARCHAR | |
| config | JSONB | encrypted API keys, model |

### ai_usage_logs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| project_id | UUID FK | nullable |
| job_id | UUID FK | nullable |
| job_item_id | UUID FK | nullable |
| provider | VARCHAR | openai, gemini, ollama |
| model | VARCHAR | |
| input_tokens | INT | |
| output_tokens | INT | |
| estimated_cost_usd | DECIMAL | |
| used_fallback | BOOLEAN | |
| primary_provider | VARCHAR | nullable |
| created_at | TIMESTAMP | |

## Indexing strategy

- `(tenant_id)` on all tenant tables
- `(project_id)` on project-scoped tables
- `(hash)` on translation_memory
- `(job_id, status)` on translation_job_items

### glossary / glossary_terms

| Column | Type | Notes |
|--------|------|-------|
| glossaries.project_id | UUID | One glossary per project |
| glossary_terms.source_term | text | Term in source language |
| glossary_terms.target_term | text? | Preferred translation |
| glossary_terms.do_not_translate | boolean | Keep term unchanged |

### glossary_suggestions

| Column | Type | Notes |
|--------|------|-------|
| glossary_suggestions.project_id | UUID | Scoped to project |
| glossary_suggestions.source_term | text | Suggested source term |
| glossary_suggestions.target_term | text? | Preferred translation (null when do-not-translate) |
| glossary_suggestions.do_not_translate | boolean | Keep term unchanged |
| glossary_suggestions.confidence | float | Rank score 0–1 |
| glossary_suggestions.reason | text? | Heuristic id (e.g. `identical_across_languages`) |
| glossary_suggestions.status | enum | pending, approved, rejected |

### project_branches / branch_translations

| Column | Type | Notes |
|--------|------|-------|
| project_branches.name | text | Unique per project; `main` is default |
| project_branches.is_default | boolean | Main branch flag |
| project_branches.status | enum | active, merged, archived |
| branch_translations | — | Feature-branch translation snapshots/overrides |

## Migration rules

- One migration per logical change.
- Reversible when possible.
- No data backfill logic in migrations (use separate scripts).
- Seed data only in dev/staging seeds.

## Future tables (roadmap)

- `translation_versions` (event store)
- `outbox` (reliable messaging)

## Related

- [architecture.md](../architecture.md) — full UML
- [patterns.md](../patterns.md) — tenant scoping, outbox
