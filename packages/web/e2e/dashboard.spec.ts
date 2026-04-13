import { test, expect } from '@playwright/test';

test.describe('หน้า Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('แสดง KPI Cards 5 ตัว', async ({ page }) => {
    await expect(page.getByText('พื้นที่ทั้งหมด (ยูนิต)')).toBeVisible();
    await expect(page.getByText('พื้นที่เช่าแล้ว')).toBeVisible();
    await expect(page.getByText('พื้นที่ว่าง').first()).toBeVisible();
    await expect(page.getByText('รอทำสัญญา')).toBeVisible();
    await expect(page.getByText('รายรับเดือนนี้ (บาท)')).toBeVisible();
  });

  test('แสดงตัวเลข KPI ถูกต้อง', async ({ page }) => {
    // รายรับในรูป 4.27M (ไม่ซ้ำในหน้าอื่น)
    await expect(page.getByText('4.27M')).toBeVisible();
    // 70.8% อัตราการเช่า
    await expect(page.getByText(/70\.8%/)).toBeVisible();
  });

  test('แสดงกราฟรายรับรายเดือน', async ({ page }) => {
    await expect(page.getByText('รายรับค่าเช่ารายเดือน (บาท)')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('แสดงรายการสัญญาใกล้หมดอายุ', async ({ page }) => {
    await expect(page.getByText('สัญญาใกล้หมดอายุ', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('ร้านอาหาร ครัวไทย (A-104)')).toBeVisible();
    await expect(page.getByText('ร้านกาแฟ The Brew (B-201)')).toBeVisible();
  });

  test('แสดงการแบ่งรายได้ 3 ส่วน', async ({ page }) => {
    await expect(page.getByText('การแบ่งรายได้ (เดือนนี้)')).toBeVisible();
    await expect(page.getByText('กรมธนารักษ์')).toBeVisible();
    await expect(page.getByText('กองทุนสวัสดิการ ทย.')).toBeVisible();
    await expect(page.getByText('เงินทุนหมุนเวียน ทย.')).toBeVisible();
  });
});
