#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-postgresql://translate:translate@localhost:5432/translate_ai?schema=public}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export JWT_SECRET="${JWT_SECRET:-e2e-test-secret}"
export NODE_ENV="${NODE_ENV:-test}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:3000/api/v1}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:4173}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:4173,http://localhost:5173}"
export MOCK_TRANSLATIONS="${MOCK_TRANSLATIONS:-true}"

echo "==> Sync database schema"
(
  cd backend
  npx prisma generate
  npx prisma db push --accept-data-loss
)

echo "==> Build backend"
(cd backend && npm run build)

echo "==> Build frontend (VITE_API_URL=$VITE_API_URL)"
(cd frontend && VITE_API_URL="$VITE_API_URL" npm run build)

echo "==> Run Playwright"
(cd frontend && npx playwright test "$@")
