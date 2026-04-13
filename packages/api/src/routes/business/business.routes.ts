import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// === 1. Contract Termination ===
// POST /api/business/termination — ยกเลิกสัญญาก่อนกำหนด + คำนวณค่าปรับ
router.post('/termination', async (req: Request, res: Response) => {
  try {
    const { contractId, terminationDate, reason, reasonCategory, depositForfeited } = req.body;

    const contract = await prisma.ttContract.findUnique({
      where: { id: Number(contractId) },
      include: { fixedRentDetail: true, deposit: true },
    });
    if (!contract) {
      res.status(404).json({ success: false, error: 'ไม่พบสัญญา' });
      return;
    }

    // คำนวณเดือนที่เหลือ
    const endDate = new Date(contract.endDate);
    const termDate = new Date(terminationDate);
    const monthsRemaining = Math.max(0, Math.ceil((endDate.getTime() - termDate.getTime()) / (30 * 86400000)));

    // คำนวณค่าปรับ (3 เดือนค่าเช่า หรือ % ของยอดคงเหลือ — whichever greater)
    const baseRent = Number(contract.fixedRentDetail?.monthlyRent || 0);
    const penaltyRate = 3; // 3 เดือน
    const penaltyAmount = Math.min(baseRent * penaltyRate, baseRent * monthsRemaining);

    const termination = await prisma.ttContractTermination.create({
      data: {
        contractId: Number(contractId),
        terminationDate: termDate,
        reason,
        reasonCategory,
        monthsRemaining,
        baseRent,
        penaltyAmount,
        penaltyRate,
        depositForfeited: !!depositForfeited,
        status: 'PENDING',
        createdBy: req.user?.userId,
      },
    });

    // อัปเดตสถานะสัญญา
    await prisma.ttContract.update({
      where: { id: Number(contractId) },
      data: { contractStatus: 'TERMINATED' },
    });

    res.status(201).json({ success: true, data: termination });
  } catch (err) {
    console.error('[BIZ] Termination error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถยกเลิกสัญญาได้' });
  }
});

router.get('/termination', async (_req: Request, res: Response) => {
  try {
    const data = await prisma.ttContractTermination.findMany({
      orderBy: { terminationDate: 'desc' },
      take: 50,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// === 2. Deposit Refund ===
// POST /api/business/deposit-refund
router.post('/deposit-refund', async (req: Request, res: Response) => {
  try {
    const { contractId, depositAmount, damageDeduction, cleaningDeduction, unpaidBills, otherDeduction, notes } = req.body;

    const totalDeduction =
      Number(damageDeduction || 0) +
      Number(cleaningDeduction || 0) +
      Number(unpaidBills || 0) +
      Number(otherDeduction || 0);
    const refundAmount = Math.max(0, Number(depositAmount) - totalDeduction);

    const refund = await prisma.ttDepositRefund.create({
      data: {
        contractId: Number(contractId),
        depositAmount: Number(depositAmount),
        damageDeduction: damageDeduction || null,
        cleaningDeduction: cleaningDeduction || null,
        unpaidBills: unpaidBills || null,
        otherDeduction: otherDeduction || null,
        totalDeduction,
        refundAmount,
        status: 'PENDING',
        notes,
        createdBy: req.user?.userId,
      },
    });
    res.status(201).json({ success: true, data: refund });
  } catch (err) {
    console.error('[BIZ] Deposit refund error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้าง refund ได้' });
  }
});

router.get('/deposit-refund', async (_req: Request, res: Response) => {
  try {
    const data = await prisma.ttDepositRefund.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// === 3. Meter Reading ===
router.post('/meter-reading', async (req: Request, res: Response) => {
  try {
    const { unitId, contractId, meterType, meterNumber, readingDate, previousValue, currentValue, rate, notes } = req.body;

    const consumption = Number(currentValue) - Number(previousValue);
    const amount = consumption * Number(rate);

    const reading = await prisma.ttMeterReading.create({
      data: {
        unitId: Number(unitId),
        contractId: contractId ? Number(contractId) : null,
        meterType,
        meterNumber,
        readingDate: new Date(readingDate),
        previousValue: Number(previousValue),
        currentValue: Number(currentValue),
        consumption,
        rate: Number(rate),
        amount,
        notes,
        readBy: req.user?.userId,
      },
    });
    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    console.error('[BIZ] Meter error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถบันทึกมิเตอร์ได้' });
  }
});

router.get('/meter-reading', async (req: Request, res: Response) => {
  try {
    const { unitId, meterType } = req.query;
    const where: any = {};
    if (unitId) where.unitId = Number(unitId);
    if (meterType) where.meterType = meterType as string;

    const data = await prisma.ttMeterReading.findMany({
      where,
      orderBy: { readingDate: 'desc' },
      take: 50,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// === 4. POS Sales (Revenue Sharing) ===
router.post('/pos-sale', async (req: Request, res: Response) => {
  try {
    const { contractId, saleDate, grossSales, discount, vat, transactions, source, currency, exchangeRate } = req.body;

    const netSales = Number(grossSales) - Number(discount || 0) - Number(vat || 0);

    const sale = await prisma.ttPosSale.upsert({
      where: {
        contractId_saleDate: {
          contractId: Number(contractId),
          saleDate: new Date(saleDate),
        },
      },
      create: {
        contractId: Number(contractId),
        saleDate: new Date(saleDate),
        grossSales: Number(grossSales),
        discount: discount || null,
        vat: vat || null,
        netSales,
        transactions: Number(transactions || 0),
        source: source || 'MANUAL',
        currency: currency || 'THB',
        exchangeRate: exchangeRate || 1,
      },
      update: {
        grossSales: Number(grossSales),
        discount: discount || null,
        vat: vat || null,
        netSales,
        transactions: Number(transactions || 0),
      },
    });
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    console.error('[BIZ] POS sale error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถบันทึกยอดขายได้' });
  }
});

router.get('/pos-sale', async (req: Request, res: Response) => {
  try {
    const { contractId, from, to } = req.query;
    const where: any = {};
    if (contractId) where.contractId = Number(contractId);
    if (from || to) {
      where.saleDate = {};
      if (from) where.saleDate.gte = new Date(from as string);
      if (to) where.saleDate.lte = new Date(to as string);
    }
    const data = await prisma.ttPosSale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      take: 100,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// === 5. Exchange Rates ===
router.get('/exchange-rate', async (req: Request, res: Response) => {
  try {
    const { from = 'USD', to = 'THB' } = req.query;
    const rate = await prisma.tmExchangeRate.findFirst({
      where: { fromCurrency: from as any, toCurrency: to as any },
      orderBy: { effectiveDate: 'desc' },
    });
    res.json({ success: true, data: rate });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.post('/exchange-rate', async (req: Request, res: Response) => {
  try {
    const { fromCurrency, toCurrency, rate, effectiveDate, source } = req.body;
    const data = await prisma.tmExchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_effectiveDate: {
          fromCurrency,
          toCurrency,
          effectiveDate: new Date(effectiveDate),
        },
      },
      create: {
        fromCurrency,
        toCurrency,
        rate: Number(rate),
        effectiveDate: new Date(effectiveDate),
        source,
      },
      update: { rate: Number(rate), source },
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[BIZ] Exchange rate error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถบันทึกได้' });
  }
});

export default router;
