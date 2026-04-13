import { describe, it, expect } from 'vitest';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt.js';

describe('JWT Utility', () => {
  const payload = { userId: 'USR-001', role: 'ADMIN' };

  describe('signAccessToken + verifyAccessToken', () => {
    it('สร้างและตรวจสอบ access token ได้ถูกต้อง', () => {
      const token = signAccessToken(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe('USR-001');
      expect(decoded.role).toBe('ADMIN');
    });

    it('ตรวจจับ token ที่ไม่ถูกต้อง', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('ตรวจจับ token ที่ถูกแก้ไข', () => {
      const token = signAccessToken(payload);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('signRefreshToken + verifyRefreshToken', () => {
    it('สร้างและตรวจสอบ refresh token ได้ถูกต้อง', () => {
      const token = signRefreshToken(payload);
      expect(token).toBeTruthy();

      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe('USR-001');
      expect(decoded.role).toBe('ADMIN');
    });

    it('access token ไม่สามารถใช้ verify เป็น refresh token ได้', () => {
      const accessToken = signAccessToken(payload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('Token payload', () => {
    it('รองรับ role ที่แตกต่างกัน', () => {
      const roles = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'TENANT'];
      roles.forEach((role) => {
        const token = signAccessToken({ userId: 'USR-001', role });
        const decoded = verifyAccessToken(token);
        expect(decoded.role).toBe(role);
      });
    });

    it('เก็บ userId ไว้ใน token ถูกต้อง', () => {
      const ids = ['USR-001', 'USR-999', 'P-001'];
      ids.forEach((userId) => {
        const token = signAccessToken({ userId, role: 'ADMIN' });
        const decoded = verifyAccessToken(token);
        expect(decoded.userId).toBe(userId);
      });
    });
  });
});
