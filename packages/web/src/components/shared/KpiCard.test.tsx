import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard from './KpiCard';

describe('KpiCard Component', () => {
  it('แสดงค่า value และ label', () => {
    render(
      <KpiCard value={48} label="พื้นที่ทั้งหมด" accentColor="#005b9f" />
    );

    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('พื้นที่ทั้งหมด')).toBeInTheDocument();
  });

  it('แสดง subtitle เมื่อระบุ', () => {
    render(
      <KpiCard
        value="4.27M"
        label="รายรับเดือนนี้"
        subtitle="↑ +8.3% จากเดือนก่อน"
        subtitleType="up"
        accentColor="#d7a94b"
      />
    );

    expect(screen.getByText('4.27M')).toBeInTheDocument();
    expect(screen.getByText('↑ +8.3% จากเดือนก่อน')).toBeInTheDocument();
  });

  it('ไม่แสดง subtitle เมื่อไม่ได้ระบุ', () => {
    render(
      <KpiCard value={9} label="พื้นที่ว่าง" accentColor="#1a9e5c" />
    );

    expect(screen.getByText('9')).toBeInTheDocument();
    // ไม่ควรมี subtitle element
    const container = screen.getByText('9').closest('div')?.parentElement;
    expect(container?.querySelectorAll('[class*="MuiBox"]').length).toBeLessThan(5);
  });

  it('รองรับ value เป็น string', () => {
    render(
      <KpiCard value="4.27M" label="Revenue" accentColor="#005b9f" />
    );

    expect(screen.getByText('4.27M')).toBeInTheDocument();
  });
});
