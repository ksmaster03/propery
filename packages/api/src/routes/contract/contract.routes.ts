import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/contracts/by-unit/:unitId — ดึงสัญญาทั้งหมดของพื้นที่ (active + ประวัติ)
// ใช้ใน Floor Plan side panel เพื่อเช็คว่า unit ไหนมีสัญญาอะไร
router.get('/by-unit/:unitId', async (req: Request, res: Response) => {
  try {
    const unitId = Number(req.params.unitId);
    if (!unitId) {
      res.status(400).json({ success: false, error: 'unitId ต้องเป็นตัวเลข' });
      return;
    }
    const contracts = await prisma.ttContract.findMany({
      where: { unitId },
      include: {
        partner: { select: { id: true, partnerCode: true, nameTh: true, shopNameTh: true } },
        unit: { select: { id: true, unitCode: true, unitNameTh: true, areaSqm: true, status: true } },
      },
      orderBy: [
        { contractStatus: 'asc' }, // ACTIVE มาก่อน
        { startDate: 'desc' },
      ],
      take: 20,
    });

    // แยก active ออกจาก history
    const active = contracts.find((c) => c.contractStatus === 'ACTIVE');
    const history = contracts.filter((c) => c.contractStatus !== 'ACTIVE');

    res.json({ success: true, data: { active, history, total: contracts.length } });
  } catch (err) {
    console.error('[CONTRACT] by-unit error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงสัญญาได้' });
  }
});

// GET /api/contracts — รายการสัญญาทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const { airportId, status, type, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    // Multi-tenant filter via airport's organization (รวม null = shared)
    if (req.orgId) where.airport = { OR: [{ organizationId: req.orgId }, { organizationId: null }] };
    if (airportId) where.airportId = Number(airportId);
    if (status) where.contractStatus = status as string;
    if (type) where.contractType = type as string;
    if (search) {
      where.OR = [
        { contractNo: { contains: search as string, mode: 'insensitive' } },
        { partner: { nameTh: { contains: search as string, mode: 'insensitive' } } },
        { partner: { shopNameTh: { contains: search as string, mode: 'insensitive' } } },
        { unit: { unitCode: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.ttContract.findMany({
        where,
        include: {
          airport: { select: { airportCode: true, airportNameTh: true } },
          unit: { select: { unitCode: true, unitNameTh: true, areaSqm: true } },
          partner: { select: { partnerCode: true, nameTh: true, shopNameTh: true } },
          fixedRentDetail: { select: { monthlyRent: true } },
          revShareDetail: { select: { magAmount: true, revenueSharePct: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.ttContract.count({ where }),
    ]);

    // คำนวณวันที่เหลือของสัญญา
    const now = new Date();
    const data = contracts.map((c) => {
      const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyRent = c.fixedRentDetail?.monthlyRent
        ? Number(c.fixedRentDetail.monthlyRent)
        : c.revShareDetail?.magAmount
          ? Number(c.revShareDetail.magAmount)
          : null;

      return {
        id: c.id,
        contractNo: c.contractNo,
        contractType: c.contractType,
        contractStatus: c.contractStatus,
        airportCode: c.airport.airportCode,
        unitCode: c.unit.unitCode,
        areaSqm: Number(c.unit.areaSqm),
        partnerName: c.partner.nameTh,
        shopName: c.partner.shopNameTh,
        startDate: c.startDate,
        endDate: c.endDate,
        durationMonths: c.durationMonths,
        daysLeft,
        monthlyRent,
        currentStepNo: c.currentStepNo,
      };
    });

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[CONTRACT] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการสัญญาได้' });
  }
});

// GET /api/contracts/:id — รายละเอียดสัญญา
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await prisma.ttContract.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        airport: true,
        unit: { include: { zone: { include: { floor: { include: { building: true } } } } } },
        partner: true,
        fixedRentDetail: true,
        revShareDetail: { include: { tieredRates: { orderBy: { tierOrder: 'asc' } } } },
        consignDetail: true,
        realEstateDetail: true,
        deposit: true,
        approvalSteps: { orderBy: { stepNo: 'asc' } },
        documents: { where: { isLatest: true }, orderBy: { uploadedAt: 'desc' } },
        bills: { orderBy: { billingMonth: 'desc' }, take: 6 },
      },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: 'ไม่พบสัญญา' });
      return;
    }

    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('[CONTRACT] Detail error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายละเอียดสัญญาได้' });
  }
});

