-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('VACANT', 'LEASED', 'RESERVED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FIXED_RENT', 'REVENUE_SHARING', 'CONSIGNMENT', 'REAL_ESTATE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'PENDING_LEGAL', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'CANCELLED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('INDIVIDUAL', 'JURISTIC');

-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('CASH', 'BANK_GUARANTEE', 'CHEQUE');

-- CreateEnum
CREATE TYPE "RealEstateSubType" AS ENUM ('LAND_ONLY', 'BUILDING_ONLY', 'LAND_AND_BUILDING');

-- CreateEnum
CREATE TYPE "RevenueCalcMethod" AS ENUM ('HIGHER_OF_MAG_OR_SHARE', 'MAG_PLUS_EXCESS_SHARE', 'REVENUE_SHARE_ONLY');

-- CreateEnum
CREATE TYPE "ReportingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('ID_CARD', 'COMPANY_CERTIFICATE', 'VAT_REGISTRATION', 'AMENDMENT_REGISTRATION', 'SHAREHOLDER_LIST', 'MEMORANDUM', 'BANK_GUARANTEE_LETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'APPROVE', 'REJECT', 'SIGN', 'UPLOAD', 'PAYMENT');

-- CreateTable
CREATE TABLE "m_user" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100),
    "full_name" VARCHAR(200),
    "department_code" VARCHAR(50),
    "role" VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_permission" (
    "id" SERIAL NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_export" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "m_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_airport" (
    "id" SERIAL NOT NULL,
    "airport_code" VARCHAR(10) NOT NULL,
    "airport_name_th" VARCHAR(200) NOT NULL,
    "airport_name_en" VARCHAR(200),
    "province" VARCHAR(100),
    "region" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_building" (
    "id" SERIAL NOT NULL,
    "building_code" VARCHAR(20) NOT NULL,
    "building_name_th" VARCHAR(200) NOT NULL,
    "building_name_en" VARCHAR(200),
    "airport_id" INTEGER NOT NULL,
    "total_floors" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_floor" (
    "id" SERIAL NOT NULL,
    "floor_code" VARCHAR(20) NOT NULL,
    "floor_name_th" VARCHAR(100) NOT NULL,
    "floor_name_en" VARCHAR(100),
    "floor_number" INTEGER NOT NULL,
    "building_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_zone" (
    "id" SERIAL NOT NULL,
    "zone_code" VARCHAR(20) NOT NULL,
    "zone_name_th" VARCHAR(100) NOT NULL,
    "zone_name_en" VARCHAR(100),
    "floor_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_unit" (
    "id" SERIAL NOT NULL,
    "unit_code" VARCHAR(20) NOT NULL,
    "unit_name_th" VARCHAR(200),
    "unit_name_en" VARCHAR(200),
    "airport_id" INTEGER NOT NULL,
    "zone_id" INTEGER,
    "area_sqm" DECIMAL(10,2),
    "status" "UnitStatus" NOT NULL DEFAULT 'VACANT',
    "purpose" VARCHAR(100),
    "meter_number" VARCHAR(50),
    "fp_coord_x" DECIMAL(8,2),
    "fp_coord_y" DECIMAL(8,2),
    "fp_width" DECIMAL(8,2),
    "fp_height" DECIMAL(8,2),
    "land_rai" INTEGER,
    "land_ngan" INTEGER,
    "land_sq_wa" DECIMAL(8,2),
    "title_deed_no" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_partner" (
    "id" SERIAL NOT NULL,
    "partner_code" VARCHAR(20) NOT NULL,
    "partner_type" "PartnerType" NOT NULL,
    "name_th" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "shop_name_th" VARCHAR(200),
    "shop_name_en" VARCHAR(200),
    "tax_id" VARCHAR(20) NOT NULL,
    "contact_person" VARCHAR(200),
    "phone" VARCHAR(50),
    "email" VARCHAR(100),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "portal_password_hash" VARCHAR(255),
    "portal_last_login_at" TIMESTAMPTZ,

    CONSTRAINT "m_partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_contract" (
    "id" SERIAL NOT NULL,
    "contract_no" VARCHAR(30) NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "contract_status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "airport_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "duration_months" INTEGER,
    "payment_due_day" INTEGER NOT NULL DEFAULT 5,
    "utility_rate" DECIMAL(8,2),
    "common_service_fee" DECIMAL(12,2),
    "late_penalty_rate" DECIMAL(5,2) DEFAULT 15,
    "alert_days_before" INTEGER NOT NULL DEFAULT 90,
    "current_step_no" INTEGER NOT NULL DEFAULT 1,
    "approved_by" VARCHAR(50),
    "approved_at" TIMESTAMPTZ,
    "signed_at" TIMESTAMPTZ,
    "previous_contract_id" INTEGER,
    "renewal_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_contract_fixed_rent" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "monthly_rent" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_contract_fixed_rent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_contract_rev_share" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "mag_amount" DECIMAL(14,2),
    "revenue_share_pct" DECIMAL(5,2) NOT NULL,
    "calc_method" "RevenueCalcMethod" NOT NULL,
    "use_tiered_rate" BOOLEAN NOT NULL DEFAULT false,
    "reporting_frequency" "ReportingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "report_due_day" INTEGER,
    "verification_method" VARCHAR(100),
    "audit_right_days" INTEGER,
    "late_report_penalty_pct" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_contract_rev_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_rev_share_tier" (
    "id" SERIAL NOT NULL,
    "rev_share_id" INTEGER NOT NULL,
    "tier_order" INTEGER NOT NULL,
    "revenue_from" DECIMAL(14,2) NOT NULL,
    "revenue_to" DECIMAL(14,2),
    "share_pct" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_rev_share_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_contract_consignment" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "commission_pct" DECIMAL(5,2) NOT NULL,
    "min_commission_amount" DECIMAL(14,2),
    "display_space_fee" DECIMAL(14,2),
    "product_category" VARCHAR(100),
    "settlement_frequency" "ReportingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "inventory_policy" VARCHAR(200),
    "damage_responsibility" VARCHAR(200),
    "expiry_policy" VARCHAR(200),
    "product_guarantee" DECIMAL(14,2),
    "min_product_count" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_contract_consignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_contract_real_estate" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "sub_type" "RealEstateSubType" NOT NULL,
    "land_rai" INTEGER,
    "land_ngan" INTEGER,
    "land_sq_wa" DECIMAL(8,2),
    "land_rent_monthly" DECIMAL(14,2),
    "title_deed_no" VARCHAR(50),
    "land_purpose" VARCHAR(100),
    "building_area_sqm" DECIMAL(10,2),
    "building_rent_monthly" DECIMAL(14,2),
    "building_name" VARCHAR(200),
    "building_floors" INTEGER,
    "escalation_rule" VARCHAR(200),
    "key_money" DECIMAL(14,2),
    "construction_right" VARCHAR(200),
    "return_condition" VARCHAR(200),
    "property_tax_liability" VARCHAR(100),
    "subletting_policy" VARCHAR(200),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_contract_real_estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_deposit" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "deposit_type" "DepositType" NOT NULL,
    "calculated_amount" DECIMAL(14,2) NOT NULL,
    "approved_amount" DECIMAL(14,2) NOT NULL,
    "received_date" DATE,
    "returned_date" DATE,
    "returned_amount" DECIMAL(14,2),
    "bank_guarantee_no" VARCHAR(100),
    "lease_fee" DECIMAL(14,2),
    "installation_fee" DECIMAL(14,2),
    "maintenance_fee" DECIMAL(14,2),
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_bill" (
    "id" SERIAL NOT NULL,
    "bill_no" VARCHAR(30) NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "billing_month" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "rent_amount" DECIMAL(14,2) NOT NULL,
    "utility_amount" DECIMAL(14,2),
    "utility_units" DECIMAL(10,2),
    "common_service_amt" DECIMAL(14,2),
    "other_charges" DECIMAL(14,2),
    "other_charges_note" VARCHAR(500),
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 7,
    "vat_amount" DECIMAL(14,2),
    "total_amount" DECIMAL(14,2) NOT NULL,
    "late_fee_amount" DECIMAL(14,2),
    "overdue_days" INTEGER,
    "reported_revenue" DECIMAL(14,2),
    "rev_share_amount" DECIMAL(14,2),
    "paid_amount" DECIMAL(14,2),
    "paid_at" TIMESTAMPTZ,
    "payment_ref" VARCHAR(100),
    "qr_payload" TEXT,
    "barcode_ref" VARCHAR(50),
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_receipt" (
    "id" SERIAL NOT NULL,
    "receipt_no" VARCHAR(30) NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "vat_amount" DECIMAL(14,2),
    "total_amount" DECIMAL(14,2) NOT NULL,
    "payment_date" DATE,
    "payment_method" VARCHAR(50),
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "receipt_file_url" VARCHAR(500),
    "uploaded_at" TIMESTAMPTZ,
    "verified_by" VARCHAR(50),
    "verified_at" TIMESTAMPTZ,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_revenue_split" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "total_revenue" DECIMAL(14,2) NOT NULL,
    "treasury_amount" DECIMAL(14,2) NOT NULL,
    "treasury_pct" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "welfare_fund_amount" DECIMAL(14,2) NOT NULL,
    "welfare_fund_pct" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "revolving_fund_amount" DECIMAL(14,2) NOT NULL,
    "revolving_fund_pct" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "period_month" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_revenue_split_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_revenue_report" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "report_month" DATE NOT NULL,
    "reported_revenue" DECIMAL(14,2) NOT NULL,
    "verified_revenue" DECIMAL(14,2),
    "source" VARCHAR(50),
    "submitted_at" TIMESTAMPTZ,
    "verified_by" VARCHAR(50),
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_revenue_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_document" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER,
    "partner_id" INTEGER,
    "category" "DocumentCategory" NOT NULL,
    "file_name" VARCHAR(300) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "previous_version_id" INTEGER,
    "uploaded_by" VARCHAR(50),
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_approval_step" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "step_no" INTEGER NOT NULL,
    "step_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "assigned_to" VARCHAR(50),
    "completed_by" VARCHAR(50),
    "completed_at" TIMESTAMPTZ,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_approval_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_audit_log" (
    "id" SERIAL NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "field_name" VARCHAR(100),
    "old_value" TEXT,
    "new_value" TEXT,
    "user_id" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_config" (
    "id" SERIAL NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    "description" VARCHAR(500),
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_template" (
    "id" SERIAL NOT NULL,
    "template_code" VARCHAR(50) NOT NULL,
    "template_name" VARCHAR(200) NOT NULL,
    "contract_type" "ContractType",
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_user_user_id_key" ON "m_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_permission_role_module_key" ON "m_permission"("role", "module");

-- CreateIndex
CREATE UNIQUE INDEX "m_airport_airport_code_key" ON "m_airport"("airport_code");

-- CreateIndex
CREATE UNIQUE INDEX "m_building_building_code_key" ON "m_building"("building_code");

-- CreateIndex
CREATE INDEX "m_building_airport_id_idx" ON "m_building"("airport_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_floor_floor_code_key" ON "m_floor"("floor_code");

-- CreateIndex
CREATE INDEX "m_floor_building_id_idx" ON "m_floor"("building_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_zone_zone_code_key" ON "m_zone"("zone_code");

-- CreateIndex
CREATE INDEX "m_zone_floor_id_idx" ON "m_zone"("floor_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_unit_unit_code_key" ON "m_unit"("unit_code");

-- CreateIndex
CREATE INDEX "m_unit_airport_id_idx" ON "m_unit"("airport_id");

-- CreateIndex
CREATE INDEX "m_unit_zone_id_idx" ON "m_unit"("zone_id");

-- CreateIndex
CREATE INDEX "m_unit_status_idx" ON "m_unit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "m_partner_partner_code_key" ON "m_partner"("partner_code");

-- CreateIndex
CREATE UNIQUE INDEX "m_partner_tax_id_key" ON "m_partner"("tax_id");

-- CreateIndex
CREATE INDEX "m_partner_tax_id_idx" ON "m_partner"("tax_id");

-- CreateIndex
CREATE INDEX "m_partner_partner_type_idx" ON "m_partner"("partner_type");

-- CreateIndex
CREATE UNIQUE INDEX "t_contract_contract_no_key" ON "t_contract"("contract_no");

-- CreateIndex
CREATE INDEX "t_contract_airport_id_idx" ON "t_contract"("airport_id");

-- CreateIndex
CREATE INDEX "t_contract_partner_id_idx" ON "t_contract"("partner_id");

-- CreateIndex
CREATE INDEX "t_contract_unit_id_idx" ON "t_contract"("unit_id");

-- CreateIndex
CREATE INDEX "t_contract_contract_status_idx" ON "t_contract"("contract_status");

-- CreateIndex
CREATE INDEX "t_contract_end_date_idx" ON "t_contract"("end_date");

-- CreateIndex
CREATE INDEX "t_contract_contract_type_idx" ON "t_contract"("contract_type");

-- CreateIndex
CREATE UNIQUE INDEX "t_contract_fixed_rent_contract_id_key" ON "t_contract_fixed_rent"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_contract_rev_share_contract_id_key" ON "t_contract_rev_share"("contract_id");

-- CreateIndex
CREATE INDEX "t_rev_share_tier_rev_share_id_idx" ON "t_rev_share_tier"("rev_share_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_contract_consignment_contract_id_key" ON "t_contract_consignment"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_contract_real_estate_contract_id_key" ON "t_contract_real_estate"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_deposit_contract_id_key" ON "t_deposit"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_bill_bill_no_key" ON "t_bill"("bill_no");

-- CreateIndex
CREATE INDEX "t_bill_contract_id_idx" ON "t_bill"("contract_id");

-- CreateIndex
CREATE INDEX "t_bill_billing_month_idx" ON "t_bill"("billing_month");

-- CreateIndex
CREATE INDEX "t_bill_status_idx" ON "t_bill"("status");

-- CreateIndex
CREATE INDEX "t_bill_due_date_idx" ON "t_bill"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "t_receipt_receipt_no_key" ON "t_receipt"("receipt_no");

-- CreateIndex
CREATE INDEX "t_receipt_bill_id_idx" ON "t_receipt"("bill_id");

-- CreateIndex
CREATE INDEX "t_revenue_split_bill_id_idx" ON "t_revenue_split"("bill_id");

-- CreateIndex
CREATE INDEX "t_revenue_split_period_month_idx" ON "t_revenue_split"("period_month");

-- CreateIndex
CREATE INDEX "t_revenue_report_contract_id_idx" ON "t_revenue_report"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_revenue_report_contract_id_report_month_key" ON "t_revenue_report"("contract_id", "report_month");

-- CreateIndex
CREATE INDEX "t_document_contract_id_idx" ON "t_document"("contract_id");

-- CreateIndex
CREATE INDEX "t_document_partner_id_idx" ON "t_document"("partner_id");

-- CreateIndex
CREATE INDEX "t_document_category_idx" ON "t_document"("category");

-- CreateIndex
CREATE INDEX "t_approval_step_contract_id_idx" ON "t_approval_step"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_approval_step_contract_id_step_no_key" ON "t_approval_step"("contract_id", "step_no");

-- CreateIndex
CREATE INDEX "t_audit_log_table_name_record_id_idx" ON "t_audit_log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "t_audit_log_user_id_idx" ON "t_audit_log"("user_id");

-- CreateIndex
CREATE INDEX "t_audit_log_created_at_idx" ON "t_audit_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "m_config_config_key_key" ON "m_config"("config_key");

-- CreateIndex
CREATE UNIQUE INDEX "m_template_template_code_key" ON "m_template"("template_code");

-- AddForeignKey
ALTER TABLE "m_building" ADD CONSTRAINT "m_building_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "m_airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_floor" ADD CONSTRAINT "m_floor_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "m_building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_zone" ADD CONSTRAINT "m_zone_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "m_floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_unit" ADD CONSTRAINT "m_unit_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "m_airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_unit" ADD CONSTRAINT "m_unit_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "m_zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract" ADD CONSTRAINT "t_contract_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "m_airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract" ADD CONSTRAINT "t_contract_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "m_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract" ADD CONSTRAINT "t_contract_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "m_partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract" ADD CONSTRAINT "t_contract_previous_contract_id_fkey" FOREIGN KEY ("previous_contract_id") REFERENCES "t_contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract_fixed_rent" ADD CONSTRAINT "t_contract_fixed_rent_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract_rev_share" ADD CONSTRAINT "t_contract_rev_share_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_rev_share_tier" ADD CONSTRAINT "t_rev_share_tier_rev_share_id_fkey" FOREIGN KEY ("rev_share_id") REFERENCES "t_contract_rev_share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract_consignment" ADD CONSTRAINT "t_contract_consignment_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_contract_real_estate" ADD CONSTRAINT "t_contract_real_estate_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_deposit" ADD CONSTRAINT "t_deposit_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_bill" ADD CONSTRAINT "t_bill_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_receipt" ADD CONSTRAINT "t_receipt_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "t_bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_revenue_split" ADD CONSTRAINT "t_revenue_split_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "t_bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_document" ADD CONSTRAINT "t_document_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_document" ADD CONSTRAINT "t_document_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "m_partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_document" ADD CONSTRAINT "t_document_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "t_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_approval_step" ADD CONSTRAINT "t_approval_step_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "t_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_audit_log" ADD CONSTRAINT "t_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
