import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// === Tenant Portal API — ใช้ partner session ===
// เนื่องจาก tenant login ส่ง role=TENANT + userId=partnerCode,
// route นี้ต้องตรวจสอบจาก req.user.userId (partnerCode)

// Middleware: resolve partner จาก userId
async function tenantOnly(req: Request, res: Response, next: any) {
  if (req.user?.role !== 'TENANT') {
    res.status(403).json({ success: false, error: 'เฉพาะผู้เช่าเท่านั้น' });
    return;
  }
  const partner = await prisma.tmPartner.findUnique({
    where: { partnerCode: req.user.userId },
  });
  if (!partner) {
    res.status(404).json({ success: false, error: 'ไม่พบผู้เช่า' });
    return;
  }
  (req as any).partner = partner;
  next();
}

// GET /api/portal/dashboard — สรุปข้อมูลผู้เช่า
router.get('/dashboard', tenantOnly, async (req: Request, res: Response) => {
  try {
    const partner = (req as any).partner;

    // สัญญาที่ active
    const contracts = await prisma.ttContract.findMany({
      where: { partnerId: partner.id, contractStatus: 'ACTIVE' },
      include: {
        unit: { select: { unitCode: true, unitNameTh: true, areaSqm: true } },
        fixedRentDetail: { select: { monthlyRent: true } },
      },
      take: 5,
    });

    // บิลค้างชำระ
    const pendingBills = await prisma.ttBill.findMany({
      where: {
        contract: { partnerId: partner.id },
        status: { in: ['ISSUED', 'OVERDUE'] },
      },
      include: {
        contract: { select: { contractNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // บิลที่ชำระแล้ว (ประวัติ)
    const paidBills = await prisma.ttBill.findMany({
      where: {
        contract: { partnerId: partner.id },
        status: 'PAID',
      },
      include: {
        contract: { select: { contractNo: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: 12,
    });

    res.json({
      success: true,
      data: {
        partner: {
          partnerCode: partner.partnerCode,
          nameTh: partner.nameTh,
          shopNameTh: partner.shopNameTh,
          taxId: partner.taxId,
          contactPerson: partner.contactPerson,
          phone: partner.phone,
          email: partner.email,
        },
        contracts: contracts.map((c) => ({
          contractNo: c.contractNo,
          unitCode: c.unit.unitCode,
          unitName: c.unit.unitNameTh,
          areaSqm: Number(c.unit.areaSqm),
          endDate: c.endDate,
          daysLeft: Math.ceil((c.endDate.getTime() - Date.now()) / (86400000)),
          monthlyRent: c.fixedRentDetail ? Number(c.fixedRentDetail.monthlyRent) : null,
        })),
        pendingBills: pendingBills.map((b) => ({
          billNo: b.billNo,
          contractNo: b.contract.contractNo,
          billingMonth: b.billingMonth,
          dueDate: b.dueDate,
          status: b.status,
          totalAmount: Number(b.totalAmount),
          lateFeeAmount: Number(b.lateFeeAmount || 0),
          overdueDays: b.overdueDays || 0,
        })),
        paidBills: paidBills.map((b) => ({
          billNo: b.billNo,
          contractNo: b.contract.contractNo,
          billingMonth: b.billingMonth,
          paidAt: b.paidAt,
          paidAmount: Number(b.paidAmount || 0),
        })),
      },
    });
  } catch (err) {
    console.error('[PORTAL] Dashboard error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

export default router;
