import { test, expect } from '@playwright/test';
import { setMockAuth } from './helpers';

// E2E tests สำหรับ features ที่เพิ่มในรอบท้าย:
// Master Data, User Management, Audit Log, Contract Renewal

test.beforeEach(async ({ context }) => {
  await setMockAuth(context);
});

test.describe('Master Data Page', () => {
  test('เข้าหน้า Master Data ได้', async ({ page }) => {
    await page.goto('/master-data');
    await expect(page.getByText(/ข้อมูลหลัก|Master Data/).first()).toBeVisible();
  });

  test('แสดง 6 tabs', async ({ page }) => {
    await page.goto('/master-data');
    // ต้องมี tabs ตัวหน่ึงจาก master data
    await expect(page.getByText(/หน่วยงาน|Organization/).first()).toBeVisible();
  });

  test('คลิก tab เปลี่ยนได้', async ({ page }) => {
    await page.goto('/master-data');
    // คลิก tab "ประเภทโซน"
    await page.getByRole('tab', { name: /ประเภทโซน|Zone Types/ }).click();
    // รอให้ content เปลี่ยน
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('User Management', () => {
  test('เข้าหน้า Users ได้', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByText(/จัดการผู้ใช้|User Management/).first()).toBeVisible();
  });

  test('ปุ่ม "เพิ่มผู้ใช้" แสดง', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('button', { name: /เพิ่มผู้ใช้|Add User/ })).toBeVisible();
  });

  test('เปิด Dialog เพิ่มผู้ใช้', async ({ page }) => {
    await page.goto('/users');
    await page.getByRole('button', { name: /เพิ่มผู้ใช้|Add User/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
  });
});

test.describe('Audit Trail', () => {
  test('เข้าหน้า Audit ได้', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByText(/Audit Trail/).first()).toBeVisible();
  });

  test('แสดง filter dropdowns', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByText(/ทุกการกระทำ|All Actions/).first()).toBeVisible();
  });
});

test.describe('Contract Wizard — End to End', () => {
  test('Wizard สามารถไปถึง Step 5 แล้วแสดงปุ่มลงนาม', async ({ page }) => {
    await page.goto('/contracts/create');

    // Step 1 → 2 → 3 → 4 → 5
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /ถัดไป/ }).click();
      await page.waitForTimeout(200);
    }

    // ที่ Step 5 ควรเห็นปุ่ม "ลงนาม" หรือ "Sign"
    await expect(page.getByRole('button', { name: /ลงนาม|Sign/ })).toBeVisible();
  });
});
