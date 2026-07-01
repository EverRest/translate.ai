Я б робив це у **3 етапи**, щоб максимально швидко отримати демо і не впертися в Atlassian.

---

# Phase 1 — Upload export file (MVP) ⭐

Це те, що я зробив би першим.

Користувач у Confluence:

```
Export

↓

HTML

або

Word

або

CSV
```

Потім

```
translate.ai

↓

Import

↓

Upload file

↓

Preview

↓

Import
```

### Чому?

✅ Не потрібен OAuth

✅ Не потрібна Atlassian App

✅ Не потрібно чекати review

✅ Працює у будь-якого клієнта

✅ Можна зробити за 2–3 дні

Для демо цього більш ніж достатньо.

---

# Phase 2 — Paste HTML

Ще одна цікава можливість.

Користувач відкриває Confluence.

```
Ctrl+A

Ctrl+C
```

↓

У тебе

```
Paste
```

↓

HTML автоматично потрапляє в браузер.

React отримує

```ts
clipboardData.getData("text/html")
```

або

```ts
text/plain
```

і відправляє на бек.

---

Це дуже прикольно працює.

Наприклад Excel теж вставляється таким способом.

---

UI

```
Import

-----------------------

Drop file

OR

Paste from Confluence

```

Натиснув

```
Ctrl+V
```

↓

готово.

---

# Phase 3 — Live Connection ⭐⭐⭐

Тільки після цього.

```
Settings

↓

Integrations

↓

Confluence

↓

Connect
```

OAuth

↓

Select Space

↓

Select Pages

↓

Sync

↓

Done

```

---

На бекенді

```

BullMQ

↓

Get Pages

↓

HTML

↓

Parser

↓

Preview

↓

Import

```

---

# Чому не починати з API?

Бо Atlassian API має купу нюансів.

Потрібно

- OAuth
- Refresh token
- Permissions
- Scopes
- Rate limits
- Pagination
- API version
- Cloud vs Server

І це займає дуже багато часу.

---

# Я б ще додав

## Import URL

Користувач вставляє

```

[https://company.atlassian.net/wiki/](https://company.atlassian.net/wiki/)...

```

↓

Backend

```

Detect

↓

"You are not connected"

↓

Connect

↓

Import

```

---

# Або

Якщо сторінка публічна

```

Fetch HTML

↓

Parse

↓

Done

```

---

# Або навіть Markdown

Confluence підтримує

```

Export Markdown

```

↓

Markdown Parser

↓

Import

---

# Моя рекомендація

Я б реалізував підтримку **кількох джерел** з єдиним UX:

| Спосіб | Складність | Цінність | Робити? |
|---------|-----------:|---------:|:--------:|
| 📄 Upload HTML/Word export/Zip from Confluence | ⭐ | ⭐⭐⭐⭐⭐ | ✅ Першим |
| 📋 Copy/Paste із Confluence | ⭐⭐ | ⭐⭐⭐⭐ | ✅ Одразу після upload |
| 📑 Upload CSV | ⭐ | ⭐⭐⭐ | ✅ Якщо клієнт використовує |
| 🔗 Import by URL | ⭐⭐⭐ | ⭐⭐⭐⭐ | 🟡 Пізніше |
| 🔐 OAuth + Live Sync | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Enterprise (Phase 2) |

## Я б навіть змінив UI

Замість кнопки **"Confluence Import"** зробив би універсальний екран:

```

Import from...

────────────────────────

📄 Upload Export File

📋 Paste from Confluence

🔗 Import by URL

🔐 Connect Confluence

```

Усі чотири варіанти використовують **один і той самий бекенд-пайплайн** (`Parser → Preview → Diff → Apply`), відрізняється лише **Source Adapter**, який постачає HTML або табличні дані в систему. Це дає дуже чисту архітектуру і спрощує підтримку нових джерел у майбутньому.
```
