import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/units — รายการพื้นที่เช่าทั้งหมด (รองรับ filter + pagination + multi-tenant)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { airportId, zoneId, status, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    // Multi-tenant: filter ตาม active org ถ้ามี — ยอมรับ airport ที่ organizationId = null (shared) ด้วย
    if (req.orgId) {
      where.airport = { OR: [{ organizationId: req.orgId }, { organizationId: null }] };
    }
    if (airportId) where.airportId = Number(airportId);
    if (zoneId) where.zoneId = Number(zoneId);
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { unitCode: { contains: search as string, mode: 'insensitive' } },
        { unitNameTh: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [units, total] = await Promise.all([
      prisma.tmUnit.findMany({
        where,
        include: {
          zone: { select: { zoneCode: true, zoneNameTh: true } },
          airport: { select: { airportCode: true, airportNameTh: true } },
          contracts: {
            where: { contractStatus: 'ACTIVE' },
            select: {
              contractNo: true,
              partner: { select: { nameTh: true, shopNameTh: true } },
            },
            take: 1,
          },
        },
        orderBy: { unitCode: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.tmUnit.count({ where }),
    ]);

    // จัดรูปแบบข้อมูลให้ frontend ใช้งานง่าย
    const data = units.map((u) => ({
      id: u.id,
      unitCode: u.unitCode,
      unitNameTh: u.unitNameTh,
      areaSqm: Number(u.areaSqm),
      status: u.status,
      purpose: u.purpose,
      meterNumber: u.meterNumber,
      zoneCode: u.zone?.zoneCode,
      zoneNameTh: u.zone?.zoneNameTh,
      airportId: u.airportId,
      airportCode: u.airport.airportCode,
      airportNameTh: u.airport.airportNameTh,
      // พิกัดสำหรับ floor plan rendering
      fpCoordX: u.fpCoordX != null ? Number(u.fpCoordX) : null,
      fpCoordY: u.fpCoordY != null ? Number(u.fpCoordY) : null,
      fpWidth: u.fpWidth != null ? Number(u.fpWidth) : null,
      fpHeight: u.fpHeight != null ? Number(u.fpHeight) : null,
      fpShapeType: u.fpShapeType,
      fpPoints: u.fpPoints,
      currentTenant: u.contracts[0]?.partner?.nameTh || null,
      currentShop: u.contracts[0]?.partner?.shopNameTh || null,
      currentContractNo: u.contracts[0]?.contractNo || null,
    }));

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[UNIT] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการพื้นที่เช่าได้' });
  }
});

// GET /api/units/floorplan — ข้อมูลสำหรับ Floor Plan (SVG rendering)
router.get('/floorplan', async (req: Request, res: Response) => {
  try {
    const { airportId, floorId, zoneId } = req.query;

    const where: any = { isActive: true };
    if (airportId) where.airportId = Number(airportId);
    if (zoneId) where.zoneId = Number(zoneId);
    if (floorId) where.zone = { floorId: Number(floorId) };

    const units = await prisma.tmUnit.findMany({
      where,
      include: {
        zone: {
          select: {
            zoneCode: true, zoneNameTh: true,
            floor: { select: { floorCode: true, floorNameTh: true } },
          },
        },
        contracts: {
          where: { contractStatus: 'ACTIVE' },
          select: {
            contractNo: true, contractType: true, endDate: true,
            partner: { select: { nameTh: true, shopNameTh: true } },
            fixedRentDetail: { select: { monthlyRent: true } },
          },
          take: 1,
        },
      },
      orderBy: { unitCode: 'asc' },
    });

    // จัดรูปแบบเป็น SVG-friendly data
    const data = units.map((u) => {
      const contract = u.contracts[0];
      const now = new Date();
      const daysLeft = contract
        ? Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // กำหนดสีตามสถานะ
      let fillColor = '#e8f5e9'; // ว่าง — เขียวอ่อน
      let strokeColor = '#1a9e5c';
      if (u.status === 'LEASED') {
        fillColor = daysLeft !== null && daysLeft <= 30
          ? '#fce4ec' // ใกล้หมดอายุ — แดงอ่อน
          : '#e3f2fd'; // เช่าปกติ — น้ำเงินอ่อน
        strokeColor = daysLeft !== null && daysLeft <= 30 ? '#d9534f' : '#005b9f';
      } else if (u.status === 'RESERVED') {
        fillColor = '#fff8e1'; // จอง — เหลืองอ่อน
        strokeColor = '#d97706';
      } else if (u.status === 'MAINTENANCE') {
        fillColor = '#f5f5f5'; // ปิดปรับปรุง — เทา
        strokeColor = '#9e9e9e';
      }

      return {
        id: u.id,
        unitCode: u.unitCode,
        unitNameTh: u.unitNameTh,
        status: u.status,
        areaSqm: Number(u.areaSqm),
        purpose: u.purpose,
        // พิกัด SVG
        x: Number(u.fpCoordX || 0),
        y: Number(u.fpCoordY || 0),
        width: Number(u.fpWidth || 120),
        height: Number(u.fpHeight || 80),
        // สี
        fillColor,
        strokeColor,
        // ข้อมูลสัญญา
        tenant: contract?.partner?.nameTh || null,
        shopName: contract?.partner?.shopNameTh || null,
        contractNo: contract?.contractNo || null,
        contractType: contract?.contractType || null,
        monthlyRent: contract?.fixedRentDetail?.monthlyRent
          ? Number(contract.fixedRentDetail.monthlyRent) : null,
        daysLeft,
        // zone info
        zoneCode: u.zone?.zoneCode,
        zoneNameTh: u.zone?.zoneNameTh,
        floorNameTh: u.zone?.floor?.floorNameTh,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[UNIT] Floorplan error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูล Floor Plan ได้' });
  }
});

// GET /api/units/:id — รายละเอียดพื้นที่เช่า
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const unit = await prisma.tmUnit.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        zone: { include: { floor: { include: { building: true } } } },
        airport: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: { partner: true },
          take: 5,
        },
      },
    });

    if (!unit) {
      res.status(404).json({ success: false, error: 'ไม่พบพื้นที่เช่า' });
      return;
    }

    res.json({ success: true, data: unit });
  } catch (err) {
    console.error('[UNIT] Detail error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายละเอียดพื้นที่เช่าได้' });
  }
});

