ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "invoice_no" VARCHAR(100);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "solar_rate" DECIMAL(12,2);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "solar_gst" DECIMAL(5,2);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "installation_rate" DECIMAL(12,2);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "installation_gst" DECIMAL(5,2);
