Це якраз найцікавіше. Я подивився б на це не як на "ZIP-файл", а як на **Document Package**.

Тобто користувач навіть не повинен знати, що всередині.

---

# User Flow

```
Project

↓

Import

↓

Confluence

↓

Upload ZIP
```

Drag & Drop

```
localization-space.zip
```

↓

Backend

```
Analyzing archive...

✓ 47 pages

✓ 812 translation keys

✓ 5 warnings
```

↓

Preview

↓

Import

---

# Backend Flow

```
Upload ZIP

↓

Store file

↓

Create ImportSession

↓

Queue Job

↓

Extract archive

↓

Find supported files

↓

Parse

↓

Merge

↓

Diff

↓

Preview

↓

Apply
```

---

# Що всередині ZIP?

Confluence HTML export приблизно виглядає так

```
space.zip

├── index.html
├── Login.html
├── Registration.html
├── Dashboard.html
├── images/
├── attachments/
├── styles/
└── ...
```

Нас цікавлять лише

```
*.html
```

---

# ZIP Extractor

Я б зробив окремий сервіс

```ts
ArchiveReader

↓

read()

↓

Document[]
```

Наприклад

```ts
interface ArchiveDocument {

filename: string;

path: string;

html: string;
}
```

---

Після цього

```
for each document

↓

ConfluenceParser

↓

ImportObjects
```

---

# Merge

Приклад

```
Login.html

↓

34 keys

Registration.html

↓

76 keys

Dashboard.html

↓

210 keys
```

↓

```
ImportDocument

↓

320 keys
```

---

# Preview

Показати

```
Archive

47 Pages

-------------------

Login

34 keys

Registration

76 keys

Dashboard

210 keys

...
```

Користувач може навіть вимкнути

```
☑ Login

☑ Registration

☐ Legacy

☑ Dashboard
```

---

# Які бібліотеки?

NestJS

Я б використовував

```
unzipper
```

або

```
adm-zip
```

але мені більше подобається

```
unzipper
```

бо він працює як stream.

```
ZIP

↓

stream

↓

entry

↓

parser
```

не потрібно тримати весь ZIP у пам'яті.

---

# Архітектура

```
ArchiveReader

↓

HtmlDocument

↓

ConfluenceParser

↓

ImportObject

↓

Validator

↓

PreviewBuilder

↓

Importer
```

---

# А якщо завтра буде DOCX?

Нічого не змінюється.

```
ArchiveReader

↓

DocxReader

↓

Document

↓

Parser
```

---

# Те саме для Markdown

```
ZIP

↓

*.md

↓

Markdown Parser

↓

Import
```

---

# Я б навіть ввів поняття Reader

```
ImportSource

↓

Reader

↓

Document

↓

Parser

↓

Objects
```

Reader відповідає лише за читання.

Parser — лише за аналіз.

---

# Важливий момент

Я б НЕ парсив HTML одразу після unzip.

Я б спочатку побудував

```
Document Graph
```

```
ZIP

↓

Pages

↓

Metadata

↓

Title

↓

Parent

↓

Children

↓

HTML
```

Наприклад

```
Login

↓

Children

Forgot Password

Reset Password
```

Бо потім це можна буде використовувати як

* scope
* category
* tags
* breadcrumbs

---

# Як я думаю це має працювати в майбутньому

Я б узагалі приховав поняття ZIP.

Для користувача було б просто:

```
Import Documentation

↓

Drop here
```

І далі система сама визначає:

```
✓ Confluence Space ZIP

✓ Confluence HTML

✓ Excel

✓ CSV

✓ Markdown

✓ JSON

✓ Localization Package
```

Тобто визначення формату (`magic bytes`, структура архіву, характерні файли) відбувається автоматично.

---

## Але є одна проблема

І тут я б **не починав писати код**, поки не отримав **реальний ZIP від Wiz**.

Це найважливіша порада.

Confluence має багато варіантів експорту:

* HTML Space Export
* Single Page HTML
* Word Export (`.docx`)
* PDF
* XML Backup (для адміністраторів)
* різні версії Cloud і Data Center можуть генерувати трохи іншу структуру

Я б попросив у клієнта **2–3 реальні експорти** (анонімізовані, якщо потрібно) і вже під них написав `ConfluenceReader`. Це зменшить ризик того, що ти реалізуєш парсер під одну структуру ZIP, а у клієнта виявиться зовсім інша. Саме з цих реальних файлів варто зробити fixtures для unit та e2e тестів. Це, мабуть, найважливіший технічний крок перед початком імплементації.
