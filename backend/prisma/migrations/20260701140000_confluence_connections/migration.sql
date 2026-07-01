-- CreateTable
CREATE TABLE "confluence_connections" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "cloud_id" TEXT NOT NULL,
    "site_url" TEXT NOT NULL,
    "site_name" TEXT,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" TEXT,
    "connected_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "confluence_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confluence_sync_configs" (
    "id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "page_ids" TEXT[],
    "space_key" VARCHAR(50),
    "label_filter" TEXT,
    "parse_rules_json" JSONB,
    "auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "last_synced_at" TIMESTAMP(3),
    "last_sync_status" VARCHAR(20),
    "last_sync_summary_json" JSONB,
    "last_import_session_id" UUID,
    "last_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "confluence_sync_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "confluence_connections_project_id_key" ON "confluence_connections"("project_id");

-- CreateIndex
CREATE INDEX "confluence_connections_tenant_id_idx" ON "confluence_connections"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "confluence_sync_configs_connection_id_key" ON "confluence_sync_configs"("connection_id");

-- AddForeignKey
ALTER TABLE "confluence_connections" ADD CONSTRAINT "confluence_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confluence_connections" ADD CONSTRAINT "confluence_connections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confluence_connections" ADD CONSTRAINT "confluence_connections_connected_by_id_fkey" FOREIGN KEY ("connected_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confluence_sync_configs" ADD CONSTRAINT "confluence_sync_configs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "confluence_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
