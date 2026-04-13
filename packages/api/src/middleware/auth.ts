import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../lib/jwt.js';

// เพิ่ม user ลงใน Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware ตรวจสอบ JWT Token — ต้อง login ก่อนเข้าถึง
export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบ��' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token หมดอายุหรือไม่ถูกต้อง' });
  }
}

// Middleware ตรวจสอบ Role — จำกัดสิทธิ์ต���ม role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' });
      return;
    }

    next();
  };
}
