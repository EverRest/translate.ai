-- AlterEnum
ALTER TYPE "ImportSessionStatus" ADD VALUE 'translating';
ALTER TYPE "ImportSessionStatus" ADD VALUE 'composing';
ALTER TYPE "ImportSessionStatus" ADD VALUE 'download_ready';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "excel_import_profile" JSONB;

-- AlterTable
ALTER TABLE "import_sessions" ADD COLUMN "output_storage_path" TEXT,
ADD COLUMN "translation_job_id" UUID,
ADD COLUMN "excel_layout_json" JSONB;

-- CreateIndex
CREATE INDEX "import_sessions_translation_job_id_idx" ON "import_sessions"("translation_job_id");
