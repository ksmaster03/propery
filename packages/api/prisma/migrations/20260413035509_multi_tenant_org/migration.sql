-- AlterTable
ALTER TABLE "m_airport" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "m_user" ADD COLUMN     "organization_id" INTEGER;

-- CreateTable
CREATE TABLE "m_floorplan_svg" (
    "id" SERIAL NOT NULL,
    "airport_id" INTEGER NOT NULL,
    "building_code" VARCHAR(20),
    "floor_code" VARCHAR(20),
    "name" VARCHAR(200) NOT NULL,
    "svg_content" TEXT NOT NULL,
    "canvas_width" INTEGER NOT NULL DEFAULT 960,
    "canvas_height" INTEGER NOT NULL DEFAULT 640,
    "uploaded_by" VARCHAR(50),
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "m_floorplan_svg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m_floorplan_svg_airport_id_idx" ON "m_floorplan_svg"("airport_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_floorplan_svg_airport_id_building_code_floor_code_key" ON "m_floorplan_svg"("airport_id", "building_code", "floor_code");

-- CreateIndex
CREATE INDEX "m_airport_organization_id_idx" ON "m_airport"("organization_id");

-- CreateIndex
CREATE INDEX "m_user_organization_id_idx" ON "m_user"("organization_id");

-- AddForeignKey
ALTER TABLE "m_floorplan_svg" ADD CONSTRAINT "m_floorplan_svg_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "m_airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
