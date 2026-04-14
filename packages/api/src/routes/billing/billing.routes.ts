import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/bills — รายการใบแจ้งหนี้
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, contractId, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    // Multi-tenant filter via contract → airport → organization (รวม null = shared)
    if (req.orgId) where.contract = { airport: { OR: [{ organizationId: req.orgId }, { organizationId: null }] } };
    if (status && status !== 'ALL') where.status = status as string;
    if (contractId) where.contractId = Number(contractId);

    const [bills, total] = await Promise.all([
      prisma.ttBill.findMany({
        where,
        include: {
          contract: {
            select: {
              contractNo: true, contractType: true,
              partner: { select: { nameTh: true, shopNameTh: true } },
              unit: { select: { unitCode: true } },
            },
          },
        },
        orderBy: { billingMonth: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.ttBill.count({ where }),
    ]);

    const data = bills.map((b) => ({
      id: b.id,
      billNo: b.billNo,
      contractNo: b.contract.contractNo,
      contractType: b.contract.contractType,
      unitCode: b.contract.unit.unitCode,
      partnerName: b.contract.partner.nameTh,
      shopName: b.contract.partner.shopNameTh,
      billingMonth: b.billingMonth,
      dueDate: b.dueDate,
      status: b.status,
      rentAmount: Number(b.rentAmount),
      totalAmount: Number(b.totalAmount),
      paidAmount: b.paidAmount ? Number(b.paidAmount) : null,
      lateFeeAmount: b.lateFeeAmount ? Number(b.lateFeeAmount) : null,
      overdueDays: b.overdueDays,
    }));

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[BILLING] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการบิลได้' });
  }
});

// POST /api/bills/generate-batch — สร้างบิลรายเดือนแบบ batch
router.post('/generate-batch', async (req: Request, res: Response) => {
  try {
    const { billingMonth } = req.body;
    const monthDate = new Date(billingMonth);

    // ดึงสัญญาที่ active ทั้งหมด
    const activeContracts = await prisma.ttContract.findMany({
      where: {
        contractStatus: 'ACTIVE',
        startDate: { lte: monthDate },
        endDate: { gte: monthDate },
      },
      include: {
        fixedRentDetail: true,
        revShareDetail: true,
        consignDetail: true,
      },
    });

    let created = 0;
    for (const contract of activeContracts) {
      // ตรวจสอบว่ามีบิลเดือนนี้แล้วหรือยัง
      const existing = await prisma.ttBill.findFirst({
        where: { contractId: contract.id, billingMonth: monthDate },
      });
      if (existing) continue;

      // คำนวณค่าเช่าตามประเภทสัญญา
      let rentAmount = 0;
      if (contract.contractType === 'FIXED_RENT' && contract.fixedRentDetail) {
        rentAmount = Number(contract.fixedRentDetail.monthlyRent);
      } else if (contract.contractType === 'REVENUE_SHARING' && contract.revShareDetail) {
        rentAmount = Number(contract.revShareDetail.magAmount || 0);
      } else if (contract.contractType === 'CONSIGNMENT' && contract.consignDetail) {
        rentAmount = Number(contract.consignDetail.minCommissionAmount || 0)
          + Number(contract.consignDetail.displaySpaceFee || 0);
      }

      const utilityAmount = Number(contract.utilityRate || 0) * 100; // สมมติ 100 หน่วย
      const commonServiceAmt = Number(contract.commonServiceFee || 0);
      const subtotal = rentAmount + utilityAmount + commonServiceAmt;
      const vatRate = 7;
      const vatAmount = subtotal * (vatRate / 100);
      const totalAmount = subtotal + vatAmount;

      // กำหนดวันครบกำหนดชำระ
      const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), contract.paymentDueDay);

      // สร้างเลขบิล
      const monthStr = `${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const billCount = await prisma.ttBill.count({ where: { billingMonth: monthDate } }) + created + 1;
      const billNo = `BILL-${monthStr}-${String(billCount).padStart(3, '0')}`;

      await prisma.ttBill.create({
        data: {
          billNo,
          contractId: contract.id,
          billingMonth: monthDate,
          dueDate,
          status: 'ISSUED',
          rentAmount,
          utilityAmount,
          commonServiceAmt,
          vatRate,
          vatAmount,
          totalAmount,
          createdBy: req.user?.userId,
        },
      });

      created++;
    }

    res.json({ success: true, message: `สร้างบิลเรียบร้อย ${created} รายการ` });
  } catch (err) {
    console.error('[BILLING] Generate batch error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างบิลได้' });
  }
});

// POST /api/bills/:id/pay — บันทึกการชำระเงิน
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { paidAmount, paymentRef, paymentMethod } = req.body;

    const bill = await prisma.ttBill.findUnique({ where: { id: Number(req.params.id) } });
    if (!bill) {
      res.status(404).json({ success: false, error: 'ไม่พบบิล' });
      return;
    }

    const paid = Number(paidAmount);
    const total = Number(bill.totalAmount) + Number(bill.lateFeeAmount || 0);
    const newStatus = paid >= total ? 'PAID' : 'PARTIALLY_PAID';

    // อัปเดตบิล
    await prisma.ttBill.update({
      where: { id: bill.id },
      data: {
        paidAmount: paid,
        paidAt: new Date(),
        paymentRef,
        status: newStatus,
        updatedBy: req.user?.userId,
      },
    });

    // สร้างใบเสร็จ
    const receiptCount = await prisma.ttReceipt.count() + 1;
    const receiptNo = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(receiptCount).padStart(3, '0')}`;

    await prisma.ttReceipt.create({
      data: {
        receiptNo,
        billId: bill.id,
        amount: paid,
        vatAmount: bill.vatAmount,
        totalAmount: paid,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || 'TRANSFER',
        status: 'VERIFIED',
        createdBy: req.user?.userId,
      },
    });

    // สร้าง Revenue Split
    if (newStatus === 'PAID') {
      const treasuryPct = 50;
      const welfarePct = 20;
      const revolvingPct = 30;

      await prisma.ttRevenueSplit.create({
        data: {
          billId: bill.id,
          totalRevenue: paid,
          treasuryAmount: paid * (treasuryPct / 100),
          treasuryPct,
          welfareFundAmount: paid * (welfarePct / 100),
          welfareFundPct: welfarePct,
          revolvingFundAmount: paid * (revolvingPct / 100),
          revolvingFundPct: revolvingPct,
          periodMonth: bill.billingMonth,
        },
      });
    }

    res.json({ success: true, message: 'บันทึกการชำระเงินเรียบร้อย' });
  } catch (err) {
    console.error('[BILLING] Pay error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถบันทึกการชำระเงินได้' });
  }
});

export default router;
