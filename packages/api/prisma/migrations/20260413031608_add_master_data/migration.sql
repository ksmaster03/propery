-- CreateTable
CREATE TABLE "m_organization" (
    "id" SERIAL NOT NULL,
    "org_code" VARCHAR(20) NOT NULL,
    "name_th" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "short_name_th" VARCHAR(50),
    "short_name_en" VARCHAR(50),
    "tax_id" VARCHAR(20),
    "address_th" TEXT,
    "address_en" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(100),
    "website" VARCHAR(200),
    "logo_url" VARCHAR(500),
    "treasury_pct" DECIMAL(5,2) DEFAULT 50,
    "welfare_fund_pct" DECIMAL(5,2) DEFAULT 20,
    "revolving_fund_pct" DECIMAL(5,2) DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_zone_type" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "default_rate" DECIMAL(12,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_zone_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_business_category" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(150) NOT NULL,
    "name_en" VARCHAR(150),
    "icon" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_business_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_payment_method" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "icon" VARCHAR(50),
    "requires_ref" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_document_type" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name_th" VARCHAR(150) NOT NULL,
    "name_en" VARCHAR(150),
    "required" BOOLEAN NOT NULL DEFAULT false,
    "for_partner" BOOLEAN NOT NULL DEFAULT true,
    "for_juristic" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_document_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_department" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "parent_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_organization_org_code_key" ON "m_organization"("org_code");

-- CreateIndex
CREATE UNIQUE INDEX "m_zone_type_code_key" ON "m_zone_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_business_category_code_key" ON "m_business_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_payment_method_code_key" ON "m_payment_method"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_document_type_code_key" ON "m_document_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_department_code_key" ON "m_department"("code");

-- AddForeignKey
ALTER TABLE "m_department" ADD CONSTRAINT "m_department_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "m_department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
