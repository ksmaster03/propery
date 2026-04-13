import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authGuard, requireRole } from './auth.js';
import { signAccessToken } from '../lib/jwt.js';

// สร้าง mock request/response
function createMockReqRes(headers: Record<string, string> = {}) {
  const req = { headers, user: undefined } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('authGuard middleware', () => {
  it('ปล่อยผ่านเมื่อมี token ที่ถูกต้อง', () => {
    const token = signAccessToken({ userId: 'USR-001', role: 'ADMIN' });
    const { req, res, next } = createMockReqRes({
      authorization: `Bearer ${token}`,
    });

    authGuard(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('USR-001');
    expect(req.user?.role).toBe('ADMIN');
  });

  it('ส่ง 401 เมื่อไม่มี Authorization header', () => {
    const { req, res, next } = createMockReqRes();

    authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('ส่ง 401 เมื่อ token ไม่ถูกต้อง', () => {
    const { req, res, next } = createMockReqRes({
      authorization: 'Bearer invalid-token',
    });

    authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('ส่ง 401 เมื่อ header format ไม่ถูกต้อง (ไม่มี Bearer)', () => {
    const token = signAccessToken({ userId: 'USR-001', role: 'ADMIN' });
    const { req, res, next } = createMockReqRes({
      authorization: token, // ขาด "Bearer " prefix
    });

    authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole middleware', () => {
  it('ปล่อยผ่านเมื่อ role ตรง', () => {
    const token = signAccessToken({ userId: 'USR-001', role: 'ADMIN' });
    const { req, res, next } = createMockReqRes({
      authorization: `Bearer ${token}`,
    });

    // จำลอง authGuard ก่อน
    authGuard(req, res, vi.fn());

    const roleMiddleware = requireRole('ADMIN', 'SUPERVISOR');
    roleMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('ส่ง 403 เมื่อ role ไม่ตรง', () => {
    const token = signAccessToken({ userId: 'USR-001', role: 'OPERATOR' });
    const { req, res, next } = createMockReqRes({
      authorization: `Bearer ${token}`,
    });

    authGuard(req, res, vi.fn());

    const roleMiddleware = requireRole('ADMIN');
    roleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('ส่ง 401 เมื่อไม่มี user (ยังไม่ผ่าน authGuard)', () => {
    const { req, res, next } = createMockReqRes();

    const roleMiddleware = requireRole('ADMIN');
    roleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
