CREATE TYPE "GlossarySuggestionStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "glossary_suggestions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "source_term" TEXT NOT NULL,
    "target_term" TEXT,
    "do_not_translate" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "GlossarySuggestionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "glossary_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "glossary_suggestions_project_id_status_idx"
ON "glossary_suggestions"("project_id", "status");

CREATE INDEX "glossary_suggestions_project_id_source_term_idx"
ON "glossary_suggestions"("project_id", "source_term");

ALTER TABLE "glossary_suggestions"
ADD CONSTRAINT "glossary_suggestions_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
