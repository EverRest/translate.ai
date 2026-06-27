-- Prisma upsert on translation_memory uses @@unique([tenant_id, hash]).
-- Phase-1 migration only created a non-unique index, causing upsert failures (SQLSTATE 42P10).

DROP INDEX IF EXISTS "translation_memory_tenant_id_hash_idx";

CREATE UNIQUE INDEX "translation_memory_tenant_id_hash_key"
  ON "translation_memory"("tenant_id", "hash");