// POST /api/units — สร้างพื้นที่เช่าใหม่
router.post('/', async (req: Request, res: Response) => {
  try {
    const unit = await prisma.tmUnit.create({ data: req.body });
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    console.error('[UNIT] Create error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างพื้นที่เช่าได้' });
  }
});

// PUT /api/units/:id — แก้ไขพื้นที่เช่า
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, airport, zone, contracts, ...updateData } = req.body;
    const unit = await prisma.tmUnit.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });
    res.json({ success: true, data: unit });
  } catch (err) {
    console.error('[UNIT] Update error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขพื้นที่เช่าได้' });
  }
});

// DELETE /api/units/:id — ลบพื้นที่เช่า (soft delete ถ้ามี contracts, hard delete ถ้าไม่มี)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const unitId = Number(req.params.id);
    const contractCount = await prisma.ttContract.count({ where: { unitId } });

    if (contractCount === 0) {
      // ไม่มีสัญญา → hard delete
      await prisma.tmUnit.delete({ where: { id: unitId } });
      res.json({ success: true, mode: 'hard' });
    } else {
      // มีสัญญา → soft delete
      const soft = await prisma.tmUnit.update({
        where: { id: unitId },
        data: { isActive: false },
      });
      res.json({
        success: true,
        data: soft,
        mode: 'soft',
        warning: `มีสัญญา ${contractCount} รายการในพื้นที่นี้ — ทำ soft delete แทน`,
      });
    }
  } catch (err: any) {
    console.error('[UNIT] Delete error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'ไม่สามารถลบได้' });
  }
});

// GET /api/units/options/airports — dropdown สนามบิน
router.get('/options/airports', async (_req: Request, res: Response) => {
  try {
    const airports = await prisma.tmAirport.findMany({
      where: { isActive: true },
      select: { id: true, airportCode: true, airportNameTh: true },
      orderBy: { airportCode: 'asc' },
    });
    res.json({ success: true, data: airports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการสนามบินได้' });
  }
});

// GET /api/units/options/floors — dropdown ชั้น ตาม building
router.get('/options/floors', async (req: Request, res: Response) => {
  try {
    const { buildingId } = req.query;
    const floors = await prisma.tmFloor.findMany({
      where: { isActive: true, ...(buildingId ? { buildingId: Number(buildingId) } : {}) },
      select: { id: true, floorCode: true, floorNameTh: true },
      orderBy: { floorNumber: 'asc' },
    });
    res.json({ success: true, data: floors });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการชั้นได้' });
  }
});

export default router;
