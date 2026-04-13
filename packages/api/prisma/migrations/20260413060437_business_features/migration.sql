-- CreateEnum
CREATE TYPE "DepositRefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('ELECTRIC', 'WATER', 'GAS');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('THB', 'USD', 'EUR', 'GBP', 'JPY', 'CNY');

-- CreateTable
CREATE TABLE "t_contract_termination" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "termination_date" DATE NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "reason_category" VARCHAR(50),
    "months_remaining" INTEGER NOT NULL,
    "base_rent" DECIMAL(14,2) NOT NULL,
    "penalty_amount" DECIMAL(14,2) NOT NULL,
    "penalty_rate" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "deposit_forfeited" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approved_by" VARCHAR(50),
    "approved_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_contract_termination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_deposit_refund" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "deposit_amount" DECIMAL(14,2) NOT NULL,
    "damage_deduction" DECIMAL(14,2),
    "cleaning_deduction" DECIMAL(14,2),
    "unpaid_bills" DECIMAL(14,2),
    "other_deduction" DECIMAL(14,2),
    "total_deduction" DECIMAL(14,2) NOT NULL,
    "refund_amount" DECIMAL(14,2) NOT NULL,
    "status" "DepositRefundStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" VARCHAR(30),
    "bank_account" VARCHAR(100),
    "paid_at" TIMESTAMPTZ,
    "payment_ref" VARCHAR(100),
    "notes" TEXT,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_deposit_refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_meter_reading" (
    "id" SERIAL NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "contract_id" INTEGER,
    "meter_type" "MeterType" NOT NULL,
    "meter_number" VARCHAR(50) NOT NULL,
    "reading_date" DATE NOT NULL,
    "previous_value" DECIMAL(12,2) NOT NULL,
    "current_value" DECIMAL(12,2) NOT NULL,
    "consumption" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(10,4) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "bill_id" INTEGER,
    "notes" VARCHAR(500),
    "read_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_meter_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_pos_sale" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "sale_date" DATE NOT NULL,
    "gross_sales" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2),
    "vat" DECIMAL(14,2),
    "net_sales" DECIMAL(14,2) NOT NULL,
    "transactions" INTEGER NOT NULL DEFAULT 0,
    "source" VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    "pos_ref_id" VARCHAR(100),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" VARCHAR(50),
    "verified_at" TIMESTAMPTZ,
    "currency" "Currency" NOT NULL DEFAULT 'THB',
    "exchange_rate" DECIMAL(12,6) DEFAULT 1,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "t_pos_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_exchange_rate" (
    "id" SERIAL NOT NULL,
    "from_currency" "Currency" NOT NULL,
    "to_currency" "Currency" NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "effective_date" DATE NOT NULL,
    "source" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_contract_termination_contract_id_key" ON "t_contract_termination"("contract_id");

-- CreateIndex
CREATE INDEX "t_contract_termination_contract_id_idx" ON "t_contract_termination"("contract_id");

-- CreateIndex
CREATE INDEX "t_deposit_refund_contract_id_idx" ON "t_deposit_refund"("contract_id");

-- CreateIndex
CREATE INDEX "t_deposit_refund_status_idx" ON "t_deposit_refund"("status");

-- CreateIndex
CREATE INDEX "t_meter_reading_unit_id_idx" ON "t_meter_reading"("unit_id");

-- CreateIndex
CREATE INDEX "t_meter_reading_contract_id_idx" ON "t_meter_reading"("contract_id");

-- CreateIndex
CREATE INDEX "t_meter_reading_reading_date_idx" ON "t_meter_reading"("reading_date");

-- CreateIndex
CREATE INDEX "t_pos_sale_contract_id_idx" ON "t_pos_sale"("contract_id");

-- CreateIndex
CREATE INDEX "t_pos_sale_sale_date_idx" ON "t_pos_sale"("sale_date");

-- CreateIndex
CREATE UNIQUE INDEX "t_pos_sale_contract_id_sale_date_key" ON "t_pos_sale"("contract_id", "sale_date");

-- CreateIndex
CREATE INDEX "m_exchange_rate_effective_date_idx" ON "m_exchange_rate"("effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "m_exchange_rate_from_currency_to_currency_effective_date_key" ON "m_exchange_rate"("from_currency", "to_currency", "effective_date");
