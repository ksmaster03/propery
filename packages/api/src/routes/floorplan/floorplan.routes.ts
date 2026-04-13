import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/floorplans?airportId=1&floorCode=F1 — ดึง SVG floorplan
router.get('/', async (req: Request, res: Response) => {
  try {
    const { airportId, buildingCode, floorCode } = req.query;

    const where: any = { isActive: true };
    if (airportId) where.airportId = Number(airportId);
    if (buildingCode) where.buildingCode = String(buildingCode);
    if (floorCode) where.floorCode = String(floorCode);

    const data = await prisma.tmFloorplanSvg.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[FLOORPLAN] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// POST /api/floorplans — upload ใหม่ (หรือแทนที่ของเดิม)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { airportId, buildingCode, floorCode, name, svgContent, canvasWidth, canvasHeight } = req.body;

    if (!airportId || !svgContent) {
      res.status(400).json({ success: false, error: 'ข้อมูลไม่ครบ' });
      return;
    }

    // Upsert: ถ้ามี combo เดิมแล้วให้อัปเดต
    const data = await prisma.tmFloorplanSvg.upsert({
      where: {
        airportId_buildingCode_floorCode: {
          airportId: Number(airportId),
          buildingCode: String(buildingCode || ''),
          floorCode: String(floorCode || ''),
        },
      },
      create: {
        airportId: Number(airportId),
        buildingCode: buildingCode || null,
        floorCode: floorCode || null,
        name: name || `Floorplan ${new Date().toISOString()}`,
        svgContent,
        canvasWidth: canvasWidth || 960,
        canvasHeight: canvasHeight || 640,
        uploadedBy: req.user?.userId,
      },
      update: {
        svgContent,
        name: name || undefined,
        canvasWidth: canvasWidth || undefined,
        canvasHeight: canvasHeight || undefined,
        uploadedBy: req.user?.userId,
        uploadedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[FLOORPLAN] Create error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถบันทึกได้' });
  }
});

// DELETE /api/floorplans/:id — ลบ
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.tmFloorplanSvg.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถลบได้' });
  }
});

export default router;
