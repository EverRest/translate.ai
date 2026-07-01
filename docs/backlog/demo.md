# Client Feature Ideas — FIFA / WIZ Context

> **Status:** Prioritized → see [fifa-wiz/](demo/README.md)

Raw input captured below. EverRest review comments (Jun 2026) applied in prioritized backlog files (`P0-01` … `P0-D09`, `P0-S01` …).

---

## Raw ideas (archived)

## 1. Context-Aware Translation (must have)
AI видит что это объект (например филд) и переводит все пачкой для филда Label/Placeholder/Error в едином тоне, не как словарь. Разница видна прямо на экране.

Выбрал 50 Fields, нажал Translate All → AI идёт по каждому объекту сохраняя структуру. Прогресс-бар по объектам, не по ключам.

→ [P0-05](demo/P0-05-context-aware-object-translation.md) (partial: P3-12 shipped)

## 4. Consistency Check
После перевода AI проверяет что одно и то же слово переведено одинаково по всем Fields (например "Submit" везде "Envoyer", а не "Soumettre" в одном месте).

→ [P0-07](demo/P0-07-consistency-check.md) — Wave 1 shipped (auto drift scan, grid hints); EverRest: glossary + drift, not standalone AI

## 5. Confluence Import (must have)
→ [P0-03](demo/P0-03-documentation-import) — shipped (file import + OAuth live sync)

## 6. Translation Coverage Heatmap
→ [P0-06](demo/P0-06-translation-coverage-heatmap.md)

## 8. New Keys Alert
→ [P0-11](demo/P0-11-new-keys-alert.md) — conditional

## 9. Sport-Domain AI Context (must have)
→ [P0-01](demo/P0-01-sport-domain-ai-context.md) — shipped (`domainProfile`, presets API, copy-settings, FIFA glossary, Domain context UI, post-create onboarding)

## 10. Excel Round-Trip Compatibility (must have)
→ [P0-02](demo/P0-02-excel-delta-import.md)

## 11. Placeholder Protection (must have)
→ [P0-S02](demo/P0-S02-placeholder-protection.md) — shipped (validator + job summary metric)

## 12. Stale Translation Detection (must have)
→ [P0-04](demo/P0-04-stale-translation-detection.md)

## 13. Translation Inheritance Between Events
→ [P0-08](demo/P0-08-translation-inheritance.md)

## 14. Glossary / Translation Memory (must have)
→ [P0-S01](demo/P0-S01-glossary-platform.md) — shipped

## 15–16, 19–22, 24–27, 29
See [fifa-wiz/README.md](demo/README.md) deferred and shipped sections.

---

## EverRest comment summary

| # | Decision |
|---|----------|
| 4 | Postponed → glossaries + post-validation |
| 5 | Killer feature |
| 6 | Liked from UX |
| 9 | Easy win; will be done |
| 11 | Ok |
| 14 | Implementation ready; improvements later |
| 17 | Planned (merged with #10 → P0-02) |
| 19 | Postponed — horizontal scaling |
| 20 | Agree — expensive |
| 25 | Doable — extra models/controller |
| 26 | Not MVP |
| 27 | Postponed next iteration |
| 28 | Added to backlog |
| 29 | Killer demo feature |
