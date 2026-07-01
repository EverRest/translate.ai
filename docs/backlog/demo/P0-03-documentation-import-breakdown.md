Мені подобається загальний напрямок, але я б **суттєво змінив архітектуру**, щоб Confluence став лише одним із багатьох джерел імпорту. Якщо зараз правильно закласти основу, то потім Excel, Notion, Google Docs, Jira, Figma, Markdown, JSON будуть додаватися буквально за 1-2 дні.

Я б реалізував це так.

---

# 1. Не робити Confluence Import

Зробити **Import Pipeline**.

```
Import

│

Detect file/integration

│

Parser

│

Intermediate Model

│

Normalization

│

Validation

│

Preview Diff

│

Import Job

│

Materialization

│

Translation
```

Тобто Confluence — лише один Parser.

Завтра буде

* Excel
* CSV
* Notion
* Markdown
* Google Sheets
* Figma

і нічого не доведеться переписувати.

---

# 2. Новий Domain Layer

Зараз у вас є

```
ImportParser

↓

ImportRow
```

Я б зробив значно багатшу модель.

```ts
interface ImportDocument {
metadata: ImportMetadata;

objects: ImportObject[];

warnings: ImportWarning[];

stats: ImportStats;
}
```

---

```
ImportObject
```

це

```ts
{
externalId;

title;

description;

source;

scope;

nodes:[]
}
```

---

Node

```ts
{
type;

path;

value;

context;

hints;

metadata;
}
```

Чому?

Бо завтра Confluence може імпортувати

```
Form

↓

Buttons

↓

Errors

↓

Tooltips
```

а Excel

```
flat rows
```

а AI

```
nested JSON
```

І всі вони зводяться до ImportObject.

---

# 3. Pipeline

Я б зробив Pipeline Pattern.

```
Read

↓

Detect Format

↓

Parse

↓

Normalize

↓

Validate

↓

Preview

↓

Import

↓

Translate

↓

Index
```

Кожен крок окремий сервіс.

Наприклад

```
HtmlReader

↓

ConfluenceParser

↓

ScopeNormalizer

↓

KeyValidator

↓

DuplicateResolver

↓

PreviewBuilder

↓

ImportExecutor
```

---

# 4. Preview

Найважливіша фіча.

НЕ імпортувати одразу.

Показати

```
+ 412 new keys

~ 17 changed

- 5 removed

!! 8 duplicated

!! 4 invalid
```

Потім

```
Import
```

---

Так роблять майже всі enterprise продукти.

---

# 5. Diff Engine

Окремий сервіс.

```
Current Project

↓

Imported Document

↓

Diff
```

Повертає

```
Create

Update

Delete

Ignore

Conflict
```

---

Це потім використовуватиметься

* Git
* Excel
* API
* Confluence

---

# 6. Parse Strategy

Не робити

```
ConfluenceParser
```

напряму.

```
ImportParser

↓

HtmlParser

↓

TableParser

↓

ConfluenceTableStrategy
```

Бо завтра

```
Notion HTML
```

майже такий самий.

---

# 7. HTML

Я б НЕ працював із DOM напряму.

Спочатку

```
HTML

↓

Normalized Table
```

```
[
{
Scope:
Key:
Value:
Hint:
}
]
```

І лише після цього

```
Row Mapper
```

---

# 8. Scope

Не зберігати

```
scope.key
```

Це дуже погано.

Я б зробив

```
TranslationKey

↓

scopeId

↓

key
```

або

```
tags
```

Бо

```
Common

↓

Login

↓

Cancel
```

може існувати

ще

```
Mobile

↓

Login

↓

Cancel
```

---

# 9. Hints

Зараз

```
string
```

Я б зробив

```
Hint Parser
```

```
%%name%%
```

↓

```
PlaceholderRule
```

```
HTML
```

↓

```
HtmlRule
```

```
markdown
```

↓

```
MarkdownRule
```

```
plural
```

↓

```
PluralRule
```

тобто

```
Hints

↓

Rules
```

---

# 10. Import Session

Додав би окрему таблицю

