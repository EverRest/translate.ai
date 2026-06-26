-- CreateTable
CREATE TABLE "glossaries" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "glossaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glossary_terms" (
    "id" UUID NOT NULL,
    "glossary_id" UUID NOT NULL,
    "source_term" TEXT NOT NULL,
    "target_term" TEXT,
    "do_not_translate" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "glossary_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "glossaries_project_id_key" ON "glossaries"("project_id");

-- CreateIndex
CREATE INDEX "glossary_terms_glossary_id_idx" ON "glossary_terms"("glossary_id");

-- CreateIndex
CREATE UNIQUE INDEX "glossary_terms_glossary_id_source_term_key" ON "glossary_terms"("glossary_id", "source_term");

-- AddForeignKey
ALTER TABLE "glossaries" ADD CONSTRAINT "glossaries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glossary_terms" ADD CONSTRAINT "glossary_terms_glossary_id_fkey" FOREIGN KEY ("glossary_id") REFERENCES "glossaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
