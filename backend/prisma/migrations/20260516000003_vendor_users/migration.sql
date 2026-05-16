-- Add vendor_level and vendor_id to users for H1/H2/H3 hierarchy

ALTER TABLE "users"
  ADD COLUMN "vendor_level" VARCHAR(5),
  ADD COLUMN "vendor_id"    TEXT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_users_vendor" ON "users"("vendor_id");
