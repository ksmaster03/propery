import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

// Middleware บันทึก audit log สำหรับ write operations (POST/PUT/DELETE)
// เรียกหลังจาก handler finish และ response ถูกส่งแล้ว
export function auditLog(tableName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // ข้าม ถ้าไม่ใช่ write op
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }

    // Hook ลงใน res.end เพื่อ log หลัง response finish
    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
      // Log async (ไม่รอ)
      if (req.user && res.statusCode < 400) {
        const action =
          req.method === 'POST' ? 'CREATE' :
          req.method === 'DELETE' ? 'DELETE' :
          'UPDATE';

        const recordId = Number(req.params.id || 0);
        prisma.ttAuditLog.create({
          data: {
            tableName,
            recordId,
            action: action as any,
            userId: req.user.userId,
            ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
            userAgent: req.headers['user-agent']?.substring(0, 500) || null,
            newValue: JSON.stringify(req.body).substring(0, 2000),
          },
        }).catch((e) => console.error('[AUDIT] Failed to log:', e.message));
      }
      return originalEnd(...args);
    };

    next();
  };
}
