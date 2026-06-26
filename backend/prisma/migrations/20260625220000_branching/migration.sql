-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('active', 'merged', 'archived');

-- CreateTable
CREATE TABLE "project_branches" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "BranchStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "merged_at" TIMESTAMP(3),

    CONSTRAINT "project_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_translations" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "translation_key_id" UUID NOT NULL,
    "language" VARCHAR(5) NOT NULL,
    "value" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'draft',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_branches_project_id_idx" ON "project_branches"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_branches_project_id_name_key" ON "project_branches"("project_id", "name");

-- CreateIndex
CREATE INDEX "branch_translations_branch_id_idx" ON "branch_translations"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_translations_branch_id_translation_key_id_language_key" ON "branch_translations"("branch_id", "translation_key_id", "language");

-- AddForeignKey
ALTER TABLE "project_branches" ADD CONSTRAINT "project_branches_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_translations" ADD CONSTRAINT "branch_translations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "project_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_translations" ADD CONSTRAINT "branch_translations_translation_key_id_fkey" FOREIGN KEY ("translation_key_id") REFERENCES "translation_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
