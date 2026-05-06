-- Master Data & Multi-tenancy Migration
-- 1. Create 6 new master lookup tables
-- 2. Convert enum columns → VARCHAR (data preserved)
-- 3. Drop company_id from checklist_master (checklists are now global)
-- 4. Add status to companies
-- 5. Drop now-unused enum types
-- 6. Seed initial master data

-- ── 1. New master tables ──────────────────────────────────────────────

CREATE TABLE "master_discoms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "master_discoms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_discoms_name_key" ON "master_discoms"("name");
CREATE UNIQUE INDEX "master_discoms_code_key" ON "master_discoms"("code");

CREATE TABLE "master_lead_sources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "master_lead_sources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_lead_sources_name_key" ON "master_lead_sources"("name");
CREATE UNIQUE INDEX "master_lead_sources_code_key" ON "master_lead_sources"("code");

CREATE TABLE "master_vendor_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "master_vendor_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_vendor_types_name_key" ON "master_vendor_types"("name");
CREATE UNIQUE INDEX "master_vendor_types_code_key" ON "master_vendor_types"("code");

CREATE TABLE "master_payment_methods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "master_payment_methods_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_payment_methods_name_key" ON "master_payment_methods"("name");
CREATE UNIQUE INDEX "master_payment_methods_code_key" ON "master_payment_methods"("code");

CREATE TABLE "master_project_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "master_project_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_project_types_name_key" ON "master_project_types"("name");
CREATE UNIQUE INDEX "master_project_types_code_key" ON "master_project_types"("code");

CREATE TABLE "master_stages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stage_number" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "master_stages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_stages_stage_number_key" ON "master_stages"("stage_number");

-- ── 2. Add status to companies ────────────────────────────────────────

ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active';

-- ── 3. Convert enum columns to VARCHAR ───────────────────────────────

ALTER TABLE "leads"
  ALTER COLUMN "discom" TYPE VARCHAR(50),
  ALTER COLUMN "project_type" TYPE VARCHAR(50),
  ALTER COLUMN "lead_source" TYPE VARCHAR(50);

ALTER TABLE "applicants"
  ALTER COLUMN "discom" TYPE VARCHAR(50),
  ALTER COLUMN "project_type" TYPE VARCHAR(50);

ALTER TABLE "transactions"
  ALTER COLUMN "payment_method" TYPE VARCHAR(50);

ALTER TABLE "vendors"
  ALTER COLUMN "vendor_types" TYPE TEXT[] USING vendor_types::text[];

ALTER TABLE "checklist_master"
  ALTER COLUMN "discom" TYPE VARCHAR(50),
  ALTER COLUMN "project_type" TYPE VARCHAR(50);

ALTER TABLE "document_master"
  ALTER COLUMN "discom" TYPE VARCHAR(50);

-- ── 4. Drop company_id from checklist_master (make global) ───────────

ALTER TABLE "checklist_master" DROP CONSTRAINT IF EXISTS "checklist_master_company_id_fkey";
ALTER TABLE "checklist_master" DROP COLUMN IF EXISTS "company_id";

-- ── 5. Drop old enum types ────────────────────────────────────────────

DROP TYPE IF EXISTS "Discom";
DROP TYPE IF EXISTS "ProjectType";
DROP TYPE IF EXISTS "LeadSource";
DROP TYPE IF EXISTS "VendorType";
DROP TYPE IF EXISTS "PaymentMethod";

-- ── 6. Seed master data ───────────────────────────────────────────────

INSERT INTO "master_discoms" ("id", "name", "code", "sort_order") VALUES
  (gen_random_uuid(), 'TPCODL', 'tpcodl', 1),
  (gen_random_uuid(), 'TPNODL', 'tpnodl', 2),
  (gen_random_uuid(), 'TPSODL', 'tpsodl', 3),
  (gen_random_uuid(), 'TPWODL', 'tpwodl', 4)
ON CONFLICT DO NOTHING;

INSERT INTO "master_lead_sources" ("id", "name", "code", "sort_order") VALUES
  (gen_random_uuid(), 'Walk In', 'walk_in', 1),
  (gen_random_uuid(), 'Referral', 'referral', 2),
  (gen_random_uuid(), 'Online', 'online', 3),
  (gen_random_uuid(), 'Camp', 'camp', 4),
  (gen_random_uuid(), 'Channel Partner', 'channel_partner', 5),
  (gen_random_uuid(), 'Other', 'other', 6)
ON CONFLICT DO NOTHING;

INSERT INTO "master_vendor_types" ("id", "name", "code", "sort_order") VALUES
  (gen_random_uuid(), 'Channel Partner', 'channel_partner', 1),
  (gen_random_uuid(), 'District Partner', 'district_partner', 2),
  (gen_random_uuid(), 'Block Partner', 'block_partner', 3),
  (gen_random_uuid(), 'Installation Partner', 'installation_partner', 4),
  (gen_random_uuid(), 'Transport Partner', 'transport_partner', 5),
  (gen_random_uuid(), 'Insurance Partner', 'insurance_partner', 6),
  (gen_random_uuid(), 'Netmeter Partner', 'netmeter_partner', 7)
ON CONFLICT DO NOTHING;

INSERT INTO "master_payment_methods" ("id", "name", "code", "sort_order") VALUES
  (gen_random_uuid(), 'Cash', 'cash', 1),
  (gen_random_uuid(), 'Cheque', 'cheque', 2),
  (gen_random_uuid(), 'Bank Transfer', 'bank_transfer', 3),
  (gen_random_uuid(), 'UPI', 'upi', 4),
  (gen_random_uuid(), 'Other', 'other', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "master_project_types" ("id", "name", "code", "sort_order") VALUES
  (gen_random_uuid(), 'Residential', 'residential', 1),
  (gen_random_uuid(), 'Commercial', 'commercial', 2)
ON CONFLICT DO NOTHING;

INSERT INTO "master_stages" ("id", "stage_number", "name", "description") VALUES
  (gen_random_uuid(), 1,  'Document Collection',  'Collect KYC and supporting documents from customer'),
  (gen_random_uuid(), 2,  'Site Survey',          'Conduct technical site survey and roof assessment'),
  (gen_random_uuid(), 3,  'Technical Design',     'Prepare technical design and system layout'),
  (gen_random_uuid(), 4,  'Portal Application',   'Submit application on DISCOM portal'),
  (gen_random_uuid(), 5,  'MRT',                  'Meter Reading Team visit and inspection'),
  (gen_random_uuid(), 6,  'JE Inspection',        'Junior Engineer inspection at site'),
  (gen_random_uuid(), 7,  'DISCOM Approval',      'Await DISCOM sanction letter'),
  (gen_random_uuid(), 8,  'Material Procurement', 'Procure panels, inverter, mounting structure'),
  (gen_random_uuid(), 9,  'Installation',         'Physical installation of solar system'),
  (gen_random_uuid(), 10, 'Commissioning',        'System commissioning and net meter installation'),
  (gen_random_uuid(), 11, 'Subsidy Claim',        'Submit and track PM Surya Ghar subsidy claim')
ON CONFLICT DO NOTHING;
