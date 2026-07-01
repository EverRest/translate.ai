-- CreateEnum
CREATE TYPE "LocalizationObjectGenerationStatus" AS ENUM ('idle', 'queued', 'generating', 'completed', 'failed');

-- AlterTable
ALTER TABLE "localization_objects" ADD COLUMN     "generation_error" TEXT,
ADD COLUMN     "generation_status" "LocalizationObjectGenerationStatus" NOT NULL DEFAULT 'idle';
