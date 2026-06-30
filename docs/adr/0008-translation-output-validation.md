# ADR 0008: Translation output validation

## Status

Accepted

## Context

AI providers sometimes return refusals, meta-replies, wrong-language output, or text identical to the source. The job runner previously accepted any non-throwing response.

## Decision

Add a synchronous **heuristic validator** after translation (before saving draft):

- Empty / quote-only output
- Refusal and meta phrases
- Identical to source when languages differ
- Absurd length ratio vs source
- Unexpected script for target language

After heuristics pass, run a **QA validator chain** (`translation/application/validators/`):

- **PlaceholderValidator** — `{{...}}` and `%%...%%` tokens in output must match source exactly (count + text)
- **HtmlTagBalanceValidator** — when source contains HTML tags, output tag stack must be balanced

On failure, retry up to **3 attempts** in-process with `skipMemory` and a retry hint in the prompt. After exhaustion, mark the job item failed with a validation message naming the failing validator (e.g. `PlaceholderValidator: missing placeholder {{name}}`).

Feature flags:

- `TRANSLATION_VALIDATION_ENABLED` (default `true`) — heuristic checks
- `TRANSLATION_QA_VALIDATORS_ENABLED` (default `true`) — placeholder/HTML QA chain only

## Consequences

- Better output quality without a second LLM call
- Up to 3× provider cost on repeated validation failures
- `job.failed` webhooks include `failedItems` and `failures` summary
- Manual **Retranslate** remains available from Approvals

## Alternatives considered

- LLM-as-judge: rejected for cost/latency in v1
- BullMQ-level retries only: does not catch syntactically valid bad output
