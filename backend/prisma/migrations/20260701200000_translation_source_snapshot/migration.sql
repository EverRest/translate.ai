-- AlterTable
ALTER TABLE "translations" ADD COLUMN "source_text_snapshot" TEXT;

-- Backfill: assume existing translations match current key source text
UPDATE "translations" AS t
SET "source_text_snapshot" = tk."source_text"
FROM "translation_keys" AS tk
WHERE t."translation_key_id" = tk."id"
  AND t."value" IS NOT NULL
  AND TRIM(t."value") <> '';
