-- CreateEnum
CREATE TYPE "FpShapeType" AS ENUM ('RECT', 'POLYGON', 'FREEHAND');

-- AlterTable
ALTER TABLE "m_unit" ADD COLUMN     "fp_manual_area" BOOLEAN DEFAULT false,
ADD COLUMN     "fp_manual_price" DECIMAL(12,2),
ADD COLUMN     "fp_points" JSONB,
ADD COLUMN     "fp_shape_type" "FpShapeType" DEFAULT 'RECT';
