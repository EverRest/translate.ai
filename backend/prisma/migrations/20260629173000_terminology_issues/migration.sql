-- Terminology drift issues (P2-05)
CREATE TYPE "TerminologyIssueStatus" AS ENUM ('open', 'resolved', 'dismissed');
CREATE TYPE "TerminologyIssueSeverity" AS ENUM ('low', 'medium', 'high');

CREATE TABLE "terminology_issues" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "source_term" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "TerminologyIssueStatus" NOT NULL DEFAULT 'open',
    "variants" JSONB NOT NULL,
    "severity" "TerminologyIssueSeverity" NOT NULL DEFAULT 'medium',
    "scan_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "terminology_issues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "terminology_issues_project_id_status_idx" ON "terminology_issues"("project_id", "status");
CREATE INDEX "terminology_issues_project_id_source_term_idx" ON "terminology_issues"("project_id", "source_term");

ALTER TABLE "terminology_issues" ADD CONSTRAINT "terminology_issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
