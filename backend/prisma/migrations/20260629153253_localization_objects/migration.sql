-- CreateEnum
CREATE TYPE "LocalizationTemplateType" AS ENUM ('form', 'page', 'modal', 'email', 'api', 'custom');

-- CreateEnum
CREATE TYPE "LocalizationObjectStatus" AS ENUM ('draft', 'materialized');

-- CreateEnum
CREATE TYPE "LocalizationNodeType" AS ENUM ('section', 'field', 'button', 'label', 'placeholder', 'hint', 'validation', 'error', 'success', 'tooltip', 'email_subject', 'email_body', 'notification', 'text');

-- AlterTable
ALTER TABLE "translation_keys" ADD COLUMN     "localization_object_id" UUID;

-- CreateTable
CREATE TABLE "localization_objects" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_type" "LocalizationTemplateType" NOT NULL DEFAULT 'custom',
    "status" "LocalizationObjectStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localization_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localization_nodes" (
    "id" UUID NOT NULL,
    "object_id" UUID NOT NULL,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "node_type" "LocalizationNodeType" NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT,
    "source_text" TEXT,
    "description" TEXT,
    "context" TEXT,
    "content_type" VARCHAR(20),
    "translation_key_id" UUID,

    CONSTRAINT "localization_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "localization_objects_project_id_idx" ON "localization_objects"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "localization_objects_project_id_slug_key" ON "localization_objects"("project_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "localization_nodes_translation_key_id_key" ON "localization_nodes"("translation_key_id");

-- CreateIndex
CREATE INDEX "localization_nodes_object_id_parent_id_sort_order_idx" ON "localization_nodes"("object_id", "parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "translation_keys_localization_object_id_idx" ON "translation_keys"("localization_object_id");

-- CreateIndex
CREATE INDEX "translation_memory_tenant_id_hash_idx" ON "translation_memory"("tenant_id", "hash");

-- AddForeignKey
ALTER TABLE "translation_keys" ADD CONSTRAINT "translation_keys_localization_object_id_fkey" FOREIGN KEY ("localization_object_id") REFERENCES "localization_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_objects" ADD CONSTRAINT "localization_objects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_nodes" ADD CONSTRAINT "localization_nodes_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "localization_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_nodes" ADD CONSTRAINT "localization_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "localization_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_nodes" ADD CONSTRAINT "localization_nodes_translation_key_id_fkey" FOREIGN KEY ("translation_key_id") REFERENCES "translation_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
