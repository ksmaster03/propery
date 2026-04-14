import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/dashboard/kpi — ดึงข้อมูล KPI สำหรับหน้า Dashboard (รองรับ multi-tenant)
router.get('/kpi', async (req: Request, res: Response) => {
  try {
    const airportId = req.query.airportId ? Number(req.query.airportId) : undefined;
    const where: any = {};
    if (airportId) where.airportId = airportId;
    // Multi-tenant filter (รวม airport ที่ organizationId = null = shared)
    if (req.orgId) where.airport = { OR: [{ organizationId: req.orgId }, { organizationId: null }] };

    // นับพื้นที่ตามสถานะ
    const [totalUnits, leasedUnits, vacantUnits, reservedUnits] = await Promise.all([
      prisma.tmUnit.count({ where: { ...where, isActive: true } }),
      prisma.tmUnit.count({ where: { ...where, isActive: true, status: 'LEASED' } }),
      prisma.tmUnit.count({ where: { ...where, isActive: true, status: 'VACANT' } }),
      prisma.tmUnit.count({ where: { ...where, isActive: true, status: 'RESERVED' } }),
    ]);

    // คำนวณพื้นที่รวม (ตร.ม.)
    const totalArea = await prisma.tmUnit.aggregate({
      where: { ...where, isActive: true },
      _sum: { areaSqm: true },
    });

    // รายรับเดือนนี้
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyRevenue = await prisma.ttBill.aggregate({
      where: {
        status: 'PAID',
        billingMonth: { gte: startOfMonth, lte: endOfMonth },
        ...(airportId ? { contract: { airportId } } : {}),
      },
      _sum: { paidAmount: true },
    });

    // อัตราการเช่า
    const occupancyRate = totalUnits > 0
      ? ((leasedUnits / totalUnits) * 100).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: {
        totalUnits,
        leasedUnits,
        vacantUnits,
        reservedUnits,
        totalAreaSqm: Number(totalArea._sum.areaSqm || 0),
        monthlyRevenue: Number(monthlyRevenue._sum.paidAmount || 0),
        occupancyRate: parseFloat(occupancyRate),
      },
    });
  } catch (err) {
    console.error('[DASHBOARD] KPI error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูล KPI ได้' });
  }
});

// GET /api/dashboard/expiring-contracts — สัญญาใกล้หมดอา���ุ
router.get('/expiring-contracts', async (req: Request, res: Response) => {
  try {
    const daysAhead = Number(req.query.days || 90);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const contracts = await prisma.ttContract.findMany({
      where: {
        contractStatus: 'ACTIVE',
        endDate: { lte: cutoffDate },
      },
      include: {
        partner: { select: { nameTh: true, shopNameTh: true } },
        unit: { select: { unitCode: true, unitNameTh: true } },
        airport: { select: { airportNameTh: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 20,
    });

    // คำนวณจำนวนวันที่เหลือ
    const now = new Date();
    const result = contracts.map((c) => {
      const daysLeft = Math.ceil(
        (c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        contractNo: c.contractNo,
        partnerName: c.partner.nameTh,
        shopName: c.partner.shopNameTh,
        unitCode: c.unit.unitCode,
        unitName: c.unit.unitNameTh,
        airport: c.airport.airportNameTh,
        endDate: c.endDate,
        daysLeft,
        urgency: daysLeft <= 30 ? 'urgent' : daysLeft <= 60 ? 'warning' : 'normal',
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[DASHBOARD] Expiring contracts error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลสัญญาใกล้หมดอายุได้' });
  }
});

// GET /api/dashboard/revenue-chart — ข้อมูลกราฟรายรับรายเดือน
router.get('/revenue-chart', async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());

    // ดึงรายรับรายเดือน (จริง)
    const bills = await prisma.ttBill.groupBy({
      by: ['billingMonth'],
      where: {
        status: 'PAID',
        billingMonth: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      _sum: { paidAmount: true },
    });

    // จัดรูปแบบเป็น 12 เดือน
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1);
      const found = bills.find(
        (b) => b.billingMonth.getMonth() === i && b.billingMonth.getFullYear() === year
      );
      return {
        month: monthDate.toLocaleDateString('th-TH', { month: 'short' }),
        monthIndex: i + 1,
        actual: Number(found?._sum.paidAmount || 0),
        forecast: 0, // TODO: ดึงจาก config ประมาณการรายรับ
      };
    });

    res.json({ success: true, data: months });
  } catch (err) {
    console.error('[DASHBOARD] Revenue chart error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลกราฟรายรับได้' });
  }
});

export default router;