// POST /api/contracts — สร้างสัญญาใหม่ (จาก Wizard)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      contractType, airportId, unitId, partnerId,
      startDate, endDate, durationMonths, paymentDueDay,
      utilityRate, commonServiceFee, latePenaltyRate,
      // ข้อมูลตามประเภท
      fixedRent, revShare, consignment, realEstate,
      // หลักประกัน
      deposit,
    } = req.body;

    // สร้างเลขสัญญาอัตโนมัติ
    const year = new Date().getFullYear() + 543; // ปี พ.ศ.
    const count = await prisma.ttContract.count() + 1;
    const contractNo = `CTR-${year}-${String(count).padStart(3, '0')}`;

    const contract = await prisma.ttContract.create({
      data: {
        contractNo,
        contractType,
        contractStatus: 'DRAFT',
        airportId, unitId, partnerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        durationMonths,
        paymentDueDay: paymentDueDay || 5,
        utilityRate, commonServiceFee, latePenaltyRate,
        createdBy: req.user?.userId,

        // สร้างรายละเอียดตามประเภท
        ...(contractType === 'FIXED_RENT' && fixedRent ? {
          fixedRentDetail: { create: { monthlyRent: fixedRent.monthlyRent } },
        } : {}),

        ...(contractType === 'REVENUE_SHARING' && revShare ? {
          revShareDetail: {
            create: {
              magAmount: revShare.magAmount,
              revenueSharePct: revShare.revenueSharePct,
              calcMethod: revShare.calcMethod || 'HIGHER_OF_MAG_OR_SHARE',
              useTieredRate: revShare.useTieredRate || false,
              reportingFrequency: revShare.reportingFrequency || 'MONTHLY',
              reportDueDay: revShare.reportDueDay,
              verificationMethod: revShare.verificationMethod,
              ...(revShare.tieredRates?.length ? {
                tieredRates: {
                  createMany: { data: revShare.tieredRates },
                },
              } : {}),
            },
          },
        } : {}),

        ...(contractType === 'CONSIGNMENT' && consignment ? {
          consignDetail: { create: consignment },
        } : {}),

        ...(contractType === 'REAL_ESTATE' && realEstate ? {
          realEstateDetail: { create: realEstate },
        } : {}),

        // หลักประกัน
        ...(deposit ? {
          deposit: { create: deposit },
        } : {}),

        // สร้าง Workflow อนุมัติ 6 ขั้นตอน
        approvalSteps: {
          createMany: {
            data: [
              { stepNo: 1, stepName: 'เจ้าหน้าที่บันทึก', status: 'COMPLETED' },
              { stepNo: 2, stepName: 'หัวหน้าตรวจสอบ', status: 'PENDING' },
              { stepNo: 3, stepName: 'ผู้อำนวยการอนุมัติ', status: 'PENDING' },
              { stepNo: 4, stepName: 'ฝ่ายกฎหมาย', status: 'PENDING' },
              { stepNo: 5, stepName: 'ผู้มีอำนาจลงนาม', status: 'PENDING' },
              { stepNo: 6, stepName: 'มีผลบังคับใช้', status: 'PENDING' },
            ],
          },
        },
      },
    });

    // อัปเดตสถานะพื้นที่เป็น RESERVED
    await prisma.tmUnit.update({
      where: { id: unitId },
      data: { status: 'RESERVED' },
    });

    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    console.error('[CONTRACT] Create error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างสัญญาได้' });
  }
});

