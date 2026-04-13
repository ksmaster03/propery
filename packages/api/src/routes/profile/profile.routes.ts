import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// === Profile API — ผู้ใช้แก้ข้อมูลตัวเองได้ ===

// GET /api/profile — ดึงข้อมูลตัวเอง
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }
    const user = await prisma.tmUser.findUnique({
      where: { userId: req.user.userId },
      select: {
        id: true, userId: true, username: true, email: true, fullName: true,
        phone: true, avatarUrl: true, role: true, departmentCode: true,
        organizationId: true, lastLoginAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[PROFILE] Get error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// PUT /api/profile — แก้ไขข้อมูลตัวเอง (ไม่รวมรหัสผ่าน)
router.put('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }
    const { fullName, email, phone, avatarUrl, departmentCode } = req.body;

    const user = await prisma.tmUser.update({
      where: { userId: req.user.userId },
      data: { fullName, email, phone, avatarUrl, departmentCode },
      select: {
        id: true, userId: true, username: true, email: true, fullName: true,
        phone: true, avatarUrl: true, role: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[PROFILE] Update error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขได้' });
  }
});

// PUT /api/profile/password — เปลี่ยนรหัสผ่าน
router.put('/password', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
      return;
    }

    const user = await prisma.tmUser.findUnique({ where: { userId: req.user.userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.tmUser.update({
      where: { userId: req.user.userId },
      data: { passwordHash: newHash },
    });
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('[PROFILE] Password error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
  }
});

export default router;
