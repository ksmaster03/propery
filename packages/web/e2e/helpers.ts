import { BrowserContext } from '@playwright/test';

// Helper: ตั้ง auth state ก่อนทุก test เพื่อข้าม login page
// (ใช้ fake token ที่ตรงกับ expected structure ของ Zustand persist)
export async function setMockAuth(context: BrowserContext) {
  await context.addInitScript(() => {
    // Auth store ของ Zustand persist ใช้ key 'doa-auth'
    window.localStorage.setItem('doa-auth', JSON.stringify({
      state: {
        user: { userId: 'USR-001', username: 'admin', email: 'admin@doa.go.th', role: 'ADMIN' },
        accessToken: 'mock-access-token-for-testing',
        refreshToken: 'mock-refresh-token-for-testing',
        mode: 'admin',
      },
      version: 0,
    }));
    // Reset locale เป็นไทยเพื่อ deterministic
    window.localStorage.setItem('doa-locale', JSON.stringify({
      state: { locale: 'th' },
      version: 0,
    }));
  });
}
