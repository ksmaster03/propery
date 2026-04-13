import { useState, useRef } from 'react';
import { Box, Paper, Typography, Select, MenuItem, Chip, Divider, Button } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

// ข้อมูล mock สำหรับ Floor Plan — จะเปลี่ยนเป็น API จริงภายหลัง
const mockZones = generateMockZones();

function generateMockZones() {
  const tenants: Record<string, { tenant: string; shop: string; contract: string; rent: number; daysLeft: number }> = {
    'A-101': { tenant: 'บริษัท ฟู้ดแลนด์ จำกัด', shop: 'ครัวไทย', contract: 'CTR-2566-001', rent: 65000, daysLeft: 14 },
    'A-102': { tenant: 'บริษัท ไทยฟู้ด จำกัด', shop: 'ข้าวแกงป้าแจ่ม', contract: 'CTR-2566-005', rent: 48000, daysLeft: 180 },
    'A-103': { tenant: 'นาง สมหญิง รักดี', shop: 'ก๋วยเตี๋ยวนายเฮง', contract: 'CTR-2566-006', rent: 42000, daysLeft: 210 },
    'B-201': { tenant: 'นาย สมศักดิ์ วงศ์ทอง', shop: 'The Brew Coffee', contract: 'CTR-2566-002', rent: 80000, daysLeft: 28 },
    'B-202': { tenant: 'บริษัท สตาร์บัคส์ จำกัด', shop: 'Starbucks', contract: 'CTR-2566-007', rent: 120000, daysLeft: 350 },
    'C-305': { tenant: 'บริษัท คิวเอ็ม จำกัด', shop: 'QuickMart', contract: 'CTR-2566-003', rent: 85000, daysLeft: 45 },
    'A-112': { tenant: 'บริษัท อินนิก้า จำกัด', shop: 'SouvThai', contract: 'CTR-2566-004', rent: 45000, daysLeft: 67 },
  };

  const zones: any[] = [];

  // โซน A — ร้านอาหาร (2 แถว x 8 ยูนิต)
  for (let i = 0; i < 16; i++) {
    const code = `A-${101 + i}`;
    const isLeased = i < 10;
    const isReserved = i >= 10 && i < 13;
    const t = tenants[code];
    const daysLeft = t?.daysLeft ?? null;

    zones.push({
      id: i + 1,
      unitCode: code,
      unitNameTh: `คูหา ${code}`,
      status: isLeased ? 'LEASED' : isReserved ? 'RESERVED' : 'VACANT',
      areaSqm: 45 + Math.round(Math.random() * 60),
      purpose: 'ร้านอาหาร',
      x: 30 + (i % 8) * 105,
      y: 70 + Math.floor(i / 8) * 95,
      width: 95,
      height: 80,
      fillColor: isLeased
        ? (daysLeft !== null && daysLeft <= 30 ? '#fce4ec' : '#e3f2fd')
        : isReserved ? '#fff8e1' : '#e8f5e9',
      strokeColor: isLeased
        ? (daysLeft !== null && daysLeft <= 30 ? '#d9534f' : '#005b9f')
        : isReserved ? '#d97706' : '#1a9e5c',
      tenant: t?.tenant || null,
      shopName: t?.shop || null,
      contractNo: t?.contract || null,
      monthlyRent: t?.rent || null,
      daysLeft,
      zoneNameTh: 'โซน A (ร้านอาหาร)',
      floorNameTh: 'ชั้น 1',
    });
  }

  // โซน B — ร้านค้า (2 แถว x 8 ยูนิต)
  for (let i = 0; i < 16; i++) {
    const code = `B-${201 + i}`;
    const isLeased = i < 12;
    const isReserved = i >= 12 && i < 14;
    const t = tenants[code];
    const daysLeft = t?.daysLeft ?? null;

    zones.push({
      id: i + 17,
      unitCode: code,
      unitNameTh: `คูหา ${code}`,
      status: isLeased ? 'LEASED' : isReserved ? 'RESERVED' : 'VACANT',
      areaSqm: 30 + Math.round(Math.random() * 40),
      purpose: 'ร้านค้า',
      x: 30 + (i % 8) * 105,
      y: 300 + Math.floor(i / 8) * 95,
      width: 95,
      height: 80,
      fillColor: isLeased
        ? (daysLeft !== null && daysLeft <= 30 ? '#fce4ec' : '#e3f2fd')
        : isReserved ? '#fff8e1' : '#e8f5e9',
      strokeColor: isLeased
        ? (daysLeft !== null && daysLeft <= 30 ? '#d9534f' : '#005b9f')
        : isReserved ? '#d97706' : '#1a9e5c',
      tenant: t?.tenant || null,
      shopName: t?.shop || null,
      contractNo: t?.contract || null,
      monthlyRent: t?.rent || null,
      daysLeft,
      zoneNameTh: 'โซน B (ร้านค้า)',
      floorNameTh: 'ชั้น 1',
    });
  }

  // โซน C — บริการ (2 คอลัมน์ x 8 ยูนิต)
  for (let i = 0; i < 16; i++) {
    const code = `C-${301 + i}`;
    const isLeased = i < 12;
    const t = tenants[code];
    const daysLeft = t?.daysLeft ?? null;

    zones.push({
      id: i + 33,
      unitCode: code,
      unitNameTh: `คูหา ${code}`,
      status: isLeased ? 'LEASED' : 'VACANT',
      areaSqm: 20 + Math.round(Math.random() * 30),
      purpose: 'บริการ',
      x: 30 + (i % 8) * 105,
      y: 540 + Math.floor(i / 8) * 95,
      width: 95,
      height: 80,
      fillColor: isLeased
        ? (daysLeft !== null && daysLeft <= 30 ? '#fce4ec' : '#e3f2fd')
        : '#e8f5e9',
      strokeColor: isLeased
        ? (daysLeft !== null && daysLeft <= 30 ? '#d9534f' : '#005b9f')
        : '#1a9e5c',
      tenant: t?.tenant || null,
      shopName: t?.shop || null,
      contractNo: t?.contract || null,
      monthlyRent: t?.rent || null,
      daysLeft,
      zoneNameTh: 'โซน C (บริการ)',
      floorNameTh: 'ชั้น 1',
    });
  }

  return zones;
}

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(n);

