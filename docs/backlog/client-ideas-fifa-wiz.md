# Client Feature Ideas — FIFA / WIZ Context
> Status: RAW — needs filtering and prioritisation

---

## 1. Context-Aware Translation (must have)
AI видит что это объект (например филд) и переводит все пачкой для филда Label/Placeholder/Error в едином тоне, не как словарь. Разница видна прямо на экране.

Выбрал 50 Fields, нажал Translate All → AI идёт по каждому объекту сохраняя структуру. Прогресс-бар по объектам, не по ключам.

## 4. Consistency Check
После перевода AI проверяет что одно и то же слово переведено одинаково по всем Fields (например "Submit" везде "Envoyer", а не "Soumettre" в одном месте).
---

## 5. Confluence Import (must have)
Для BMA/PMA приложений в данный момент Wiz-team разработчики хранят ключи переводов прямо в Confluence-страницах (BMA/PMA/SEQ). translate.ai коннектится к их Confluence, парсит scope/key/value структуру и автоматически импортирует всё в проект.  
**Demo hook**: "подключили Confluence — за 10 секунд подтянули 847 ключей". Либо без подключения експорт в файл и импорт в translation.ai

## 6. Translation Coverage Heatmap
Репорт - Матрица scope × language с живым прогрессом — зелёный/жёлтый/красный по каждой ячейке. + Статусы и % прогресса перевода для каждого языка и для всех переводов ивента.
**Use case**: перед запуском события надо знать что FR 40% done в Interface Elements и event goes live через 3 дня.

## 8. New Keys Alert (только при интеграции стратических переводов под UI элементы) - под вопросом
В Evo Core каждый релиз девы добавляют новые Interface Element ключи. translate.ai сравнивает с предыдущей версией и автоматически детектирует новые непереведённые ключи.  
**Example**: "После релиза v2.1 появилось 23 новых ключа, переведено 0%".

## 9. Sport-Domain AI Context (must have)
При переводе AI знает: "это форма аккредитации FIFA World Cup, формальный тон, спортивная терминология". На демо — generic AI vs contextual AI — разница в качестве очевидна. Особенно для FR/ES где официальная FIFA терминология очень специфична.

## 10. Excel Round-Trip Compatibility (must have)
Текущий workflow клиента: Export Excel → переводим вручную → Import Excel с Field ID колонкой. translate.ai принимает их экспорт, переводит AI'ом, отдаёт готовый файл для импорта обратно в их систему без изменения формата. Нулевое трение для adoption.

---

## 11. Placeholder Protection (must have) - но есть вопросы по переводам email templates и GDPR
В их Confluence написано в Hints: "%%PLACEHOLDER%% must be kept as-is — never translate". translate.ai автоматически детектирует и лочит их во время AI перевода.  
**Demo hook**: "AI обработал 847 ключей и сохранил 134 плейсхолдера нетронутыми".

## 12. Stale Translation Detection (must have)
BA поменял Label поля с "First Name" на "Given Name" в default language — все 24 языковых перевода этого поля автоматически получают статус "needs review". Сейчас это никак не трекается, и переводы тихо устаревают.

## 13. Translation Inheritance Between Events
FIFA MC26 → FIFA WWC27. Копируешь все одобренные переводы, translate.ai показывает только diff — новые ключи и изменённые. Вместо перевода 2000 ключей с нуля — 150 новых/изменённых.

## 14. Glossary / Translation Memory (must have) - это уже вроде запланировано
"Accreditation", "Venue", "Privilege", "Registration Group" — должны переводиться одинаково везде и всегда. Глоссарий на уровне клиента: AI сначала проверяет глоссарий, потом переводит. Гарантирует консистентность терминологии не только внутри события но и между ними.

---

## 15. External Reviewer Link (for future)
FIFA присылает своего официального переводчика для проверки FR перевода. Shareable link с конкретным языком/scope, только read + approve/reject. Translator видит source + AI translation + поле для комментария. Без аккаунта в системе.

## 16. AI Confidence Score + Auto-Approve Threshold (for future)
"Cancel" → "Annuler" — 99% уверенность, автоматически approved. Юридический текст — 61%, идёт на human review. Настраиваемый порог per project. Ускоряет работу для простых UI строк.

## 17. Delta Import from Classic (must have) - запланировали
Принимает Excel экспорт из текущей системы клиента, находит пустые ячейки (непереведённые), заполняет AI'ом, возвращает готовый файл. Нулевая migration friction.

---

## 19. Runtime Translation API - запланировали???
Вместо export/import файлов — Evo Core дёргает translate.ai API напрямую в рантайме. Переводы живут в translate.ai, обновляются без деплоя. Меняешь перевод → через 30 секунд на проде. Меняет саму архитектуру как они думают о переводах.

## 20. Back-Translation QA - интересная идея, но дорого
После AI перевода — автоматически переводишь обратно EN→FR→EN и сравниваешь с оригиналом. "Submit Registration" стало "Send Your Data" в обратном переводе — флаг, семантика потеряна. Полностью автоматизированный QA без human.

## 21. Visual Context — Screenshot as Context - на будущее для сложных случаев можно использовать
Прикрепляешь скриншот UI где живёт этот текст. AI видит: маленькая кнопка в мобильном хедере — переводит с учётом ограничения по символам и визуального контекста. "Register" в немецком не может быть "Registrieren" если кнопка 60px широкая.

## 22. Character Limit Enforcement - на будущее
Немецкий в среднем на 30% длиннее английского. AI знает лимит символов на элемент и генерирует перевод который влезает. Для мобильных лейблов — критично.

---

## 24. Brand Voice Training - покрыто glossary
Загружаешь 100 уже одобренных переводов FIFA — AI обучается на их стиле. Formal French с "vous", официальная спортивная терминология. Каждый новый перевод автоматически в нужном тоне, без дополнительных инструкций.

## 25. Locale Split - на будущее - по сути региональные варианты языков
FR-FR vs FR-CA vs FR-BE. ES-ES vs ES-MX vs ES-AR. FIFA World Cup — международная аудитория. Сейчас система думает в категориях "языков", следующий уровень — локали.

## 26. CI/CD Pipeline Integration - на будущее - твоя идея была
Разработчик пушит новый Interface Element key в git. Webhook → translate.ai автоматически переводит → создаёт PR с готовыми переводами. Переводы как часть deployment pipeline.

## 27. Multi-Model Tournament - инетерсно на будущее
Для важных переводов (email subject lines, юридические тексты) — запускаешь Gemini + GPT-4o + Claude параллельно, показываешь все три варианта. Reviewer выбирает лучший. Выбор учится, следующий раз предпочтительная модель идёт первой.

## 28. Translation Debt Dashboard - можно для демо сделать
Технический долг но для переводов: сколько ключей создано 6+ месяцев назад и до сих пор в draft. Сколько approved но не published. Сколько source изменился после перевода. Один экран — полная картина health переводов.

## 29. Live Browser Injection - можно для демо сделать!!!
Chrome extension: на staging сайте нажимаешь toggle — видишь реальный сайт с WIP переводами из translate.ai. Никакого export/import для preview. PM показывает клиенту как будет выглядеть на французском прямо в браузере.
