import { test, expect } from '@playwright/test';

test.describe('Contract Create Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts/create');
  });

  test('แสดง Stepper 6 ขั้นตอน', async ({ page }) => {
    await expect(page.getByText('ข้อมูลพื้นที่').first()).toBeVisible();
    await expect(page.getByText('ข้อมูลผู้เช่า').first()).toBeVisible();
    await expect(page.getByText('เงื่อนไขสัญญา').first()).toBeVisible();
    await expect(page.getByText('ร่างสัญญา').first()).toBeVisible();
  });

  test('Step 1 แสดงฟิลด์ข้อมูลพื้นที่', async ({ page }) => {
    await expect(page.getByText('ข้อมูลพื้นที่เช่า')).toBeVisible();
  });

  test('ปุ่ม ถัดไป นำทางไป Step 2', async ({ page }) => {
    await page.getByRole('button', { name: /ถัดไป/ }).click();
    await expect(page.getByText('ข้อมูลผู้เช่า / คู่สัญญา')).toBeVisible();
  });

  test('Step 3 แสดงประเภทสัญญา 4 แบบ', async ({ page }) => {
    // ไป Step 3
    await page.getByRole('button', { name: /ถัดไป/ }).click();
    await page.getByRole('button', { name: /ถัดไป/ }).click();

    await expect(page.getByText('ค่าเช่าคงที่').first()).toBeVisible();
    await expect(page.getByText('ปันผลประโยชน์').first()).toBeVisible();
    await expect(page.getByText('ฝากขาย').first()).toBeVisible();
    await expect(page.getByText('อสังหาริมทรัพย์').first()).toBeVisible();
  });

  test('ปุ่มย้อนกลับทำงาน', async ({ page }) => {
    await page.getByRole('button', { name: /ถัดไป/ }).click();
    await expect(page.getByText('ข้อมูลผู้เช่า / คู่สัญญา')).toBeVisible();
    await page.getByRole('button', { name: /ย้อนกลับ/ }).click();
    await expect(page.getByText('ข้อมูลพื้นที่เช่า')).toBeVisible();
  });
});

test.describe('Contract Renewal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts/renew');
  });

  test('แสดงรายการสัญญาใกล้หมดอายุ', async ({ page }) => {
    await expect(page.getByText('ครัวไทย').first()).toBeVisible();
    await expect(page.getByText('The Brew Coffee').first()).toBeVisible();
  });

  test('คลิกปุ่มต่อสัญญาเปิด Modal', async ({ page }) => {
    await page.getByRole('button', { name: /ต่อสัญญา/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('ต่ออายุสัญญาเช่า')).toBeVisible();
  });
});