// คำนวณสรุป
const summary = {
  total: mockZones.length,
  leased: mockZones.filter((z) => z.status === 'LEASED').length,
  vacant: mockZones.filter((z) => z.status === 'VACANT').length,
  reserved: mockZones.filter((z) => z.status === 'RESERVED').length,
};

export default function FloorPlan() {
  const { t, locale } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<typeof mockZones[0] | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const legendItems = [
    { key: 'floorplan.vacant', color: '#1a9e5c', bg: '#e8f5e9' },
    { key: 'floorplan.leased', color: '#005b9f', bg: '#e3f2fd' },
    { key: 'floorplan.reserved', color: '#d97706', bg: '#fff8e1' },
    { key: 'floorplan.overdue', color: '#d9534f', bg: '#fce4ec' },
    { key: 'floorplan.maintenance', color: '#9e9e9e', bg: '#f5f5f5' },
  ];

  return (
    <>
      <PageHeader
        icon="🗺️"
        title={t('floorplan.title')}
        subtitle={t('floorplan.subtitle')}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Select size="small" defaultValue="DMK" sx={{ minWidth: 180, fontSize: 12 }}>
              <MenuItem value="DMK">{locale === 'th' ? 'ท่าอากาศยานดอนเมือง' : 'Don Mueang Airport'}</MenuItem>
              <MenuItem value="CNX">{locale === 'th' ? 'ท่าอากาศยานเชียงใหม่' : 'Chiang Mai Airport'}</MenuItem>
              <MenuItem value="HKT">{locale === 'th' ? 'ท่าอากาศยานภูเก็ต' : 'Phuket Airport'}</MenuItem>
            </Select>
            <Select size="small" defaultValue="F1" sx={{ minWidth: 120, fontSize: 12 }}>
              <MenuItem value="F1">{locale === 'th' ? 'ชั้น 1' : 'Floor 1'}</MenuItem>
              <MenuItem value="F2">{locale === 'th' ? 'ชั้น 2' : 'Floor 2'}</MenuItem>
              <MenuItem value="F3">{locale === 'th' ? 'ชั้น 3' : 'Floor 3'}</MenuItem>
            </Select>
          </Box>
        }
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75, display: 'flex', gap: 2 }}>
        {/* แผนผัง SVG */}
        <Paper
          elevation={0}
          sx={{
            flex: 1, border: '1px solid rgba(22,63,107,.12)',
            boxShadow: '0 2px 12px rgba(10,22,40,.08)', overflow: 'hidden',
          }}
        >
          {/* Legend + Summary */}
          <Box sx={{
            px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)',
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)',
          }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mr: 1 }}>
              {locale === 'th' ? 'อาคารผู้โดยสาร 1 · ชั้น 1' : 'Terminal 1 · Floor 1'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            {legendItems.map((item) => (
              <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', gap: .6, fontSize: 10.5, color: '#6c7f92' }}>
                <Box sx={{ width: 12, height: 12, borderRadius: .5, bgcolor: item.bg, border: `2px solid ${item.color}` }} />
                {t(item.key)}
              </Box>
            ))}
          </Box>

          {/* สรุป KPI */}
          <Box sx={{ display: 'flex', gap: 1.5, px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.06)' }}>
            {[
              { label: locale === 'th' ? 'ทั้งหมด' : 'Total', value: summary.total, color: '#005b9f' },
              { label: t('floorplan.leased'), value: summary.leased, color: '#0f73b8' },
              { label: t('floorplan.vacant'), value: summary.vacant, color: '#1a9e5c' },
              { label: t('floorplan.reserved'), value: summary.reserved, color: '#d97706' },
            ].map((s) => (
              <Box key={s.label} sx={{
                px: 2, py: 1, borderRadius: 1.5,
                border: '1px solid rgba(22,63,107,.08)', bgcolor: '#fff',
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color }}>
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* SVG Floor Plan */}
          <Box sx={{ p: 2, overflow: 'auto', bgcolor: '#f8fafc' }}>
            <svg
              viewBox="0 0 880 720"
              style={{ width: '100%', maxHeight: 600, border: '1px solid rgba(22,63,107,.1)', borderRadius: 12, background: '#fff' }}
            >
              {/* Grid พื้นหลัง */}
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0,91,159,.04)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="880" height="720" fill="url(#grid)" />

              {/* เส้นขอบอาคาร */}
              <rect x="15" y="15" width="850" height="690" fill="none" stroke="rgba(0,91,159,.2)" strokeWidth="2" rx="8" />

              {/* ป้ายกำกับโซน */}
              <text x="30" y="55" fontSize="13" fontWeight="700" fill="#163f6b" fontFamily="IBM Plex Sans Thai">
                {locale === 'th' ? 'โซน A — ร้านอาหาร / Food & Beverage' : 'Zone A — Food & Beverage'}
              </text>
              <text x="30" y="288" fontSize="13" fontWeight="700" fill="#163f6b" fontFamily="IBM Plex Sans Thai">
                {locale === 'th' ? 'โซน B — ร้านค้า / Retail' : 'Zone B — Retail'}
              </text>
              <text x="30" y="525" fontSize="13" fontWeight="700" fill="#163f6b" fontFamily="IBM Plex Sans Thai">
                {locale === 'th' ? 'โซน C — บริการ / Services' : 'Zone C — Services'}
              </text>

              {/* Concourse Labels */}
              <rect x="15" y="15" width="850" height="28" fill="rgba(0,91,159,.06)" rx="8" />
              <text x="380" y="34" fontSize="10" fill="rgba(22,63,107,.5)" textAnchor="middle" fontFamily="IBM Plex Sans Thai">
                Main Concourse
              </text>
              <rect x="15" y="677" width="850" height="28" fill="rgba(0,91,159,.06)" rx="0 0 8 8" />
              <text x="380" y="696" fontSize="10" fill="rgba(22,63,107,.5)" textAnchor="middle" fontFamily="IBM Plex Sans Thai">
                Passenger Circulation
              </text>

              {/* แต่ละยูนิต */}
              {mockZones.map((zone) => {
                const isHovered = hoveredZone === zone.unitCode;
                const isSelected = selectedZone?.unitCode === zone.unitCode;

                return (
                  <g
                    key={zone.unitCode}
                    onClick={() => setSelectedZone(zone)}
                    onMouseEnter={() => setHoveredZone(zone.unitCode)}
                    onMouseLeave={() => setHoveredZone(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={zone.x} y={zone.y}
                      width={zone.width} height={zone.height}
                      fill={zone.fillColor}
                      stroke={isSelected ? '#163f6b' : zone.strokeColor}
                      strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                      rx="4"
                      opacity={isHovered ? 0.85 : 1}
                    />
                    {/* รหัสยูนิต */}
                    <text
                      x={zone.x + zone.width / 2} y={zone.y + 22}
                      textAnchor="middle" fontSize="11" fontWeight="700"
                      fill={zone.strokeColor} fontFamily="IBM Plex Mono"
                    >
                      {zone.unitCode}
                    </text>
                    {/* ชื่อร้าน (ถ้ามี) */}
                    {zone.shopName && (
                      <text
                        x={zone.x + zone.width / 2} y={zone.y + 40}
                        textAnchor="middle" fontSize="9" fill="#3a5068"
                        fontFamily="IBM Plex Sans Thai"
                      >
                        {zone.shopName.length > 12 ? zone.shopName.slice(0, 12) + '...' : zone.shopName}
                      </text>
                    )}
                    {/* พื้นที่ */}
                    <text
                      x={zone.x + zone.width / 2} y={zone.y + 56}
                      textAnchor="middle" fontSize="8" fill="#6c7f92"
                      fontFamily="IBM Plex Mono"
                    >
                      {zone.areaSqm} {t('floorplan.sqm')}
                    </text>
                    {/* badge สถานะ */}
                    {zone.daysLeft !== null && zone.daysLeft <= 30 && (
                      <>
                        <rect x={zone.x + zone.width - 28} y={zone.y + 4} width={24} height={14} rx="7" fill="#d9534f" />
                        <text x={zone.x + zone.width - 16} y={zone.y + 14} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">
                          {zone.daysLeft}d
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </Box>
        </Paper>

        {/* แผงรายละเอียดด้านขวา */}
        <Paper
          elevation={0}
          sx={{
            width: 280, flexShrink: 0,
            border: '1px solid rgba(22,63,107,.12)',
            boxShadow: '0 2px 12px rgba(10,22,40,.08)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <Box sx={{
            px: 2, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)',
            background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)',
          }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {t('floorplan.zoneInfo')}
            </Typography>
          </Box>

          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {selectedZone ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* รหัสและสถานะ */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                    {selectedZone.unitCode}
                  </Typography>
                  <Chip
                    label={t(`status.${selectedZone.status.toLowerCase()}`)}
                    size="small"
                    sx={{
                      fontSize: 10, fontWeight: 700, height: 22,
                      bgcolor: selectedZone.fillColor,
                      color: selectedZone.strokeColor,
                      border: `1px solid ${selectedZone.strokeColor}`,
                    }}
                  />
                </Box>

                <Typography sx={{ fontSize: 12, color: '#6c7f92' }}>
                  {selectedZone.unitNameTh} · {selectedZone.zoneNameTh}
                </Typography>

                <Divider />

                {/* รายละเอียด */}
                {[
                  { label: t('floorplan.area'), value: `${selectedZone.areaSqm} ${t('floorplan.sqm')}` },
                  { label: locale === 'th' ? 'วัตถุประสงค์' : 'Purpose', value: selectedZone.purpose },
                  { label: locale === 'th' ? 'ชั้น' : 'Floor', value: selectedZone.floorNameTh },
                  ...(selectedZone.tenant ? [
                    { label: t('floorplan.tenant'), value: selectedZone.tenant },
                    { label: t('floorplan.shopName'), value: selectedZone.shopName },
                    { label: t('floorplan.contract'), value: selectedZone.contractNo },
                    { label: t('floorplan.rent'), value: selectedZone.monthlyRent ? `฿${formatMoney(selectedZone.monthlyRent)}` : '-' },
                    { label: t('floorplan.daysLeft'), value: selectedZone.daysLeft !== null ? `${selectedZone.daysLeft} ${t('floorplan.days')}` : '-' },
                  ] : []),
                ].map((row) => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .5, borderBottom: '1px solid rgba(22,63,107,.06)' }}>
                    <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{row.label}</Typography>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#17324a', textAlign: 'right', maxWidth: 150 }}>
                      {row.value}
                    </Typography>
                  </Box>
                ))}

                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  {selectedZone.status === 'VACANT' && (
                    <Button variant="contained" size="small" fullWidth sx={{ fontSize: 11 }}>
                      <span className="material-icons-outlined" style={{ fontSize: 16, mr: 4 }}>add_circle</span>
                      {locale === 'th' ? 'สร้างสัญญา' : 'Create Contract'}
                    </Button>
                  )}
                  <Button variant="outlined" size="small" fullWidth sx={{ fontSize: 11 }}>
                    <span className="material-icons-outlined" style={{ fontSize: 16, mr: 4 }}>edit</span>
                    {t('common.edit')}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: '#6c7f92' }}>
                <span className="material-icons-outlined" style={{ fontSize: 48, opacity: .3 }}>touch_app</span>
                <Typography sx={{ fontSize: 12, mt: 1 }}>
                  {locale === 'th' ? 'คลิกที่ยูนิตบน Floor Plan เพื่อดูรายละเอียด' : 'Click a unit on the Floor Plan to see details'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
