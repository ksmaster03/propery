import { test, expect } from '@playwright/test';
import { setMockAuth } from './helpers';

// === Floor Plan page E2E tests ===
// ทดสอบ UI ของหน้า /floor-plan ทั้ง view + edit mode
// รวม zoom/pan, drawing tools, filter cascade, save
test.describe('Floor Plan — UI & interactions', () => {
  test.beforeEach(async ({ context, page }) => {
    await setMockAuth(context);
    await page.goto('/floor-plan');
    // รอให้ data โหลดเสร็จ
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('แสดง PageHeader + ปุ่ม mode สลับ', async ({ page }) => {
    await expect(page.getByText('แผนผังพื้นที่เชิงพาณิชย์').first()).toBeVisible();
    // ปุ่ม mode: ดูแผนผัง / วาดพื้นที่
    await expect(page.getByRole('button', { name: /ดูแผนผัง/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /วาดพื้นที่/ })).toBeVisible();
  });

  test('filter bar มี label สถานที่/อาคาร/ชั้น', async ({ page }) => {
    // label เป็น Typography (p) ที่มี icon span + text — ใช้ :has-text
    await expect(page.locator('p:has-text("สถานที่")').first()).toBeVisible();
    await expect(page.locator('p:has-text("อาคาร")').first()).toBeVisible();
    await expect(page.locator('p:has-text("ชั้น")').first()).toBeVisible();
  });

  test('ปุ่มจัดการ floor (เพิ่ม/แก้ไข/ลบ) แสดงครบ', async ({ page }) => {
    // ปุ่ม + / edit / delete มี title attribute
    await expect(page.getByTitle(/เพิ่มชั้น/)).toBeVisible();
    await expect(page.getByTitle(/แก้ไขชั้น/)).toBeVisible();
    await expect(page.getByTitle(/ลบชั้น/)).toBeVisible();
  });

  test('สลับไป edit mode แสดง booking form + allocation dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /วาดพื้นที่/ }).click();
    // booking form มี label "ข้อมูลการจอง"
    await expect(page.getByText('ข้อมูลการจอง').first()).toBeVisible();
    // เห็น label "จัดสรรพื้นที่" (dropdown ใหม่)
    await expect(page.getByText('จัดสรรพื้นที่').first()).toBeVisible();
    // field รหัสพื้นที่
    await expect(page.getByLabel(/รหัสพื้นที่/)).toBeVisible();
    // field ชื่อผู้จอง
    await expect(page.getByLabel(/ชื่อผู้จอง/)).toBeVisible();
  });

  test('edit mode แสดง drawing mode toolbar 4 ปุ่ม (Rect / Polygon / Freehand / Pan)', async ({ page }) => {
    await page.getByRole('button', { name: /วาดพื้นที่/ }).click();
    // ToggleButton ใช้ role=button แต่ "วาดพื้นที่" กับ "ลากมือ" ใช้คำใกล้เคียง
    // เลือกด้วย title ที่มีเฉพาะ pan mode หรือใช้ text ภายใน button
    await expect(page.locator('button:has-text("สี่เหลี่ยม")')).toBeVisible();
    await expect(page.locator('button:has-text("หลายเหลี่ยม")')).toBeVisible();
    await expect(page.locator('button:has-text("ลากมือ")')).toBeVisible();
    // Pan mode button มี title attribute ที่ unique
    await expect(page.locator('[title*="ลากย้ายแผนผัง"]').first()).toBeVisible();
  });

  test('zoom controls มีและทำงานได้ (ปุ่ม + / − / fit)', async ({ page }) => {
    await page.getByRole('button', { name: /วาดพื้นที่/ }).click();
    // ปุ่ม zoom out / in / fit — ใช้ title attribute
    await expect(page.getByTitle('Zoom out')).toBeVisible();
    await expect(page.getByTitle('Zoom in')).toBeVisible();
    await expect(page.getByTitle('Fit')).toBeVisible();
    // คลิก zoom in → chip 100% ต้องเปลี่ยน
    const zoomBefore = await page.locator('text=/\\d+%/').first().innerText();
    await page.getByTitle('Zoom in').click();
    await page.waitForTimeout(200);
    const zoomAfter = await page.locator('text=/\\d+%/').first().innerText();
    expect(zoomAfter).not.toBe(zoomBefore);
  });

  test('stats bar แสดงปุ่มบันทึกพื้นที่ (save) ใหญ่ๆ', async ({ page }) => {
    await page.getByRole('button', { name: /วาดพื้นที่/ }).click();
    // ปุ่ม Save Zone อยู่ใน stats bar — disabled ถ้ายังไม่วาด
    const saveBtn = page.getByRole('button', { name: /บันทึกพื้นที่/ });
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeDisabled();
  });

  test('view mode แสดง list units ด้านขวา', async ({ page }) => {
    await expect(page.getByText(/พื้นที่ทั้งหมด|All Units/).first()).toBeVisible();
  });
});

// === Filter cascade — เลือก airport → building → floor ===
test.describe('Floor Plan — Filter cascade', () => {
  test.beforeEach(async ({ context, page }) => {
    await setMockAuth(context);
    await page.goto('/floor-plan');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('dropdown สถานที่ (airport) มีให้เลือก', async ({ page }) => {
    // Click select สถานที่ (ตัวแรก)
    const selects = page.locator('[role="combobox"]');
    await expect(selects.first()).toBeVisible();
  });
});
