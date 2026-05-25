-- Add employee_id to vendor_commission_assignments (per-member commission support)
-- Uses IF NOT EXISTS / DROP+ADD pattern so it is safe to replay if column was added via db push

ALTER TABLE "vendor_commission_assignments" ADD COLUMN IF NOT EXISTS "employee_id" TEXT;

ALTER TABLE "vendor_commission_assignments"
  DROP CONSTRAINT IF EXISTS "vendor_commission_assignments_employee_id_fkey";

ALTER TABLE "vendor_commission_assignments"
  ADD CONSTRAINT "vendor_commission_assignments_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
