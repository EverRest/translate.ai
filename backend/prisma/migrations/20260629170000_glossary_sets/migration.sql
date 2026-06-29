-- AlterTable: multi-glossary per project (ADR 0015)
ALTER TABLE "glossaries" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Default';
ALTER TABLE "glossaries" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "glossaries" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false;

UPDATE "glossaries"
SET "name" = 'Default', "is_default" = true, "is_active" = true;

DROP INDEX "glossaries_project_id_key";

CREATE UNIQUE INDEX "glossaries_project_id_name_key" ON "glossaries"("project_id", "name");
CREATE INDEX "glossaries_project_id_is_active_idx" ON "glossaries"("project_id", "is_active");
