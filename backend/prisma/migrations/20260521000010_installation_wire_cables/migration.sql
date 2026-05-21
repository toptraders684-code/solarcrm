ALTER TABLE "installation_details" ADD COLUMN IF NOT EXISTS "wire_16mm_earthing_cable" VARCHAR(50);
ALTER TABLE "installation_details" ADD COLUMN IF NOT EXISTS "wire_dc_cable_4sqmm" VARCHAR(50);
ALTER TABLE "installation_details" ADD COLUMN IF NOT EXISTS "wire_ac_cable_copper" VARCHAR(50);
