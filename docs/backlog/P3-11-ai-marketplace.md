# P3-11 — AI marketplace (plugins)

**Phase:** 3 · **Priority:** Low · **Status:** Backlog

## Goal

Extensibility: third-party validators, providers, connectors, prompt packs — VS Code Marketplace model.

## Current state

- `AiProvider` interface — internal providers only
- `ProviderConfig` schema unused
- No plugin registry or SDK

## Proposed fit

| Layer | Change |
|-------|--------|
| **Phase A** | Internal plugin registry interface — wire `ProviderConfig` |
| **Phase B** | HTTP validator webhooks (tenant installs URL) |
| **Phase C** | npm SDK `@translate-ai/plugin-sdk` — validate, provider, connector |
| **Schema** | `project_plugins` (pluginId, config JSON, enabled) |
| **Execution** | Sandbox timeouts; tenant-scoped secrets |

### Plugin types

| Type | Hook |
|------|------|
| Validator | Post-translate in job runner |
| Provider | `AiProvider` implementation |
| Connector | VCS / CMS sync |
| Prompt pack | P2-01 templates |

## Dependencies

- P1-04 validator chain architecture
- P2-02 provider router

## Acceptance criteria

- [ ] Document plugin interface
- [ ] One reference validator plugin (placeholder check)
- [ ] Enable/disable per project in UI

## Overlap with raw.md

Item #20 — AI Marketplace.
