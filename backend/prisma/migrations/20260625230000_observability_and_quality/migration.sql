-- CreateEnum
CREATE TYPE "QualityMetricSource" AS ENUM ('review', 'manual', 'job_completion', 'editor');

-- CreateEnum
CREATE TYPE "QualityVerdict" AS ENUM ('accurate', 'needs_edit', 'inaccurate');

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID,
    "job_id" UUID,
    "job_item_id" UUID,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "used_fallback" BOOLEAN NOT NULL DEFAULT false,
    "primary_provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_request_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_quality_metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "translation_id" UUID NOT NULL,
    "job_id" UUID,
    "job_item_id" UUID,
    "provider" TEXT,
    "language" VARCHAR(5) NOT NULL,
    "translation_key" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "ai_value" TEXT NOT NULL,
    "reference_value" TEXT,
    "score" DECIMAL(5,4) NOT NULL,
    "source" "QualityMetricSource" NOT NULL,
    "verdict" "QualityVerdict",
    "notes" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_quality_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_logs_tenant_id_created_at_idx" ON "ai_usage_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_project_id_created_at_idx" ON "ai_usage_logs"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_tenant_id_created_at_idx" ON "api_request_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_created_at_idx" ON "api_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "translation_quality_metrics_tenant_id_created_at_idx" ON "translation_quality_metrics"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "translation_quality_metrics_project_id_created_at_idx" ON "translation_quality_metrics"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "translation_quality_metrics_translation_id_created_at_idx" ON "translation_quality_metrics"("translation_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_quality_metrics" ADD CONSTRAINT "translation_quality_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_quality_metrics" ADD CONSTRAINT "translation_quality_metrics_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
