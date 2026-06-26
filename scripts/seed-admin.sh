#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"

export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@translate.ai}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
export ADMIN_TENANT_NAME="${ADMIN_TENANT_NAME:-Default}"

if [[ -f "$BACKEND/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$BACKEND/.env"
  set +a
fi

echo "==> Seeding admin user"
echo "    tenant : ${ADMIN_TENANT_NAME}"
echo "    email  : ${ADMIN_EMAIL}"

(cd "$BACKEND" && npx prisma db seed)

echo "==> Done. Log in with the email and password above."
