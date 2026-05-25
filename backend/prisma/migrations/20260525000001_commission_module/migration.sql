CREATE TYPE "CommissionStructureType" AS ENUM ('per_kw', 'percentage', 'fixed_per_project', 'slab_based');
CREATE TYPE "PayableStatus" AS ENUM ('draft', 'approved', 'paid');

CREATE TABLE "commission_structures" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "structure_type" "CommissionStructureType" NOT NULL,
    "config_schema" JSONB NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_structures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_commission_assignments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "commission_structure_id" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_commission_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_commission_configs" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    CONSTRAINT "vendor_commission_configs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_commission_configs_assignment_id_config_key_key" UNIQUE ("assignment_id", "config_key")
);

CREATE TABLE "employee_payables" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "salary_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "incentive_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "project_count" INTEGER NOT NULL DEFAULT 0,
    "total_kw" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "PayableStatus" NOT NULL DEFAULT 'draft',
    "notes" VARCHAR(500),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    CONSTRAINT "employee_payables_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employee_payables_employee_id_assignment_id_month_year_key" UNIQUE ("employee_id", "assignment_id", "month", "year")
);

CREATE TABLE "payable_incentives" (
    "id" TEXT NOT NULL,
    "payable_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payable_incentives_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "vendor_commission_assignments" ADD CONSTRAINT "vendor_commission_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_commission_assignments" ADD CONSTRAINT "vendor_commission_assignments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_commission_assignments" ADD CONSTRAINT "vendor_commission_assignments_commission_structure_id_fkey" FOREIGN KEY ("commission_structure_id") REFERENCES "commission_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vendor_commission_configs" ADD CONSTRAINT "vendor_commission_configs_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "vendor_commission_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_payables" ADD CONSTRAINT "employee_payables_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_payables" ADD CONSTRAINT "employee_payables_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_payables" ADD CONSTRAINT "employee_payables_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_payables" ADD CONSTRAINT "employee_payables_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "vendor_commission_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_payables" ADD CONSTRAINT "employee_payables_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payable_incentives" ADD CONSTRAINT "payable_incentives_payable_id_fkey" FOREIGN KEY ("payable_id") REFERENCES "employee_payables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
