import { test, expect } from '@playwright/test';

test.describe('การนำทางหลัก (Navigation)', () => {
  test('เข้าหน้า Dashboard ได้', async ({ page }) => {
    await page.goto('/');

    // ตรวจสอบ Topbar แสดงชื่อระบบ (ใช้ role เจาะจง)
    await expect(page.getByText('ระบบบริหารสัญญาเช่า', { exact: false }).first()).toBeVisible();

    // ตรวจสอบ KPI cards แสดง
    await expect(page.getByText('พื้นที่ทั้งหมด (ยูนิต)')).toBeVisible();
    await expect(page.getByText('พื้นที่เช่าแล้ว')).toBeVisible();
  });

  test('คลิก Floor Plan ในเมนูไปที่หน้า Floor Plan', async ({ page }) => {
    await page.goto('/');
    await page.getByText('แผนผังพื้นที่', { exact: false }).first().click();
    await expect(page).toHaveURL('/floor-plan');
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('คลิก Units ในเมนูไปที่หน้ารายการพื้นที่เช่า', async ({ page }) => {
    await page.goto('/');
    await page.getByText('รายการพื้นที่เช่า', { exact: true }).click();
    await expect(page).toHaveURL('/units');
    await expect(page.getByRole('columnheader', { name: 'รหัสพื้นที่' })).toBeVisible();
  });

  test('คลิก Partners ในเมนูไปที่หน้าฐานข้อมูลผู้เช่า', async ({ page }) => {
    await page.goto('/');
    await page.getByText('ฐานข้อมูลผู้เช่า').click();
    await expect(page).toHaveURL('/partners');
    await expect(page.getByRole('columnheader', { name: 'เลขภาษี' })).toBeVisible();
  });

  test('คลิก Contracts ในเมนูไปที่หน้ารายการสัญญา', async ({ page }) => {
    await page.goto('/');
    await page.getByText('รายการสัญญา', { exact: true }).click();
    await expect(page).toHaveURL('/contracts');
  });

  test('คลิก Billing ในเมนูไปที่หน้าใบชำระค่าเช่า', async ({ page }) => {
    await page.goto('/');
    await page.getByText('ใบชำระค่าเช่า').click();
    await expect(page).toHaveURL('/billing');
  });

  test('คลิก Revenue Report ในเมนู', async ({ page }) => {
    await page.goto('/');
    // เมนูใน Sidebar มี text "รายงานรายได้" ซ้ำในหลาย element
    // ใช้ locator ที่มี icon trending_up เจาะจง
    await page.locator('span.material-icons-outlined:has-text("trending_up")').locator('..').click();
    await expect(page).toHaveURL('/reports/revenue');
  });
});

test.describe('สลับภาษา (i18n)', () => {
  test('สลับจากไทยเป็นอังกฤษได้', async ({ page }) => {
    await page.goto('/');

    // คลิกปุ่ม EN (ใช้ role button)
    await page.getByRole('button', { name: 'EN' }).click();

    // ตรวจว่าเปลี่ยนเป็นภาษาอังกฤษ (ชื่อระบบเป็นอังกฤษ)
    await expect(page.getByText('Commercial Lease Management System').first()).toBeVisible();
  });

  test('สลับกลับเป็นไทยได้', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByText('Commercial Lease Management System').first()).toBeVisible();

    await page.getByRole('button', { name: 'TH' }).click();
    await expect(page.getByText('ระบบบริหารสัญญาเช่า', { exact: false }).first()).toBeVisible();
  });
});
