ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "aadhaar_name_same_as_bill_name" BOOLEAN;
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "aadhaar_mobile_same_as_bill_mobile" BOOLEAN;
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "aadhaar_name_same_as_bank_details" BOOLEAN;
