ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "bank_name_in_account" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "bank_branch_name" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "bank_account_number" VARCHAR(50);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "bank_ifsc_code" VARCHAR(20);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "co_applicant_name" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "co_applicant_relationship" VARCHAR(100);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "co_applicant_mobile" VARCHAR(10);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "co_applicant_occupation" VARCHAR(200);
