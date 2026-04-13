import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/audit — list audit logs with filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tableName, userId, action, page = '1', limit = '50' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (tableName) where.tableName = tableName as string;
    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;

    const [logs, total] = await Promise.all([
      prisma.ttAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.ttAuditLog.count({ where }),
    ]);

    res.json({ success: true, data: logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[AUDIT] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

export default router;
