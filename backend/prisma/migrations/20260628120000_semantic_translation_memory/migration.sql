CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "translation_memory"
ADD COLUMN "embedding" vector(768),
ADD COLUMN "embedded_at" TIMESTAMP(3);

CREATE TYPE "MemoryHitType" AS ENUM ('exact', 'semantic');

CREATE TABLE "translation_memory_hits" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID,
    "job_id" UUID,
    "job_item_id" UUID,
    "hit_type" "MemoryHitType" NOT NULL,
    "source_lang" VARCHAR(5) NOT NULL,
    "target_lang" VARCHAR(5) NOT NULL,
    "similarity" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_memory_hits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "translation_memory_hits_tenant_id_created_at_idx"
ON "translation_memory_hits"("tenant_id", "created_at");

CREATE INDEX "translation_memory_hits_tenant_id_project_id_created_at_idx"
ON "translation_memory_hits"("tenant_id", "project_id", "created_at");

ALTER TABLE "translation_memory_hits"
ADD CONSTRAINT "translation_memory_hits_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "translation_memory_embedding_hnsw_idx"
ON "translation_memory"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;
