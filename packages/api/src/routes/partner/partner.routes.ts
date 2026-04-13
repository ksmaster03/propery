import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/partners — รายการผู้เช่า/คู่ค้าทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, type, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (type) where.partnerType = type as string;
    if (search) {
      where.OR = [
        { nameTh: { contains: search as string, mode: 'insensitive' } },
        { shopNameTh: { contains: search as string, mode: 'insensitive' } },
        { taxId: { contains: search as string, mode: 'insensitive' } },
        { partnerCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [partners, total] = await Promise.all([
      prisma.tmPartner.findMany({
        where,
        select: {
          id: true, partnerCode: true, partnerType: true,
          nameTh: true, nameEn: true, shopNameTh: true,
          taxId: true, contactPerson: true, phone: true, email: true,
          isActive: true, createdAt: true,
          _count: { select: { contracts: true } },
        },
        orderBy: { partnerCode: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.tmPartner.count({ where }),
    ]);

    const data = partners.map((p) => ({
      ...p,
      contractCount: p._count.contracts,
      _count: undefined,
    }));

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[PARTNER] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการผู้เช่าได้' });
  }
});

// GET /api/partners/:id — รายละเอียดผู้เช่า
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const partner = await prisma.tmPartner.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: {
            unit: { select: { unitCode: true, unitNameTh: true } },
            airport: { select: { airportNameTh: true } },
          },
          take: 10,
        },
        documents: {
          where: { isLatest: true },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!partner) {
      res.status(404).json({ success: false, error: 'ไม่พบผู้เช่า' });
      return;
    }

    res.json({ success: true, data: partner });
  } catch (err) {
    console.error('[PARTNER] Detail error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายละเอียดผู้เช่าได้' });
  }
});

// POST /api/partners — สร้างผู้เช่าใหม่
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nameTh, nameEn, partnerType, taxId, shopNameTh, contactPerson, phone, email, address } = req.body;

    // ตรวจสอบเลขภาษีซ้ำ
    const existing = await prisma.tmPartner.findUnique({ where: { taxId } });
    if (existing) {
      res.status(400).json({ success: false, error: 'เลขประจำตัวผู้เสียภาษีนี้มีในระบบแล้ว' });
      return;
    }

    // สร้างรหัสผู้เช่าอัตโนมัติ
    const lastPartner = await prisma.tmPartner.findFirst({ orderBy: { id: 'desc' } });
    const nextNum = (lastPartner?.id || 0) + 1;
    const partnerCode = `P-${String(nextNum).padStart(3, '0')}`;

    const partner = await prisma.tmPartner.create({
      data: {
        partnerCode, partnerType, nameTh, nameEn,
        shopNameTh, taxId, contactPerson, phone, email, address,
        createdBy: req.user?.userId,
      },
    });

    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    console.error('[PARTNER] Create error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างผู้เช่าได้' });
  }
});

// PUT /api/partners/:id — แก้ไขผู้เช่า
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nameTh, nameEn, shopNameTh, shopNameEn, contactPerson, phone, email, address } = req.body;

    const partner = await prisma.tmPartner.update({
      where: { id: Number(req.params.id) },
      data: {
        nameTh, nameEn, shopNameTh, shopNameEn,
        contactPerson, phone, email, address,
        updatedBy: req.user?.userId,
      },
    });

    res.json({ success: true, data: partner });
  } catch (err) {
    console.error('[PARTNER] Update error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขผู้เช่าได้' });
  }
});

export default router;
