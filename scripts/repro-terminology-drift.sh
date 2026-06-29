#!/usr/bin/env bash
# Generate translation keys + inconsistent RU values to reproduce terminology drift.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

ARGS=()
if [[ "${CLEAN:-}" == "1" ]]; then
  ARGS+=(--clean)
fi
if [[ "${SCAN:-}" == "1" ]]; then
  ARGS+=(--persist-scan --scan-api)
fi
if [[ "${DRY_RUN:-}" == "1" ]]; then
  ARGS+=(--dry-run)
fi

if ((${#ARGS[@]} > 0)); then
  npx ts-node --transpile-only scripts/repro-terminology-drift.ts "${ARGS[@]}"
else
  npx ts-node --transpile-only scripts/repro-terminology-drift.ts
fi
