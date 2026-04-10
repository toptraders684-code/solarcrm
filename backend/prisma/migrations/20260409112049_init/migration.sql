-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'operations_staff', 'field_technician', 'finance_manager', 'vendor');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending_approval', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "Discom" AS ENUM ('tpcodl', 'tpnodl', 'tpsodl', 'tpwodl');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('residential', 'commercial');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('walk_in', 'referral', 'online', 'camp', 'channel_partner', 'other');

-- CreateEnum
CREATE TYPE "FinancePreference" AS ENUM ('self', 'govt_bank', 'private_bank');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'in_progress', 'converted', 'closed');

-- CreateEnum
CREATE TYPE "LeadClosureReason" AS ENUM ('not_interested', 'no_roof_space', 'financial_issue', 'competitor', 'unreachable', 'other');

-- CreateEnum
CREATE TYPE "OverpaymentRule" AS ENUM ('warn', 'block');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('kyc', 'technical', 'discom');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'uploaded');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('customer_receipt', 'vendor_payment', 'subsidy');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'cheque', 'bank_transfer', 'upi', 'other');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending_approval', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('material_supplier', 'labour_installer', 'transport_logistics');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('contacted', 'not_reachable', 'meeting_scheduled', 'site_visit_done', 'document_collected', 'other');

-- CreateTable
CREATE TABLE "master_states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_districts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "state_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "gstin" VARCHAR(15),
    "address_house" VARCHAR(200),
    "address_street" VARCHAR(200),
    "address_village" VARCHAR(200),
    "address_city" VARCHAR(200),
    "address_pincode" VARCHAR(6),
    "logo_key" VARCHAR(500),
    "settings_json" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "email" VARCHAR(200),
    "password_hash" VARCHAR(200),
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending_approval',
    "permissions_json" JSONB DEFAULT '{}',
    "ip_whitelist" TEXT[],
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "lead_code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "alternate_mobile" VARCHAR(10),
    "email" VARCHAR(200),
    "address_house" VARCHAR(200),
    "address_street" VARCHAR(200),
    "address_village" VARCHAR(200) NOT NULL,
    "address_district_id" TEXT,
    "address_state_id" TEXT,
    "address_pincode" VARCHAR(6),
    "discom" "Discom" NOT NULL,
    "project_type" "ProjectType" NOT NULL,
    "estimated_capacity_kw" DECIMAL(6,2),
    "lead_source" "LeadSource" NOT NULL,
    "finance_preference" "FinancePreference",
    "assigned_staff_id" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "closure_reason" "LeadClosureReason",
    "follow_up_date" DATE,
    "converted_applicant_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_followups" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "notes" TEXT,
    "follow_up_date" DATE,
    "outcome_type" "OutcomeType" NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "applicant_code" VARCHAR(20) NOT NULL,
    "discom_ref_no" VARCHAR(100),
    "lead_id" TEXT NOT NULL,
    "assigned_staff_id" TEXT NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "mobile_token" VARCHAR(200),
    "aadhaar_token" VARCHAR(200),
    "pan_token" VARCHAR(200),
    "bank_account_token" VARCHAR(200),
    "address_house" VARCHAR(200),
    "address_street" VARCHAR(200),
    "address_village" VARCHAR(200),
    "address_district_id" TEXT,
    "address_state_id" TEXT,
    "address_pincode" VARCHAR(6),
    "gps_latitude" DECIMAL(10,7),
    "gps_longitude" DECIMAL(10,7),
    "date_of_birth" DATE,
    "gender" VARCHAR(10),
    "alternate_mobile" VARCHAR(10),
    "email" VARCHAR(200),
    "whatsapp_number" VARCHAR(10),
    "discom" "Discom" NOT NULL,
    "project_type" "ProjectType" NOT NULL,
    "system_capacity_kw" DECIMAL(6,2),
    "roof_type" VARCHAR(50),
    "sanctioned_load_kw" DECIMAL(6,2),
    "existing_consumer_no" VARCHAR(50),
    "contract_amount" DECIMAL(12,2),
    "finance_mode" "FinancePreference",
    "bank_name" VARCHAR(200),
    "loan_amount" DECIMAL(12,2),
    "loan_sanctioned_date" DATE,
    "overpayment_rule" "OverpaymentRule" NOT NULL DEFAULT 'warn',
    "survey_date" DATE,
    "surveyed_by" VARCHAR(200),
    "roof_area_sqft" DECIMAL(8,2),
    "shadow_analysis" TEXT,
    "recommended_capacity_kw" DECIMAL(6,2),
    "portal_application_date" DATE,
    "je_name" VARCHAR(200),
    "je_contact" VARCHAR(10),
    "mrt_date" DATE,
    "inspection_date" DATE,
    "inspection_result" VARCHAR(50),
    "net_meter_serial_no" VARCHAR(100),
    "expected_subsidy_amount" DECIMAL(12,2),
    "actual_subsidy_received" DECIMAL(12,2),
    "subsidy_received_date" DATE,
    "discom_bank_reference" VARCHAR(100),
    "stage" INTEGER NOT NULL DEFAULT 1,
    "stage_updated_at" TIMESTAMP(3),
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_timestamp" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pii_vault" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "aadhaar_encrypted" TEXT,
    "pan_encrypted" TEXT,
    "bank_account_encrypted" TEXT,
    "mobile_encrypted" TEXT,
    "ifsc_code" VARCHAR(11),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pii_vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_master" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "discom" "Discom" NOT NULL,
    "project_type" "ProjectType" NOT NULL,
    "phase_name" VARCHAR(100) NOT NULL,
    "phase_order" INTEGER NOT NULL,
    "item_text" TEXT NOT NULL,
    "item_order" INTEGER NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_checklists" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "master_item_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applicant_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "doc_name" VARCHAR(200) NOT NULL,
    "file_key" VARCHAR(500),
    "file_name" VARCHAR(200),
    "file_size_bytes" INTEGER,
    "mime_type" VARCHAR(50),
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "transaction_date" DATE NOT NULL,
    "description" TEXT,
    "reference_number" VARCHAR(100),
    "file_key" VARCHAR(500),
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending_approval',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "vendor_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "business_name" VARCHAR(200) NOT NULL,
    "contact_person" VARCHAR(200),
    "mobile" VARCHAR(10),
    "email" VARCHAR(200),
    "address_house" VARCHAR(200),
    "address_street" VARCHAR(200),
    "address_village" VARCHAR(200),
    "address_district" VARCHAR(100),
    "address_state" VARCHAR(100),
    "address_pincode" VARCHAR(6),
    "vendor_types" "VendorType"[],
    "gstin" VARCHAR(15),
    "pan_token" VARCHAR(200),
    "bank_account_token" VARCHAR(200),
    "ifsc_code" VARCHAR(11),
    "empanelment_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_vendors" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "category_label" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applicant_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(200) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_attempts" (
    "id" TEXT NOT NULL,
    "mobile" VARCHAR(10),
    "email" VARCHAR(200),
    "otp_hash" VARCHAR(200) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_upload_links" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "token" VARCHAR(200) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_upload_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_states_name_key" ON "master_states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "master_states_code_key" ON "master_states"("code");

