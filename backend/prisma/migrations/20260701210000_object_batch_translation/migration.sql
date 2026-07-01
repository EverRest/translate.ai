-- CreateEnum
CREATE TYPE "translation_job_mode" AS ENUM ('standard', 'object_batch');

-- AlterTable
ALTER TABLE "translation_jobs" ADD COLUMN "mode" "translation_job_mode" NOT NULL DEFAULT 'standard';
ALTER TABLE "translation_jobs" ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "translation_job_items" ADD COLUMN "batch_group_id" UUID;
