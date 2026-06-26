# Migration Notes

Prisma migrations live in `backend/prisma/migrations/`.

## First-time setup

```bash
docker compose up -d postgres redis
cp backend/.env.example backend/.env
cd backend
npm install
npx prisma migrate dev --name init
```

## Rules

- One migration per logical schema change.
- Keep migrations reversible when possible.
- No heavy data backfill in migration files — use separate scripts.
- After schema changes, update `docs/database/schema.md` in the same PR.

## Generate client

```bash
cd backend && npx prisma generate
```

Required after every schema change and before `npm run build`.

## Production

```bash
npx prisma migrate deploy
```

Run as part of deployment before starting API/worker containers.
