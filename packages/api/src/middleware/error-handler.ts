import { Request, Response, NextFunction } from 'express';

// จัดการ Error กลาง — จับ error ทั้งหมดที่หลุดจาก route handler
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message, err.stack);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'เกิดข้อผิดพลาดภายในระบบ'
      : err.message,
  });
}
