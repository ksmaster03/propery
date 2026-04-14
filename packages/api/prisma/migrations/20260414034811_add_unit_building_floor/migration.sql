-- AlterTable
ALTER TABLE "m_unit" ADD COLUMN     "building_id" INTEGER,
ADD COLUMN     "floor_id" INTEGER;

-- CreateIndex
CREATE INDEX "m_unit_building_id_idx" ON "m_unit"("building_id");

-- CreateIndex
CREATE INDEX "m_unit_floor_id_idx" ON "m_unit"("floor_id");

-- AddForeignKey
ALTER TABLE "m_unit" ADD CONSTRAINT "m_unit_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "m_building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_unit" ADD CONSTRAINT "m_unit_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "m_floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
