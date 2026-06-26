#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

copy_if_missing() {
  local src="$1"
  local dest="$2"

  if [[ -f "$dest" ]]; then
    echo "skip  $dest (already exists)"
    return
  fi

  cp "$src" "$dest"
  echo "create $dest from $(basename "$src")"
}

copy_if_missing "$ROOT/backend/.env.docker" "$ROOT/backend/.env"
copy_if_missing "$ROOT/frontend/.env.docker" "$ROOT/frontend/.env"

echo
echo "Docker env files are ready."
echo "  backend/.env   — API + worker"
echo "  frontend/.env  — Vite dev server in Docker"
echo
echo "Start stack:  docker compose up -d --build"
echo "Admin login:  admin@translate.ai / admin123 (override via ADMIN_* in backend/.env)"
