import { Request, Response, NextFunction } from 'express';

// Middleware อ่าน X-Organization-Id header แล้วใส่ลง req.orgId
// Frontend จะส่ง header นี้ตาม activeOrgId ของ user

declare global {
  namespace Express {
    interface Request {
      orgId?: number;
    }
  }
}

export function orgContext(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['x-organization-id'];
  if (header) {
    const id = parseInt(String(header), 10);
    if (!isNaN(id) && id > 0) {
      req.orgId = id;
    }
  }
  next();
}
