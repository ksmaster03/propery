import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslation, useI18nStore } from './i18n';

describe('i18n System', () => {
  beforeEach(() => {
    // รีเซ็ตเป็นภาษาไทยก่อนทุก test
    useI18nStore.setState({ locale: 'th' });
  });

  describe('useTranslation hook', () => {
    it('แปลข้อความเป็นภาษาไทยได้', () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t('app.title')).toContain('ระบบบริหารสัญญาเช่า');
      expect(result.current.locale).toBe('th');
    });

    it('สลับเป็นภาษาอังกฤษได้', () => {
      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.setLocale('en');
      });

      expect(result.current.locale).toBe('en');
      expect(result.current.t('app.title')).toBe('Commercial Lease Management System');
    });

    it('คืน key เดิมถ้าไม่มีคำแปล', () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('คืน fallback ถ้าไม่มีคำแปล', () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t('nonexistent.key', 'ค่าเริ่มต้น')).toBe('ค่าเริ่มต้น');
    });
  });

  describe('คำแ��ลครบถ้วน', () => {
    const importantKeys = [
      'app.title', 'app.subtitle',
      'nav.dashboard', 'nav.floorplan', 'nav.units',
      'nav.contractList', 'nav.partnerMaster',
      'nav.billing', 'nav.receipt',
      'dashboard.title', 'dashboard.totalUnits',
      'floorplan.title', 'floorplan.vacant', 'floorplan.leased',
      'units.title', 'units.search',
      'partners.title', 'partners.addPartner',
      'status.vacant', 'status.leased', 'status.reserved',
      'common.save', 'common.cancel', 'common.edit',
      'contract.fixedRent', 'contract.revenueSharing',
    ];

    it('ทุก key สำคัญมีคำแปลภาษาไทย', () => {
      const { result } = renderHook(() => useTranslation());
      importantKeys.forEach((key) => {
        const translated = result.current.t(key);
        expect(translated).not.toBe(key);
      });
    });

    it('ทุก key สำคัญมีคำแปลภาษาอังกฤษ', () => {
      useI18nStore.setState({ locale: 'en' });
      const { result } = renderHook(() => useTranslation());
      importantKeys.forEach((key) => {
        const translated = result.current.t(key);
        expect(translated).not.toBe(key);
      });
    });
  });
});
