ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "area_house_no" VARCHAR(200);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "area_roof_size_sqft" DECIMAL(8,2);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "area_no_of_floors" INTEGER;
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "area_roof_type" VARCHAR(50);
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "area_house_height" VARCHAR(100);
