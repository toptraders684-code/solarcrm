ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "mnre_application_no" VARCHAR(100);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "discom_application_no" VARCHAR(100);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "mnre_submit_date" DATE;
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "discom_division" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "discom_sub_division" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "discom_section" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "discom_contact_person" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "discom_mobile_no" VARCHAR(10);
