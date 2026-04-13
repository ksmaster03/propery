import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

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

  // POST / — สร้างใหม่
  r.post('/', async (req: Request, res: Response) => {
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

  // PUT /:id — แก้ไข
  r.put('/:id', async (req: Request, res: Response) => {
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

  // DELETE /:id — ลบแบบ soft (ตั้ง isActive = false)
  r.delete('/:id', async (req: Request, res: Response) => {
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

export default router;
