import { test, expect } from '@playwright/test';
import { setMockAuth } from './helpers';

// === Smoke tests ครอบคลุมทุกหน้า — ตรวจ render + ไม่มี error ===

// ตั้ง auth + locale ก่อนทุก test — ป้องกัน state รั่วจาก test อื่น
test.beforeEach(async ({ context }) => {
  await setMockAuth(context);
});

test.describe('Billing & Receipt', () => {
  test('หน้า Billing แสดง KPI + Table', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByText('ใบชำระค่าเช่า').first()).toBeVisible();
    // ตาราง column headers
    await expect(page.getByRole('columnheader', { name: 'เลขบิล' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'สถานะ' })).toBeVisible();
  });

  test('Billing — สลับ Tab ได้', async ({ page }) => {
    await page.goto('/billing');
    await page.getByRole('tab', { name: /เกินกำหนด/ }).click();
    // หลังสลับ tab ยังเห็นตารางอยู่
    await expect(page.locator('table')).toBeVisible();
  });

  test('Billing — ปุ่มสร้างบิลรายเดือน แสดง', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByRole('button', { name: /สร้างบิลรายเดือน/ })).toBeVisible();
  });

  test('หน้า Receipt แสดงรายการใบเสร็จ', async ({ page }) => {
    await page.goto('/receipts');
    await expect(page.getByText('ใบเสร็จรับเงิน').first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /เลขใบเสร็จ/ })).toBeVisible();
  });

  test('Receipt — ค้นหาได้', async ({ page }) => {
    await page.goto('/receipts');
    const search = page.getByPlaceholder(/ค้นหา/);
    await search.fill('REC-202603-001');
    await expect(page.getByRole('cell', { name: 'REC-202603-001' })).toBeVisible();
  });
});

test.describe('Contract List', () => {
  test('แสดงรายการสัญญา', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByRole('cell', { name: 'CTR-2566-001' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CTR-2566-002' })).toBeVisible();
  });

  test('ค้นหาสัญญาตามชื่อผู้เช่า', async ({ page }) => {
    await page.goto('/contracts');
    const search = page.getByPlaceholder(/ค้นหา/);
    await search.fill('Starbucks');
    await expect(page.getByRole('cell', { name: 'Starbucks', exact: false }).first()).toBeVisible();
  });

  test('filter ตามประเภทสัญญา', async ({ page }) => {
    await page.goto('/contracts');
    // Filter dropdown ตัวที่ 2 (ประเภท)
    const filters = page.getByRole('combobox');
    await filters.nth(1).click();
    await page.getByRole('option', { name: 'ปันผลประโยชน์' }).click();
    // ยังเห็น table
    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('รายงาน (Reports)', () => {
  test('Revenue Report — KPI + 3 charts', async ({ page }) => {
    await page.goto('/reports/revenue');
    // รอ page mount เสร็จ
    await expect(page.locator('main canvas').first()).toBeVisible();
    // มี canvas อย่างน้อย 3 กราฟ
    const canvasCount = await page.locator('main canvas').count();
    expect(canvasCount).toBeGreaterThanOrEqual(3);
    // มี heading Revenue Report
    await expect(page.getByText(/รายงานรายได้|Revenue Report/).first()).toBeVisible();
  });

  test('Area Report — KPI + 3 charts', async ({ page }) => {
    await page.goto('/reports/area');
    await expect(page.getByText('วิเคราะห์พื้นที่').first()).toBeVisible();
    await expect(page.getByText(/อัตราการเช่าตามท่าอากาศยาน/)).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(3);
  });
});

test.describe('Import/Export + Data Cleansing', () => {
  test('หน้า Import/Export แสดง upload + export boxes', async ({ page }) => {
    await page.goto('/import-export');
    await expect(page.getByText('📥 นำเข้าข้อมูล')).toBeVisible();
    await expect(page.getByText('📤 ส่งออกข้อมูล')).toBeVisible();
    // ประวัติ
    await expect(page.getByText(/ประวัติการนำเข้า/)).toBeVisible();
  });

  test('หน้า Data Cleansing แสดงคะแนนคุณภาพ + รายการปัญหา', async ({ page }) => {
    await page.goto('/data-cleansing');
    await expect(page.getByText('คะแนนคุณภาพข้อมูล').first()).toBeVisible();
    // มี issue อย่างน้อย 1 รายการ
    await expect(page.getByText(/เลขภาษีซ้ำ/).first()).toBeVisible();
  });
});

test.describe('Templates + Settings', () => {
  test('หน้า Templates แสดง grid ของ templates', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByText(/Template เอกสาร/).first()).toBeVisible();
    // มี template หลายรายการ
    await expect(page.getByText('TPL-FIXED-V2')).toBeVisible();
    await expect(page.getByText('TPL-REV-V1')).toBeVisible();
  });

  test('หน้า Settings แสดง 4 cards', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('การเงินและการแบ่งรายได้')).toBeVisible();
    await expect(page.getByText('นโยบายสัญญาเช่า')).toBeVisible();
    await expect(page.getByText('ระบบและความปลอดภัย')).toBeVisible();
    await expect(page.getByText('ข้อมูลองค์กร')).toBeVisible();
  });

  test('Settings — ปุ่มบันทึกแสดง', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /บันทึกการตั้งค่า/ })).toBeVisible();
  });
});

test.describe('Profile Page', () => {
  test('หน้า Profile แสดงฟอร์มส่วนตัว + เปลี่ยนรหัสผ่าน', async ({ page }) => {
    await page.goto('/profile');
    // หน้า Profile มีฟิลด์ ชื่อ-นามสกุล ซึ่ง unique
    await expect(page.getByLabel(/ชื่อ-นามสกุล/)).toBeVisible();
    await expect(page.getByText('เปลี่ยนรหัสผ่าน').first()).toBeVisible();
  });

  test('Profile — มี input สำหรับ email และ phone', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel(/เบอร์โทรศัพท์/)).toBeVisible();
  });
});

test.describe('Tenant Portal', () => {
  test('Tenant Portal แสดง welcome + KPI', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText(/สวัสดี/)).toBeVisible();
    await expect(page.getByText('ครัวไทย').first()).toBeVisible();
  });

  test('Tenant Portal แสดงบิลปัจจุบัน + QR', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText('ใบแจ้งหนี้ประจำเดือน')).toBeVisible();
    await expect(page.getByText('PromptPay / QR Code')).toBeVisible();
  });

  test('Tenant Portal แสดงประวัติการชำระ', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText('ประวัติการชำระเงิน')).toBeVisible();
    await expect(page.getByText('มี.ค. 2569')).toBeVisible();
  });
});
