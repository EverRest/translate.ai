#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Backend checks"
make -C "$ROOT" install-backend
(
  cd backend
  export DATABASE_URL="${DATABASE_URL:-postgresql://translate:translate@localhost:5432/translate_ai?schema=public}"
  export REDIS_HOST="${REDIS_HOST:-localhost}"
  export REDIS_PORT="${REDIS_PORT:-6379}"
  export JWT_SECRET="${JWT_SECRET:-ci-test-secret}"
  export NODE_ENV=test
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run lint:check
  npm run format:check
  npm run typecheck
  npm run build
  npm test -- --coverage --passWithNoTests
  npm run test:e2e
)

echo "==> Frontend checks"
make -C "$ROOT" install-frontend
(
  cd frontend
  npm run lint:check
  npm run format:check
  npm run typecheck
  npm test
  npm run build
)

echo "==> Frontend Playwright e2e"
bash "$ROOT/scripts/e2e-frontend.sh"

echo "All local CI checks passed."
