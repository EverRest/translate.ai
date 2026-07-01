-- CreateTable
CREATE TABLE "tenant_atlassian_oauth_apps" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret_enc" TEXT NOT NULL,
    "redirect_uri" TEXT,
    "scopes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_atlassian_oauth_apps_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "confluence_sync_configs" ADD COLUMN "sync_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "confluence_sync_configs" ADD COLUMN "sync_interval_minutes" INTEGER;
ALTER TABLE "confluence_sync_configs" ADD COLUMN "next_sync_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_atlassian_oauth_apps_tenant_id_key" ON "tenant_atlassian_oauth_apps"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_atlassian_oauth_apps" ADD CONSTRAINT "tenant_atlassian_oauth_apps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
