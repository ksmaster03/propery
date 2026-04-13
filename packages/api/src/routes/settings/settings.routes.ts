import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { adminOnly } from '../../middleware/permissions.js';

const router = Router();

// === Settings API — ใช้ TmConfig เก็บ key-value ===

// GET /api/settings — ดึงค่าทั้งหมด (return เป็น object { key: value })
router.get('/', async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.tmConfig.findMany();
    const data: Record<string, string> = {};
    for (const c of configs) {
      data[c.configKey] = c.configValue;
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('[SETTINGS] Get error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// PUT /api/settings — บันทึกค่าหลายค่าพร้อมกัน (admin only)
router.put('/', adminOnly, async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, string | number>;
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      const result = await prisma.tmConfig.upsert({
        where: { configKey: key },
        create: { configKey: key, configValue: String(value), updatedBy: req.user?.userId },
        update: { configValue: String(value), updatedBy: req.user?.userId },
      });
      results.push(result);
    }

    res.json({ success: true, data: results, message: `บันทึก ${results.length} ค่า` });
  } catch (err) {
    console.error('[SETTINGS] Update error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถบันทึกได้' });
  }
});

export default router;
