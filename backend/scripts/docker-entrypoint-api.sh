#!/bin/sh
set -e

echo "==> Applying database schema"
npx prisma migrate deploy

echo "==> Seeding admin user (idempotent)"
node dist/prisma/seed.js

echo "==> Starting API"
exec node dist/src/main.js