-- CreateIndex
CREATE UNIQUE INDEX "master_districts_name_state_id_key" ON "master_districts"("name", "state_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_mobile_key" ON "users"("company_id", "mobile");

-- CreateIndex
CREATE INDEX "idx_leads_company_status" ON "leads"("company_id", "status");

-- CreateIndex
CREATE INDEX "idx_leads_assigned_staff" ON "leads"("assigned_staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_company_id_lead_code_key" ON "leads"("company_id", "lead_code");

-- CreateIndex
CREATE INDEX "idx_applicants_company_stage" ON "applicants"("company_id", "stage");

-- CreateIndex
CREATE INDEX "idx_applicants_discom" ON "applicants"("discom");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_company_id_applicant_code_key" ON "applicants"("company_id", "applicant_code");

-- CreateIndex
CREATE UNIQUE INDEX "pii_vault_applicant_id_key" ON "pii_vault"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_checklists_applicant_id_master_item_id_key" ON "applicant_checklists"("applicant_id", "master_item_id");

-- CreateIndex
CREATE INDEX "idx_documents_applicant" ON "documents"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_transactions_applicant" ON "transactions"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_vendors_applicant_id_vendor_id_key" ON "applicant_vendors"("applicant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_upload_links_token_key" ON "customer_upload_links"("token");

-- CreateIndex
CREATE INDEX "idx_upload_links_expires" ON "customer_upload_links"("expires_at");

-- AddForeignKey
ALTER TABLE "master_districts" ADD CONSTRAINT "master_districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "master_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_address_district_id_fkey" FOREIGN KEY ("address_district_id") REFERENCES "master_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_address_state_id_fkey" FOREIGN KEY ("address_state_id") REFERENCES "master_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_applicant_id_fkey" FOREIGN KEY ("converted_applicant_id") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_address_district_id_fkey" FOREIGN KEY ("address_district_id") REFERENCES "master_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_address_state_id_fkey" FOREIGN KEY ("address_state_id") REFERENCES "master_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_vault" ADD CONSTRAINT "pii_vault_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_checklists" ADD CONSTRAINT "applicant_checklists_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_checklists" ADD CONSTRAINT "applicant_checklists_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "checklist_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_checklists" ADD CONSTRAINT "applicant_checklists_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_vendors" ADD CONSTRAINT "applicant_vendors_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_vendors" ADD CONSTRAINT "applicant_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_upload_links" ADD CONSTRAINT "customer_upload_links_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
