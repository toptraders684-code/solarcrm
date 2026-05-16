-- Add project_status to applicants and create status history table

ALTER TABLE "applicants"
  ADD COLUMN "project_status" VARCHAR(50);

CREATE TABLE "project_status_history" (
  "id"            TEXT NOT NULL,
  "applicant_id"  TEXT NOT NULL,
  "status"        VARCHAR(50) NOT NULL,
  "changed_by_id" TEXT NOT NULL,
  "changed_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_status_history_applicant" ON "project_status_history"("applicant_id");

ALTER TABLE "project_status_history"
  ADD CONSTRAINT "project_status_history_applicant_id_fkey"
  FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_status_history"
  ADD CONSTRAINT "project_status_history_changed_by_id_fkey"
  FOREIGN KEY ("changed_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
