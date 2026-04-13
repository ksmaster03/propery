import { test, expect } from '@playwright/test';
import { setMockAuth } from './helpers';

test.describe('หน้ารายการพื้นที่เช่า (Units)', () => {
  test.beforeEach(async ({ context, page }) => {
    await setMockAuth(context);
    await page.goto('/units');
  });

  test('แสดงตารางพื้นที่เช่า', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'รหัสพื้นที่' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'สถานะ' })).toBeVisible();
    // ตรวจสอบว่ามียูนิตในตาราง (A-101 ในคอลัมน์รหัส)
    await expect(page.getByRole('cell', { name: 'A-101', exact: true })).toBeVisible();
  });

  test('ค้นหาพื้นที่เช่าได้', async ({ page }) => {
    const searchInput = page.getByPlaceholder('ค้นหาด้วยรหัสหรือชื่อ...');
    await searchInput.fill('B-201');

    // ใช้ exact match เพื่อไม่ให้ไปแมทช์ "คูหา B-201"
    await expect(page.getByRole('cell', { name: 'B-201', exact: true })).toBeVisible();
  });

  test('ปุ่ม + เพิ่มพื้นที่ แสดงอยู่', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ เพิ่มพื้นที่' })).toBeVisible();
  });

  test('แสดง badge สถานะถูกต้อง', async ({ page }) => {
    // ตรวจสอบว่ามี badges สถานะ "เช่าแล้ว" ในตาราง
    await expect(page.getByRole('cell').filter({ hasText: 'เช่าแล้ว' }).first()).toBeVisible();
  });
});
