# Confluence import fixtures

Synthetic Confluence export samples for unit and e2e tests. No live Confluence or client data.

## Files

| File | Purpose |
|------|---------|
| `sample.html` | Small HTML table export (Scope, Key, Default (EN), Hints) |
| `sample.csv` | Same rows as CSV |
| `sample.zip` | ZIP with two HTML pages (`page-a.html`, `page-b.html`) |
| `large-demo.csv` | 850 keys for perf/demo e2e (≥800 rows) |

## Table format (Wiz-style)

```text
Scope | Key | Default (EN) | Hints
```

Hints containing `%%…%%` should produce `strictPlaceholders: true` in `TranslationKey.context`.

## Regenerate large fixture

```bash
node backend/test/fixtures/confluence/generate-large-demo.mjs
```
