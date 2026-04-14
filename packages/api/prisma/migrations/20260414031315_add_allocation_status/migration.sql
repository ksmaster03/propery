-- CreateTable
CREATE TABLE "m_allocation_status" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "maps_to" "UnitStatus" NOT NULL,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "description" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "m_allocation_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_allocation_status_code_key" ON "m_allocation_status"("code");
