CREATE TYPE "KnowledgeSourceType" AS ENUM ('text', 'markdown', 'file');

CREATE TYPE "KnowledgeSourceStatus" AS ENUM ('pending', 'ready', 'failed');

CREATE TABLE "project_knowledge_sources" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "source_type" "KnowledgeSourceType" NOT NULL,
    "status" "KnowledgeSourceStatus" NOT NULL DEFAULT 'pending',
    "raw_content" TEXT NOT NULL,
    "original_filename" TEXT,
    "byte_size" INTEGER NOT NULL DEFAULT 0,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_knowledge_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_knowledge_chunks" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "char_start" INTEGER NOT NULL,
    "char_end" INTEGER NOT NULL,
    "token_estimate" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(768),
    "embedded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_knowledge_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_knowledge_sources_project_id_status_idx"
ON "project_knowledge_sources"("project_id", "status");

CREATE INDEX "project_knowledge_chunks_source_id_chunk_index_idx"
ON "project_knowledge_chunks"("source_id", "chunk_index");

CREATE INDEX "project_knowledge_chunks_project_id_idx"
ON "project_knowledge_chunks"("project_id");

CREATE INDEX "project_knowledge_chunks_embedding_hnsw_idx"
ON "project_knowledge_chunks"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;

ALTER TABLE "project_knowledge_sources"
ADD CONSTRAINT "project_knowledge_sources_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_knowledge_chunks"
ADD CONSTRAINT "project_knowledge_chunks_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "project_knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_knowledge_chunks"
ADD CONSTRAINT "project_knowledge_chunks_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
