-- CreateTable
CREATE TABLE "entity_collections" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_collections_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "localization_objects" ADD COLUMN "collection_id" UUID;

-- CreateIndex
CREATE INDEX "entity_collections_project_id_idx" ON "entity_collections"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_collections_project_id_slug_key" ON "entity_collections"("project_id", "slug");

-- CreateIndex
CREATE INDEX "localization_objects_project_id_collection_id_idx" ON "localization_objects"("project_id", "collection_id");

-- AddForeignKey
ALTER TABLE "entity_collections" ADD CONSTRAINT "entity_collections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_objects" ADD CONSTRAINT "localization_objects_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "entity_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default "General" collection per project
INSERT INTO "entity_collections" ("id", "project_id", "slug", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'general', 'General', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "projects";

-- Assign existing entities to General
UPDATE "localization_objects" AS lo
SET "collection_id" = ec."id"
FROM "entity_collections" AS ec
WHERE ec."project_id" = lo."project_id"
  AND ec."slug" = 'general'
  AND lo."collection_id" IS NULL;
