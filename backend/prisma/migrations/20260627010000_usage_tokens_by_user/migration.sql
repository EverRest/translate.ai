-- Tenant subscription fields
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan_status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_since" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "monthly_token_quota" INTEGER;

UPDATE "tenants"
SET "subscription_since" = "created_at"
WHERE "subscription_since" IS NULL;

-- Job creator for usage attribution
ALTER TABLE "translation_jobs" ADD COLUMN IF NOT EXISTS "created_by_id" UUID;
CREATE INDEX IF NOT EXISTS "translation_jobs_created_by_id_idx" ON "translation_jobs"("created_by_id");
ALTER TABLE "translation_jobs" DROP CONSTRAINT IF EXISTS "translation_jobs_created_by_id_fkey";
ALTER TABLE "translation_jobs" ADD CONSTRAINT "translation_jobs_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AI usage per user
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "user_id" UUID;
CREATE INDEX IF NOT EXISTS "ai_usage_logs_tenant_id_user_id_created_at_idx"
  ON "ai_usage_logs"("tenant_id", "user_id", "created_at");
CREATE INDEX IF NOT EXISTS "ai_usage_logs_tenant_id_model_created_at_idx"
  ON "ai_usage_logs"("tenant_id", "model", "created_at");
ALTER TABLE "ai_usage_logs" DROP CONSTRAINT IF EXISTS "ai_usage_logs_user_id_fkey";
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
