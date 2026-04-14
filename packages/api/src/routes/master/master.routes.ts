import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { adminOnly } from '../../middleware/permissions.js';

const router = Router();

// === Helper สำหรับ generic CRUD — ใช้ซ้ำกับทุก entity ===
// รับ model delegate จาก Prisma + default sort field

function createCrudRouter(modelName: keyof typeof prisma, defaultSort: string = 'sortOrder') {
  const r = Router();

  // GET / — list ทั้งหมด
  r.get('/', async (req: Request, res: Response) => {
    try {
      const { active, search } = req.query;
      const where: any = {};
      if (active === 'true') where.isActive = true;
      if (search) {
        where.OR = [
          { nameTh: { contains: search as string, mode: 'insensitive' } },
          { nameEn: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      const data = await (prisma[modelName] as any).findMany({
        where,
        orderBy: [{ [defaultSort]: 'asc' }],
      });
      res.json({ success: true, data });
    } catch (err) {
      console.error(`[MASTER ${String(modelName)}] List error:`, err);
      res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
    }
  });

  // GET /:id — รายการเดียว
  r.get('/:id', async (req: Request, res: Response) => {
    try {
      const data = await (prisma[modelName] as any).findUnique({
        where: { id: Number(req.params.id) },
      });
      if (!data) {
        res.status(404).json({ success: false, error: 'ไม่พบข้อมูล' });
        return;
      }
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
    }
  });

  // POST / — สร้างใหม่ (เฉพาะ ADMIN)
  r.post('/', adminOnly, async (req: Request, res: Response) => {
    try {
      const data = await (prisma[modelName] as any).create({
        data: req.body,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      console.error(`[MASTER ${String(modelName)}] Create error:`, err);
      if (err.code === 'P2002') {
        res.status(400).json({ success: false, error: 'code นี้มีอยู่แล้ว' });
        return;
      }
      res.status(500).json({ success: false, error: 'ไม่สามารถสร้างข้อมูลได้' });
    }
  });

  // PUT /:id — แก้ไข (เฉพาะ ADMIN)
  r.put('/:id', adminOnly, async (req: Request, res: Response) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const data = await (prisma[modelName] as any).update({
        where: { id: Number(req.params.id) },
        data: updateData,
      });
      res.json({ success: true, data });
    } catch (err) {
      console.error(`[MASTER ${String(modelName)}] Update error:`, err);
      res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขข้อมูลได้' });
    }
  });

  // DELETE /:id — ลบแบบ soft (เฉพาะ ADMIN)
  r.delete('/:id', adminOnly, async (req: Request, res: Response) => {
    try {
      const data = await (prisma[modelName] as any).update({
        where: { id: Number(req.params.id) },
        data: { isActive: false },
      });
      res.json({ success: true, data });
    } catch (err) {
      console.error(`[MASTER ${String(modelName)}] Delete error:`, err);
      res.status(500).json({ success: false, error: 'ไม่สามารถลบข้อมูลได้' });
    }
  });

  return r;
}

// === Routes ===
router.use('/organizations', createCrudRouter('tmOrganization', 'id'));
router.use('/zone-types', createCrudRouter('tmZoneType', 'sortOrder'));
router.use('/allocation-statuses', createCrudRouter('tmAllocationStatus', 'sortOrder'));
router.use('/business-categories', createCrudRouter('tmBusinessCategory', 'sortOrder'));
router.use('/payment-methods', createCrudRouter('tmPaymentMethod', 'sortOrder'));
router.use('/document-types', createCrudRouter('tmDocumentType', 'sortOrder'));
router.use('/departments', createCrudRouter('tmDepartment', 'sortOrder'));

// === Airport (ใช้ CRUD เดิมแต่แสดงใน master data ด้วย) ===
router.get('/airports', async (_req: Request, res: Response) => {
  try {
    const data = await prisma.tmAirport.findMany({
      orderBy: { airportCode: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// === Buildings by airport ===
router.get('/buildings', async (req: Request, res: Response) => {
  try {
    const { airportId } = req.query;
    const where: any = { isActive: true };
    if (airportId) where.airportId = Number(airportId);
    const data = await prisma.tmBuilding.findMany({
      where,
      include: {
        _count: { select: { floors: true, units: true } },
      },
      orderBy: { buildingCode: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.post('/buildings', adminOnly, async (req: Request, res: Response) => {
  try {
    const data = await prisma.tmBuilding.create({ data: req.body });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ success: false, error: 'รหัสอาคารนี้มีอยู่แล้ว' });
      return;
    }
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างได้' });
  }
});

router.put('/buildings/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, airport, floors, units, _count, ...updateData } = req.body;
    const data = await prisma.tmBuilding.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขได้' });
  }
});

// DELETE /buildings/:id — D combo: hard delete ถ้าไม่มี floors/units, soft delete ถ้ามี
router.delete('/buildings/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const buildingId = Number(req.params.id);
    const floorCount = await prisma.tmFloor.count({ where: { buildingId } });
    const unitCount = await prisma.tmUnit.count({ where: { buildingId } });

    if (floorCount === 0 && unitCount === 0) {
      const deleted = await prisma.tmBuilding.delete({ where: { id: buildingId } });
      res.json({ success: true, data: deleted, mode: 'hard' });
    } else {
      const soft = await prisma.tmBuilding.update({
        where: { id: buildingId },
        data: { isActive: false },
      });
      res.json({
        success: true,
        data: soft,
        mode: 'soft',
        warning: `มี ${floorCount} ชั้น และ ${unitCount} พื้นที่เช่าในอาคารนี้ — ทำ soft delete แทน`,
      });
    }
  } catch (err: any) {
    console.error('[MASTER] Delete building error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'ไม่สามารถลบได้' });
  }
});

// === Floors by building ===
router.get('/floors', async (req: Request, res: Response) => {
  try {
    const { buildingId, airportId } = req.query;
    const where: any = { isActive: true };
    if (buildingId) where.buildingId = Number(buildingId);
    if (airportId) where.building = { airportId: Number(airportId) };
    const data = await prisma.tmFloor.findMany({
      where,
      include: {
        _count: { select: { zones: true } },
        building: { select: { id: true, buildingCode: true, airportId: true } },
      },
      orderBy: [{ buildingId: 'asc' }, { floorNumber: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[MASTER] Floors error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.post('/floors', adminOnly, async (req: Request, res: Response) => {
  try {
    const data = await prisma.tmFloor.create({ data: req.body });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ success: false, error: 'รหัสชั้นนี้มีอยู่แล้ว' });
      return;
    }
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างได้' });
  }
});

router.put('/floors/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, building, _count, ...updateData } = req.body;
    const data = await prisma.tmFloor.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขได้' });
  }
});

// DELETE /floors/:id — D combo: hard delete ถ้าไม่มี units, soft delete ถ้ามี
router.delete('/floors/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const floorId = Number(req.params.id);
    // นับ units ผ่าน zones ของ floor นี้
    const unitCount = await prisma.tmUnit.count({
      where: { zone: { floorId } },
    });

    if (unitCount === 0) {
      // ไม่มี units → hard delete + ลบ zones ในชั้นนี้ด้วย
      await prisma.tmZone.deleteMany({ where: { floorId } });
      const deleted = await prisma.tmFloor.delete({ where: { id: floorId } });
      res.json({ success: true, data: deleted, mode: 'hard' });
    } else {
      // มี units → soft delete + ส่ง warning
      const soft = await prisma.tmFloor.update({
        where: { id: floorId },
        data: { isActive: false },
      });
      res.json({
        success: true,
        data: soft,
        mode: 'soft',
        warning: `มีพื้นที่เช่า ${unitCount} รายการในชั้นนี้ — ทำ soft delete แทน`,
      });
    }
  } catch (err: any) {
    console.error('[MASTER] Delete floor error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'ไม่สามารถลบได้' });
  }
});

export default router;
