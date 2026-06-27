# Issues

Tracked problems, investigations, and decisions for translate.ai.

Use this folder for issues that are not yet (or not worth) a GitHub ticket — especially local dev pain, architecture trade-offs, and “how should we develop this?” discussions.

## Format

**Filename** = `{number}-{descriptive-slug}.md`

The slug should match the **Problem** section (what happens, under what conditions). Keep it readable in file listings — no cryptic abbreviations.

**Metadata** (status, date, area, labels) lives **inside** the issue file (HTML comment block under the title), not in the filename.

```text
issues/
├── README.md
├── 001-docker-compose-full-stack-with-ollama-7b-models-freezes-host-out-of-ram.md
└── ...
```

Suggested body sections: **Problem**, **Context**, **Options**, **Recommendation**, **Follow-ups**, **Decision log**.

## Index

| ID | File | Status |
|----|------|--------|
| 001 | [docker-compose-full-stack-with-ollama-7b-models-freezes-host-out-of-ram](./001-docker-compose-full-stack-with-ollama-7b-models-freezes-host-out-of-ram.md) | Open — discussion |
