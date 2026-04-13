import { beforeAll, afterAll } from 'vitest';

// ตั้งค่าสิ่งแวดล้อมสำหรับ test
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

afterAll(() => {
  // ล้างค่าหลัง test เสร็จ
});
