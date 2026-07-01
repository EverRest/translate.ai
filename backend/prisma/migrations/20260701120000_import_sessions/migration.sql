-- CreateEnum
CREATE TYPE "ImportSessionStatus" AS ENUM ('pending', 'parsing', 'preview_ready', 'applying', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ImportSessionItemAction" AS ENUM ('create', 'update', 'unchanged', 'conflict', 'invalid', 'skip');

-- CreateTable
CREATE TABLE "import_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source_type" VARCHAR(40) NOT NULL,
    "status" "ImportSessionStatus" NOT NULL DEFAULT 'pending',
    "stats_json" JSONB,
    "warnings_json" JSONB,
    "diff_summary_json" JSONB,
    "parse_rules_json" JSONB,
    "storage_path" TEXT,
    "original_filename" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_session_items" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "external_source" VARCHAR(40),
    "external_id" TEXT,
    "scope" TEXT,
    "key" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "hints" TEXT,
    "action" "ImportSessionItemAction" NOT NULL DEFAULT 'create',
    "error" TEXT,
    "warning" TEXT,
    "translation_key_id" UUID,
    "before_json" JSONB,
    "after_json" JSONB,

    CONSTRAINT "import_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_sessions_tenant_id_created_at_idx" ON "import_sessions"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "import_sessions_project_id_created_at_idx" ON "import_sessions"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "import_session_items_session_id_action_idx" ON "import_session_items"("session_id", "action");

-- CreateIndex
CREATE INDEX "import_session_items_session_id_key_idx" ON "import_session_items"("session_id", "key");

-- AddForeignKey
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_session_items" ADD CONSTRAINT "import_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "import_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
