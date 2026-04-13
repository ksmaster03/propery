import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { adminOnly } from '../../middleware/permissions.js';

const router = Router();

// === User Management — จัดการเจ้าหน้าที่ระบบ (เฉพาะ ADMIN) ===

// GET /api/users — list
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, role, active } = req.query;
    const where: any = {};
    if (active === 'true') where.isActive = true;
    if (role) where.role = role as string;
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { userId: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    const users = await prisma.tmUser.findMany({
      where,
      select: {
        id: true, userId: true, username: true, email: true, fullName: true,
        organizationId: true, departmentCode: true, role: true, isActive: true,
        phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('[USER] List error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงรายการได้' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.tmUser.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true, userId: true, username: true, email: true, fullName: true,
        organizationId: true, departmentCode: true, role: true, isActive: true,
        phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// POST /api/users — create (admin only)
router.post('/', adminOnly, async (req: Request, res: Response) => {
  try {
    const { username, password, email, fullName, role, phone, organizationId, departmentCode } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({ success: false, error: 'username, password, role เป็นค่าจำเป็น' });
      return;
    }

    // สร้าง userId อัตโนมัติ
    const count = await prisma.tmUser.count();
    const userId = `USR-${String(count + 1).padStart(3, '0')}`;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.tmUser.create({
      data: {
        userId,
        username,
        passwordHash,
        email,
        fullName,
        role,
        phone,
        organizationId,
        departmentCode,
        isActive: true,
      },
      select: {
        id: true, userId: true, username: true, email: true, fullName: true,
        role: true, isActive: true, phone: true, createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    console.error('[USER] Create error:', err);
    if (err.code === 'P2002') {
      res.status(400).json({ success: false, error: 'username หรือ userId นี้มีในระบบแล้ว' });
      return;
    }
    res.status(500).json({ success: false, error: 'ไม่สามารถสร้างผู้ใช้ได้' });
  }
});

// PUT /api/users/:id — update (admin only)
router.put('/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest };
    // ถ้ามี password ใหม่ให้ hash
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    // ลบ field ที่ไม่ควร update
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.userId;

    const user = await prisma.tmUser.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      select: {
        id: true, userId: true, username: true, email: true, fullName: true,
        role: true, isActive: true, phone: true, updatedAt: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[USER] Update error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถแก้ไขได้' });
  }
});

// DELETE /api/users/:id — soft delete
router.delete('/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    await prisma.tmUser.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'ไม่สามารถลบได้' });
  }
});

export default router;
