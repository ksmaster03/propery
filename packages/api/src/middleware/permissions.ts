import { Request, Response, NextFunction } from 'express';

// === Role hierarchy ===
// ADMIN > SUPERVISOR > OPERATOR > TENANT
// permission middleware ที่ใช้กับ route write operations
const ROLE_LEVEL: Record<string, number> = {
  TENANT: 0,
  OPERATOR: 1,
  SUPERVISOR: 2,
  ADMIN: 3,
};

// ต้องมี role >= level ที่กำหนด
export function minRole(required: keyof typeof ROLE_LEVEL) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }
    const userLevel = ROLE_LEVEL[req.user.role] ?? -1;
    const requiredLevel = ROLE_LEVEL[required];
    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: `ไม่มีสิทธิ์ — ต้องมีสิทธิ์ระดับ ${required} หรือสูงกว่า`,
      });
      return;
    }
    next();
  };
}

// ห้าม TENANT เข้าถึง admin endpoints
export const blockTenant = minRole('OPERATOR');
// เฉพาะ supervisor ขึ้นไปแก้ข้อมูลได้
export const canEdit = minRole('SUPERVISOR');
// เฉพาะ admin เท่านั้นที่ลบได้ หรือจัดการ master data
export const adminOnly = minRole('ADMIN');
