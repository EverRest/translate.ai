-- translation_keys.source_text was missing from the initial migration
ALTER TABLE "translation_keys" ADD COLUMN IF NOT EXISTS "source_text" TEXT;

UPDATE "translation_keys"
SET "source_text" = COALESCE(NULLIF("description", ''), "key")
WHERE "source_text" IS NULL;

ALTER TABLE "translation_keys" ALTER COLUMN "source_text" SET NOT NULL;
