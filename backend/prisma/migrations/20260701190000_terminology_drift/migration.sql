-- CreateEnum
CREATE TYPE "TerminologyDriftIssueStatus" AS ENUM ('open', 'resolved');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "auto_terminology_scan" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "terminology_drift_issues" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "source_term" TEXT NOT NULL,
    "target_lang" VARCHAR(5) NOT NULL,
    "variants" JSONB NOT NULL,
    "status" "TerminologyDriftIssueStatus" NOT NULL DEFAULT 'open',
    "canonical_translation" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "terminology_drift_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terminology_drift_issues_project_id_status_idx" ON "terminology_drift_issues"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "terminology_drift_issues_project_id_source_term_target_lang_key" ON "terminology_drift_issues"("project_id", "source_term", "target_lang");

-- AddForeignKey
ALTER TABLE "terminology_drift_issues" ADD CONSTRAINT "terminology_drift_issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
