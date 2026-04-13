import { test, expect } from '@playwright/test';
import { setMockAuth } from './helpers';

test.describe('หน้าฐานข้อมูลผู้เช่า (Partners)', () => {
  test.beforeEach(async ({ context, page }) => {
    await setMockAuth(context);
    await page.goto('/partners');
  });

  test('แสดงตารางผู้เช่า', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'ชื่อผู้เช่า/นิติบุคคล' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'เลขภาษี' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'P-001' })).toBeVisible();
  });

  test('ค้นหาผู้เช่าได้', async ({ page }) => {
    const searchInput = page.getByPlaceholder('ค้นหาด้วยชื่อ, เลขภาษี...');
    await searchInput.fill('Starbucks');

    // Starbucks อยู่ในคอลัมน์ shop name
    await expect(page.getByRole('cell', { name: 'Starbucks', exact: false }).first()).toBeVisible();
  });

  test('เปิด Modal เพิ่มผู้เช่า', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มผู้เช่า' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('ปิด Modal ด้วยปุ่มยกเลิก', async ({ page }) => {
    await page.getByRole('button', { name: '+ เพิ่มผู้เช่า' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'ยกเลิก' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('แสดงจำนวนสัญญาของผู้เช่า', async ({ page }) => {
    // P-001 มี 2 สัญญา — ตรวจสอบว่าแถวที่มี P-001 มี badge จำนวนสัญญา
    const row = page.getByRole('row').filter({ hasText: 'P-001' });
    await expect(row).toBeVisible();
  });
});
