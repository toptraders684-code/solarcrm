-- UserActivityLog table: captures every authenticated API action + login/logout events

DROP TABLE IF EXISTS "user_activity_logs";

CREATE TABLE "user_activity_logs" (
  "id"          TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id"     TEXT,
  "company_id"  TEXT,
  "action"      VARCHAR(100) NOT NULL,
  "module"      VARCHAR(50),
  "entity_id"   VARCHAR(100),
  "ip_address"  VARCHAR(45),
  "user_agent"  VARCHAR(500),
  "method"      VARCHAR(10),
  "path"        VARCHAR(300),
  "status_code" INTEGER,
  "description" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- FK to users (nullable)
ALTER TABLE "user_activity_logs"
  ADD CONSTRAINT "user_activity_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_activity_log_user"         ON "user_activity_logs"("user_id");
CREATE INDEX "idx_activity_log_company_date" ON "user_activity_logs"("company_id", "created_at" DESC);
CREATE INDEX "idx_activity_log_date"         ON "user_activity_logs"("created_at" DESC);
