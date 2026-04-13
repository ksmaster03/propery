import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// โครงสร้าง payload ที่เก็บใน token
export interface JwtPayload {
  userId: string;
  role: string;
}

// สร้าง Access Token (อายุสั้น เช่น 15 นาที)
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// สร้าง Refresh Token (อายุยาว เช่น 7 วั��)
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

// ตรวจสอบ Access Token
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

// ตรวจสอบ Refresh Token
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
