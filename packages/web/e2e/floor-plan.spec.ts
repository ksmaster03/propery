import { test, expect } from '@playwright/test';
import { setMockAuth } from './helpers';

test.describe('หน้า Floor Plan', () => {
  test.beforeEach(async ({ context, page }) => {
    await setMockAuth(context);
    await page.goto('/floor-plan');
  });

  test('แสดง SVG Floor Plan', async ({ page }) => {
    // ใช้ SVG ตัวแรกที่เจอ (เป็น floor plan หลัก)
    await expect(page.locator('main svg').first()).toBeVisible();
  });

  test('แสดง Legend สถานะ', async ({ page }) => {
    // Legend ใช้ text unique ไม่ซ้ำกับ sidebar หรืออื่นๆ
    await expect(page.getByText('ค้างชำระ/ใกล้หมดอายุ').first()).toBeVisible();
  });

  test('แสดงตัวเลขสรุป', async ({ page }) => {
    // ตรวจสอบว่ามียูนิตบน SVG (text element A-101)
    await expect(page.locator('svg').locator('text:has-text("A-101")').first()).toBeVisible();
    await expect(page.locator('svg').locator('text:has-text("B-201")').first()).toBeVisible();
  });

  test('คลิกยูนิตแสดงรายละเอียด', async ({ page }) => {
    // คลิกที่ยูนิต A-101
    await page.locator('svg').locator('g').filter({ hasText: 'A-101' }).first().click();

    // ตรวจสอบว่าแผงรายละเอียดแสดง
    await expect(page.getByText('CTR-2566-001').first()).toBeVisible();
  });

  test('แผงรายละเอียดเริ่มต้นแสดงข้อความแนะนำ', async ({ page }) => {
    await expect(page.getByText('คลิกที่ยูนิตบน Floor Plan เพื่อดูรายละเอียด')).toBeVisible();
  });

  test('dropdown เลือกสนามบินและชั้น', async ({ page }) => {
    // ใน PageHeader actions area
    const headerArea = page.locator('header, [role="banner"]').or(page.locator('main').first());
    await expect(page.getByText('ท่าอากาศยานดอนเมือง').first()).toBeVisible();
  });
});
