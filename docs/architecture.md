Для такого сервісу я б будував архітектуру як Modular Monolith → Event Driven → Microservices Ready.

На старті один NestJS application + окремі worker-процеси BullMQ. Це набагато дешевше і простіше за мікросервіси.

High Level Architecture
┌────────────────────────────────────────────┐
│ React UI │
│ MaryUI + Tailwind + Tanstack │
└─────────────────┬──────────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ API Gateway │
│ NestJS REST API │
└───────────────┬────────────────────────────┘
│
│
┌──────────────┼─────────────────────────┐
│ │ │
▼ ▼ ▼

Auth Translation Domain Project Domain

│ │ │
▼ ▼ ▼

Postgres BullMQ Queue Webhook Domain

│ │
│ ▼
│ Translation Worker
│
│ ▼
│ AI Provider Layer
│
│ ┌────────┼────────┬─────────┐
│ ▼ ▼ ▼ ▼
│ OpenAI Gemini Claude Ollama
│
▼
Redis
Docker Layout
server
│
├── nginx
│
├── frontend
│ └── react
│
├── backend-api
│ └── nestjs
│
├── worker
│ └── bullmq
│
├── postgres
│
├── redis
│
├── prometheus
│
├── grafana
│
└── loki
DDD Modules
src/

├── auth
├── tenant
├── user
├── project
├── translation
├── ai-provider
├── webhook
├── approval
├── export
├── audit
├── billing
└── shared
Translation Domain

Найголовніший домен.

Aggregate
TranslationJob
Entities
TranslationJob
TranslationKey
Translation
Language
Value Objects
LanguageCode
TranslationStatus
TranslationProvider
Project Domain
Project
Environment
ApiKey
Webhook

Project:

Project
│
├── API Keys
├── Webhooks
├── Languages
├── Translation Keys
├── Jobs
└── Settings
Tenant Domain
Tenant
User
Role
Permission
Approval Domain
Review
Approval
Comment

Workflow:

Draft
↓
In Review
↓
Approved
↓
Published
AI Provider Module

Інтерфейс:

interface AIProvider {
translate(
text: string,
sourceLang: string,
targetLang: string
): Promise<string>;
}

Реалізації:

OpenAiProvider
GeminiProvider
ClaudeProvider
OllamaProvider
BullMQ Queues
translation.create
translation.process
translation.retry
translation.review
translation.export
webhook.send
Queue Flow
User Request

 │

 ▼

Create Translation Job

 │

 ▼

BullMQ Queue

 │

 ▼

Split Into Tasks

 │

 ▼

AI Translation

 │

 ▼

Save To DB

 │

 ▼

Webhook
Database UML
Tenant
Tenant
--------------------
id
name
slug
created_at
User
User
--------------------
id
tenant_id
email
password
role
created_at

Relation:

Tenant 1 ------ * User
Project
Project
--------------------
id
tenant_id
name
description
status
created_at

Relation:

Tenant 1 ------ * Project
API Key
ApiKey
--------------------
id
project_id
name
secret
active

Relation:

Project 1 ------ * ApiKey
Webhook
Webhook
--------------------
id
project_id
url
secret
enabled

Relation:

Project 1 ------ * Webhook
Translation Entities UML
Project
│
│
▼

TranslationKey
--------------------
id
project_id
key
description
context

TranslationKey
│
│
▼

Translation
--------------------
id
translation_key_id
language
value
status
provider
version

Relation

Project
│
▼
TranslationKey
│
▼
Translation
Job UML
TranslationJob
--------------------
id
project_id
status
provider
created_at
TranslationJobItem
--------------------
id
job_id
translation_key_id
language
status

Relations

TranslationJob
│
▼
TranslationJobItem

TranslationJobItem
│
▼
TranslationKey
Full ER Diagram
Tenant
│
├───────────── User
│
└───────────── Project
│
├──────── ApiKey
│
├──────── Webhook
│
├──────── TranslationJob
│ │
│ │
│ ▼
│ TranslationJobItem
│
▼
TranslationKey
│
▼
Translation
│
▼
Approval
Audit Module

Кожна дія логиться.

AuditLog
--------------------
id
tenant_id
user_id
entity
entity_id
action
payload
created_at
Translation Memory Module

Найдорожча частина AI.

Треба окрему таблицю.

TranslationMemory
--------------------
id
source_language
target_language
source_text
translated_text
hash

Перед викликом OpenAI:

Check Memory
│
├── found
│ │
│ ▼
│ return
│
└── not found
│
▼
OpenAI

Економія 30-80% вартості.

Export Module
JSON
YAML
CSV
XLSX
Android XML
iOS Strings
PO
MO
Recommended Tables Count
tenants
users
roles
permissions

projects
api_keys
webhooks

languages

translation_keys
translations

translation_jobs
translation_job_items

translation_memory

reviews
approvals
comments

audit_logs

provider_configs

exports

Разом приблизно:

18-22 таблиці
Enterprise Features (наступний етап)
Glossary

Translation Memory

Versioning

Branching

AI Cost Analytics

Provider Fallback

Screenshot Context

Bulk Import

Bulk Export

Multi Environment

Staging / Production

SSO

LDAP

SCIM

Usage Billing

Rate Limits

White Label

RBAC

ABAC

Для production SaaS я б додав ще Outbox Pattern, Inbox Pattern, CQRS, Saga Orchestration, Optimistic Locking, Event Store (для історії перекладів) і pgvector для semantic translation memory та пошуку схожих перекладів через embeddings. Це вже рівень Lokalise/Phrase/Tolgee.