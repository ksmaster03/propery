import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt.js';

const router = Router();

// POST /api/auth/login — เข้าสู่ระบบสำหรับเจ้าหน้าที่
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'กรุณาระบุ username และ password' });
      return;
    }

    const user = await prisma.tmUser.findFirst({
      where: { username, isActive: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    // อัปเดตเวลาเข้าสู่ระบบล่าสุด
    await prisma.tmUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { userId: user.userId, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

// POST /api/auth/refresh — ต่ออายุ token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'กรุณาระบุ refreshToken' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    const newRefreshToken = signRefreshToken({ userId: payload.userId, role: payload.role });

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Refresh token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
});

// POST /api/auth/portal-login — เข้าสู่ระบบสำหรับผู้เช่า (Tenant Portal)
router.post('/portal-login', async (req: Request, res: Response) => {
  try {
    const { taxId, password } = req.body;

    if (!taxId || !password) {
      res.status(400).json({ success: false, error: 'กรุณาระบุเลขภาษีและรหัสผ่าน' });
      return;
    }

    const partner = await prisma.tmPartner.findFirst({
      where: { taxId, isActive: true },
    });

    if (!partner || !partner.portalPasswordHash) {
      res.status(401).json({ success: false, error: 'เลขภาษีหรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    const valid = await bcrypt.compare(password, partner.portalPasswordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'เลขภาษีหรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    await prisma.tmPartner.update({
      where: { id: partner.id },
      data: { portalLastLoginAt: new Date() },
    });

    const payload = { userId: partner.partnerCode, role: 'TENANT' };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        partner: {
          partnerCode: partner.partnerCode,
          nameTh: partner.nameTh,
          shopNameTh: partner.shopNameTh,
        },
      },
    });
  } catch (err) {
    console.error('[AUTH] Portal login error:', err);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

export default router;
