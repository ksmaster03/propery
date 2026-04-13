import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/reports/revenue?year=2026 — รายรับรายเดือนจริงจาก DB
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());

    // Aggregate bills ชำระแล้ว groupBy month
    const bills = await prisma.ttBill.findMany({
      where: {
        status: 'PAID',
        billingMonth: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: { billingMonth: true, paidAmount: true },
    });

    // รวมยอดรายเดือน
    const monthlyTotals: Record<number, number> = {};
    for (const b of bills) {
      const m = b.billingMonth.getMonth();
      monthlyTotals[m] = (monthlyTotals[m] || 0) + Number(b.paidAmount || 0);
    }

    const labels = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      label: labels[i],
      monthIndex: i + 1,
      actual: monthlyTotals[i] || 0,
      forecast: (monthlyTotals[i] || 0) * 1.1, // ประมาณ 10% เหนือ actual
    }));

    // KPI summary
    const totalYtd = bills.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
    const activeMonths = Object.keys(monthlyTotals).length || 1;
    const avgMonthly = totalYtd / activeMonths;

    // Total bills count + collection rate
    const [paidCount, totalCount] = await Promise.all([
      prisma.ttBill.count({ where: { status: 'PAID' } }),
      prisma.ttBill.count(),
    ]);
    const collectionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    // Outstanding (unpaid)
    const outstanding = await prisma.ttBill.aggregate({
      where: { status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] } },
      _sum: { totalAmount: true },
    });

    res.json({
      success: true,
      data: {
        monthlyRevenue,
        summary: {
          totalYtd,
          avgMonthly,
          collectionRate: Number(collectionRate.toFixed(1)),
          outstanding: Number(outstanding._sum.totalAmount || 0),
        },
      },
    });
  } catch (err) {
    console.error('[REPORT] Revenue error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างรายงานได้' });
  }
});

// GET /api/reports/area — วิเคราะห์พื้นที่: occupancy + revenue per sqm
router.get('/area', async (_req: Request, res: Response) => {
  try {
    // Occupancy ต่อสนามบิน
    const airports = await prisma.tmAirport.findMany({
      where: { isActive: true },
      include: {
        units: {
          select: { id: true, status: true, areaSqm: true },
        },
      },
    });

    const byAirport = airports.map((a) => {
      const total = a.units.length;
      const leased = a.units.filter((u) => u.status === 'LEASED').length;
      const vacant = a.units.filter((u) => u.status === 'VACANT').length;
      const reserved = a.units.filter((u) => u.status === 'RESERVED').length;
      const totalArea = a.units.reduce((s, u) => s + Number(u.areaSqm || 0), 0);
      return {
        code: a.airportCode,
        nameTh: a.airportNameTh,
        total,
        leased,
        vacant,
        reserved,
        occupancyPct: total > 0 ? Number(((leased / total) * 100).toFixed(1)) : 0,
        totalAreaSqm: totalArea,
      };
    });

    // ยอดรวมทั้งระบบ
    const allUnits = airports.flatMap((a) => a.units);
    const totalArea = allUnits.reduce((s, u) => s + Number(u.areaSqm || 0), 0);
    const leasedArea = allUnits.filter((u) => u.status === 'LEASED').reduce((s, u) => s + Number(u.areaSqm || 0), 0);
    const vacantArea = allUnits.filter((u) => u.status === 'VACANT').reduce((s, u) => s + Number(u.areaSqm || 0), 0);
    const avgOccupancy = allUnits.length > 0
      ? Number((allUnits.filter((u) => u.status === 'LEASED').length / allUnits.length * 100).toFixed(1))
      : 0;

    // Revenue per sqm (จาก bills paid เดือนล่าสุด)
    const revenueLast = await prisma.ttBill.aggregate({
      where: { status: 'PAID' },
      _sum: { paidAmount: true },
    });
    const revenuePerSqm = totalArea > 0
      ? Math.round(Number(revenueLast._sum.paidAmount || 0) / totalArea)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalAreaSqm: totalArea,
          avgOccupancy,
          vacantAreaSqm: vacantArea,
          revenuePerSqm,
        },
        byAirport,
      },
    });
  } catch (err) {
    console.error('[REPORT] Area error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างรายงานได้' });
  }
});

export default router;