```
import_sessions
```

```
id

project

status

started

finished

type

user

stats

warnings
```

Бо потім можна

```
History

Rollback

Reimport
```

---

# 11. Import Items

```
import_session_items
```

```
row

status

error

warning

object

translationKey

before

after
```

Дуже допомагає дебажити.

---

# 12. Queue

Я б НЕ робив

```
integration.confluence.sync
```

Один Job.

Я б розбив.

```
Import

↓

Read File

↓

Parse

↓

Validate

↓

Preview

↓

Import

↓

Materialize

↓

Translate

↓

Notify
```

BullMQ це дуже любить.

---

# 13. Backend

```
POST

/import

↓

returns

ImportSession
```

Потім

```
GET

/import/{id}
```

```
Parsing

67%

```

```
Imported

124 keys
```

Потім

```
POST

/import/{id}/apply
```

---

Тобто асинхронно.

---

# 14. Frontend Wizard

Я б зробив

```
Import

↓

Choose Source

↓

Upload

↓

Mapping

↓

Preview

↓

Import

↓

Done
```

Той самий Wizard можна буде використовувати для всіх інтеграцій.

---

# 15. Mapping Screen

Навіть якщо зараз Wiz має стандартний формат.

Завтра клієнт скаже

```
Column A

Key

Column C

English

```

Тому

```
Dropdown

↓

Scope

↓

Key

↓

Source

↓

Hint
```

---

# 16. Automatic Detection

AI можна використовувати навіть тут.

```
Upload HTML

↓

AI

↓

Looks like

Confluence

Confidence 98%
```

або

```
Looks like

Excel Export

```

---

# 17. Найсильніша фіча

Я б зробив **Import Rules**.

Наприклад:

```
If scope == "Errors"

↓

Create Error Object
```

```
If scope == "Forms"

↓

Materialize Localization Object
```

```
If hint contains %%...%%

↓

Placeholder Validation
```

```
If key starts with BTN_

↓

Button Node
```

Тобто імпорт не просто створює ключі, а **будує бізнес-об'єкти**. Саме це відрізнятиме ваш продукт від Crowdin або Lokalise.

---

# Як би я розбив реалізацію на спринти

## Sprint 1 — Foundation (2–3 дні)

* Побудувати універсальний `ImportPipeline`.
* Ввести доменні моделі `ImportDocument`, `ImportObject`, `ImportNode`.
* Створити `ImportSession` і `ImportSessionItem`.
* Реалізувати асинхронний BullMQ pipeline.

## Sprint 2 — Confluence File Import (3–5 днів)

* HTML Reader (`cheerio`).
* Table Normalizer.
* `ConfluenceParser`.
* Scope/Hint Normalizer.
* Preview + Diff Engine.
* Apply Import.

## Sprint 3 — UX (2–3 дні)

* Багатокроковий Import Wizard.
* Progress через WebSocket/SSE.
* Preview змін із фільтрами (New / Updated / Conflicts / Warnings).
* Import History.

## Sprint 4 — Live Sync (4–6 днів)

* Atlassian OAuth.
* Зашифроване зберігання токенів.
* `ConfluenceSyncJob`.
* Ідемпотентний upsert.
* Delta Sync (`lastSyncedAt`).
* Retry/backoff для `429 Too Many Requests`.

### Декілька технічних порад

* **Не змішуй Parser і Importer.** Parser має лише повертати `ImportDocument`, нічого не записуючи в БД.
* **Не викликай AI** на етапі імпорту. Спочатку імпортуй "джерело істини", а вже окремим пайплайном запускай materialization, генерацію об'єктів і переклади.
* **Використовуй staging-модель.** Поки користувач не натиснув **Apply**, усі дані повинні жити лише в `ImportSession`. Це дає можливість показати diff, відкотити імпорт або повторити його без змін у проєкті.
* **Введи `externalSource` і `externalId`** для кожного імпортованого об'єкта (`confluence`, `pageId`, `rowId`). Це стане основою для майбутньої двосторонньої синхронізації, а не лише одноразового імпорту.