// POST /api/contracts/:id/renew — ต่ออายุสัญญา
router.post('/:id/renew', async (req: Request, res: Response) => {
  try {
    const oldContract = await prisma.ttContract.findUnique({
      where: { id: Number(req.params.id) },
      include: { fixedRentDetail: true, revShareDetail: true },
    });

    if (!oldContract) {
      res.status(404).json({ success: false, error: 'ไม่พบสัญญาเดิม' });
      return;
    }

    const { startDate, endDate, durationMonths, monthlyRent } = req.body;

    const year = new Date().getFullYear() + 543;
    const count = await prisma.ttContract.count() + 1;
    const contractNo = `CTR-${year}-${String(count).padStart(3, '0')}`;

    const newContract = await prisma.ttContract.create({
      data: {
        contractNo,
        contractType: oldContract.contractType,
        contractStatus: 'DRAFT',
        airportId: oldContract.airportId,
        unitId: oldContract.unitId,
        partnerId: oldContract.partnerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        durationMonths,
        paymentDueDay: oldContract.paymentDueDay,
        utilityRate: oldContract.utilityRate,
        commonServiceFee: oldContract.commonServiceFee,
        latePenaltyRate: oldContract.latePenaltyRate,
        previousContractId: oldContract.id,
        renewalCount: oldContract.renewalCount + 1,
        createdBy: req.user?.userId,
        ...(oldContract.contractType === 'FIXED_RENT' ? {
          fixedRentDetail: { create: { monthlyRent: monthlyRent || oldContract.fixedRentDetail?.monthlyRent || 0 } },
        } : {}),
      },
    });

    res.status(201).json({ success: true, data: newContract });
  } catch (err) {
    console.error('[CONTRACT] Renew error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถต่ออายุสัญญาได้' });
  }
});

// POST /api/contracts/:id/approve — อนุมัติขั้นตอนถัดไป
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const contract = await prisma.ttContract.findUnique({
      where: { id: Number(req.params.id) },
      include: { approvalSteps: { orderBy: { stepNo: 'asc' } } },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: 'ไม่พบสัญญา' });
      return;
    }

    const currentStep = contract.approvalSteps.find((s) => s.status === 'PENDING');
    if (!currentStep) {
      res.status(400).json({ success: false, error: 'ไม่มีขั้นตอนที่รออนุมัติ' });
      return;
    }

    // อนุมัติขั้นตอนปัจจุบัน
    await prisma.ttApprovalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'COMPLETED',
        completedBy: req.user?.userId,
        completedAt: new Date(),
        remarks: req.body.remarks,
      },
    });

    // อัปเดตสถานะสัญญา
    const nextStepNo = currentStep.stepNo + 1;
    const statusMap: Record<number, string> = {
      2: 'PENDING_REVIEW',
      3: 'PENDING_APPROVAL',
      4: 'PENDING_LEGAL',
      5: 'PENDING_SIGNATURE',
      6: 'ACTIVE',
    };

    const newStatus = statusMap[nextStepNo] || (nextStepNo > 6 ? 'ACTIVE' : undefined);

    await prisma.ttContract.update({
      where: { id: contract.id },
      data: {
        currentStepNo: nextStepNo,
        ...(newStatus ? { contractStatus: newStatus as any } : {}),
        ...(nextStepNo > 6 ? {
          approvedBy: req.user?.userId,
          approvedAt: new Date(),
        } : {}),
      },
    });

    // ถ้าสัญญา ACTIVE แล้ว อัปเดตสถานะพื้นที่เป็น LEASED
    if (newStatus === 'ACTIVE') {
      await prisma.tmUnit.update({
        where: { id: contract.unitId },
        data: { status: 'LEASED' },
      });
    }

    res.json({ success: true, message: `อนุมัติขั้นตอน ${currentStep.stepName} เรียบร้อย` });
  } catch (err) {
    console.error('[CONTRACT] Approve error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถอนุมัติได้' });
  }
});

export default router;
