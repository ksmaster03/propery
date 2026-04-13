import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../../uploads');

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ตั้งค่า multer — เก็บไฟล์บน disk, ตั้งชื่อแบบ unique
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
    cb(null, name);
  },
});

// จำกัดประเภทไฟล์ + ขนาด
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|svg|pdf|doc|docx|xls|xlsx)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('ประเภทไฟล์ไม่รองรับ'));
  },
});

const router = Router();

// POST /api/upload — อัปโหลดไฟล์เดียว
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'ไม่พบไฟล์' });
    return;
  }
  // ส่ง URL กลับให้ frontend ใช้งาน
  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: `/api/upload/${req.file.filename}`,
    },
  });
});

// POST /api/upload/multiple — อัปโหลดหลายไฟล์ (สำหรับเอกสารสัญญา)
router.post('/multiple', upload.array('files', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ success: false, error: 'ไม่พบไฟล์' });
    return;
  }
  res.json({
    success: true,
    data: files.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      url: `/api/upload/${f.filename}`,
    })),
  });
});

// GET /api/upload/:filename — ดาวน์โหลด / เสิร์ฟไฟล์
router.get('/:filename', (req: Request, res: Response) => {
  const filename = String(req.params.filename || '');
  // ป้องกัน path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ success: false, error: 'ชื่อไฟล์ไม่ถูกต้อง' });
    return;
  }
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: 'ไม่พบไฟล์' });
    return;
  }
  res.sendFile(filePath);
});

export default router;
