import { useState, useRef, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Select, MenuItem, Divider, Chip, Alert, IconButton, Tabs, Tab,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';
import { useUnits } from '../../api/hooks';
import { useMaster, ZoneType } from '../../api/master-hooks';

// === Types ===
interface ZoneDraft {
  id: string;
  x: number; // grid units
  y: number;
  w: number;
  h: number;
  bookerName: string;
  zoneType: string; // code จาก master data (BOOTH, RETAIL, ...)
  zoneColor?: string; // เก็บไว้ตอน render
  zoneLabel?: string;
  ratePerSqm: number;
  startDate: string;
  endDate: string;
  saved?: boolean; // true = synced กับ DB แล้ว
  unitId?: number;
}

// สีตามประเภท (fallback — ถ้า master data ไม่ load จะใช้ตัวนี้)
const FALLBACK_ZONE_COLOR = { fill: 'rgba(0,91,159,.18)', stroke: '#005b9f' };

// แปลงสี hex เป็น rgba(.18) สำหรับ fill
function hexToFill(hex: string | null | undefined) {
  if (!hex) return FALLBACK_ZONE_COLOR.fill;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},.18)`;
}

// สีตามสถานะของ unit เดิม (จาก DB)
const unitStatusColors: Record<string, { fill: string; stroke: string }> = {
  VACANT: { fill: 'rgba(26,158,92,.15)', stroke: '#1a9e5c' },
  LEASED: { fill: 'rgba(0,91,159,.18)', stroke: '#005b9f' },
  RESERVED: { fill: 'rgba(217,119,6,.18)', stroke: '#d97706' },
  MAINTENANCE: { fill: 'rgba(108,127,146,.15)', stroke: '#6c7f92' },
};

const GRID_SIZE = 24; // 1 ช่อง = 24px = 1 เมตร

export default function FloorPlan() {
  const { locale } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);

  // === State: Airport / Building / Floor selector ===
  const [airportId, setAirportId] = useState<string>('DMK');
  const [buildingId, setBuildingId] = useState<string>('T1');
  const [floorId, setFloorId] = useState<string>('F1');

  // === SVG Floor plan ===
  const [floorplanSvg, setFloorplanSvg] = useState<string | null>(null);
  const [floorplanFilename, setFloorplanFilename] = useState<string>('');
  const canvasSize = { width: 960, height: 640 };

  // === View mode: ดูอย่างเดียว หรือ edit ===
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // === Drawing state ===
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [draftZones, setDraftZones] = useState<ZoneDraft[]>([]);
  const [savingZone, setSavingZone] = useState(false);

  // === โหลด units เดิมจาก API (ใช้ fallback ถ้า offline) ===
  const { data: apiData, refetch } = useUnits({});
  const apiUnits = apiData?.data || [];

  // === Master data: zone types ===
  const { data: zoneTypes = [] } = useMaster<ZoneType>('zone-types');

  // === Booking form ===
  const [bookerName, setBookerName] = useState('');
  const [zoneType, setZoneType] = useState<string>('BOOTH');
  const [ratePerSqm, setRatePerSqm] = useState(3500);

  // เมื่อ master data โหลดเสร็จ — ตั้ง default zone type + rate
  const activeZoneTypes = zoneTypes.filter((z) => z.isActive);
  const selectedZoneType = activeZoneTypes.find((z) => z.code === zoneType) || activeZoneTypes[0];
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 36);
    return d.toISOString().slice(0, 10);
  });

  // === Upload SVG handler ===
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        setFloorplanSvg(content);
      } else {
        // PNG/JPG — wrap เป็น SVG
        setFloorplanSvg(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}"><image href="${content}" width="${canvasSize.width}" height="${canvasSize.height}" preserveAspectRatio="xMidYMid meet" /></svg>`
        );
      }
      setFloorplanFilename(file.name);
      // เก็บใน localStorage ต่อ airport+floor key — demo persistence
      try {
        localStorage.setItem(`doa-floorplan-${airportId}-${floorId}`, content.substring(0, 500000)); // จำกัดขนาด
      } catch {}
    };

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // === Load saved floorplan from localStorage เมื่อเปลี่ยน airport/floor ===
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`doa-floorplan-${airportId}-${floorId}`);
      if (saved) {
        setFloorplanSvg(saved);
        setFloorplanFilename(`saved-${airportId}-${floorId}`);
      } else {
        setFloorplanSvg(null);
        setFloorplanFilename('');
      }
    } catch {}
  }, [airportId, floorId]);

  // === Helpers ===
  const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const getMousePos = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: snap(e.clientX - rect.left), y: snap(e.clientY - rect.top) };
  };

  // === Drawing handlers ===
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit') return;
    const pos = getMousePos(e);
    setDrawing(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!drawing || mode !== 'edit') return;
    const pos = getMousePos(e);
    const x = Math.min(drawing.x, pos.x);
    const y = Math.min(drawing.y, pos.y);
    const w = Math.max(GRID_SIZE, Math.abs(pos.x - drawing.x));
    const h = Math.max(GRID_SIZE, Math.abs(pos.y - drawing.y));
    setCurrentRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setDrawing(null);
  };

  // === Selection calc ===
  const selection = currentRect && currentRect.w >= GRID_SIZE && currentRect.h >= GRID_SIZE
    ? {
        widthM: currentRect.w / GRID_SIZE,
        heightM: currentRect.h / GRID_SIZE,
        areaSqm: (currentRect.w / GRID_SIZE) * (currentRect.h / GRID_SIZE),
        totalPrice: (currentRect.w / GRID_SIZE) * (currentRect.h / GRID_SIZE) * ratePerSqm,
      }
    : null;

  // === Collision check กับ zones เดิม + draft ===
  const hasCollision = (rect: { x: number; y: number; w: number; h: number }) => {
    // check กับ draft zones
    const draftCollide = draftZones.some((z) => {
      const zx = z.x * GRID_SIZE, zy = z.y * GRID_SIZE, zw = z.w * GRID_SIZE, zh = z.h * GRID_SIZE;
      return rect.x < zx + zw && rect.x + rect.w > zx && rect.y < zy + zh && rect.y + rect.h > zy;
    });
    // check กับ existing units (ใช้ floorplan coords ถ้ามี)
    // สำหรับ demo — ข้าม check กับ DB units เพราะอาจไม่มี SVG coords
    return draftCollide;
  };

  const currentCollision = currentRect ? hasCollision(currentRect) : false;

  // === Save zone → POST /api/units ===
  const handleConfirm = async () => {
    if (!currentRect || !selection || currentCollision) return;
    if (!bookerName.trim()) {
      alert(locale === 'th' ? 'กรุณากรอกชื่อผู้จอง' : 'Please enter booker name');
      return;
    }

    const zt = activeZoneTypes.find((z) => z.code === zoneType);

    const newDraft: ZoneDraft = {
      id: `draft-${Date.now()}`,
      x: currentRect.x / GRID_SIZE,
      y: currentRect.y / GRID_SIZE,
      w: currentRect.w / GRID_SIZE,
      h: currentRect.h / GRID_SIZE,
      bookerName,
      zoneType,
      zoneColor: zt?.color || '#005b9f',
      zoneLabel: zt ? (locale === 'th' ? zt.nameTh : (zt.nameEn || zt.nameTh)) : zoneType,
      ratePerSqm,
      startDate,
      endDate,
      saved: false,
    };

    setSavingZone(true);

    // พยายามบันทึกลง DB (graceful fallback ถ้า API ไม่มี)
    try {
      const unitCount = apiUnits.length + draftZones.length + 1;
      const unitCode = `${zoneType.charAt(0)}-${String(unitCount).padStart(3, '0')}`;

      const payload = {
        unitCode,
        unitNameTh: bookerName,
        airportId: 1, // TODO: resolve from airportId string
        areaSqm: newDraft.w * newDraft.h,
        status: 'RESERVED',
        purpose: zt?.nameTh || zoneType,
        fpCoordX: newDraft.x,
        fpCoordY: newDraft.y,
        fpWidth: newDraft.w,
        fpHeight: newDraft.h,
      };

      const { data } = await api.post('/units', payload);
      if (data.success) {
        newDraft.saved = true;
        newDraft.unitId = data.data.id;
        refetch();
      }
    } catch (err) {
      // บันทึกไม่ได้ก็ยังเก็บเป็น draft
      console.warn('Save to DB failed, keeping as draft:', err);
    }

    setDraftZones([...draftZones, newDraft]);
    setCurrentRect(null);
    setSavingZone(false);
  };

  const handleClear = () => setCurrentRect(null);
  const handleDeleteDraft = (id: string) => setDraftZones(draftZones.filter((z) => z.id !== id));

  const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(Math.round(n));

  // === Dropdown options ===
  const airportOptions = [
    { value: 'DMK', labelTh: 'ท่าอากาศยานดอนเมือง', labelEn: 'Don Mueang' },
    { value: 'CNX', labelTh: 'ท่าอากาศยานเชียงใหม่', labelEn: 'Chiang Mai' },
    { value: 'HKT', labelTh: 'ท่าอากาศยานภูเก็ต', labelEn: 'Phuket' },
    { value: 'HDY', labelTh: 'ท่าอากาศยานหาดใหญ่', labelEn: 'Hat Yai' },
  ];
  const buildingOptions = [
    { value: 'T1', labelTh: 'อาคารผู้โดยสาร 1', labelEn: 'Terminal 1' },
    { value: 'T2', labelTh: 'อาคารผู้โดยสาร 2', labelEn: 'Terminal 2' },
  ];
  const floorOptions = [
    { value: 'F1', labelTh: 'ชั้น 1', labelEn: 'Floor 1' },
    { value: 'F2', labelTh: 'ชั้น 2', labelEn: 'Floor 2' },
    { value: 'F3', labelTh: 'ชั้น 3', labelEn: 'Floor 3' },
  ];

  return (
    <>
      <PageHeader
        icon="🗺️"
        title={locale === 'th' ? 'แผนผังพื้นที่เชิงพาณิชย์' : 'Commercial Floor Plan'}
        subtitle={locale === 'th' ? 'อัปโหลดแปลน + กำหนดพื้นที่เช่า' : 'Upload plan + define rental areas'}
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={mode === 'view' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setMode('view')}
              sx={{ fontSize: 11 }}
            >
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>visibility</span>
              {locale === 'th' ? 'ดูแผนผัง' : 'View'}
            </Button>
            <Button
              variant={mode === 'edit' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setMode('edit')}
              sx={{ fontSize: 11 }}
            >
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>edit</span>
              {locale === 'th' ? 'วาดพื้นที่' : 'Draw'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              component="label"
              sx={{ fontSize: 11 }}
            >
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload_file</span>
              {locale === 'th' ? 'อัปโหลด SVG' : 'Upload SVG'}
              <input type="file" accept=".svg,image/svg+xml,image/png,image/jpeg" hidden onChange={handleUpload} />
            </Button>
          </Box>
        }
      />

      <Box sx={{
        flex: 1, overflow: 'auto',
        p: { xs: 1.5, md: 2.5 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: mode === 'edit' ? '300px 1fr 280px' : '1fr 300px' },
        gap: 2,
      }}>
        {/* === Left: booking form (edit mode only) === */}
        {mode === 'edit' && (
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>edit_note</span>
                {locale === 'th' ? 'ข้อมูลการจอง' : 'Booking Info'}
              </Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                size="small" fullWidth
                label={locale === 'th' ? 'ชื่อผู้จอง / หน่วยงาน' : 'Booker / Organization'}
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                placeholder={locale === 'th' ? 'เช่น บริษัท ฟู้ดแลนด์ จำกัด' : 'e.g. Foodland Co., Ltd.'}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Select
                  size="small"
                  value={zoneType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setZoneType(newType);
                    // อัปเดต rate ตาม default ของ master
                    const zt = activeZoneTypes.find((z) => z.code === newType);
                    if (zt?.defaultRate) setRatePerSqm(Number(zt.defaultRate));
                  }}
                >
                  {activeZoneTypes.map((zt) => (
                    <MenuItem key={zt.id} value={zt.code}>
                      {locale === 'th' ? zt.nameTh : (zt.nameEn || zt.nameTh)}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  size="small" type="number"
                  label={locale === 'th' ? 'บาท/ตร.ม.' : 'THB/sqm'}
                  value={ratePerSqm}
                  onChange={(e) => setRatePerSqm(Number(e.target.value))}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField size="small" type="date" label={locale === 'th' ? 'เริ่ม' : 'Start'} InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <TextField size="small" type="date" label={locale === 'th' ? 'สิ้นสุด' : 'End'} InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Button
                  variant="contained" size="small"
                  disabled={!selection || currentCollision || savingZone}
                  onClick={handleConfirm}
                  sx={{ fontSize: 11 }}
                >
                  {savingZone ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (locale === 'th' ? 'ยืนยัน' : 'Confirm')}
                </Button>
                <Button variant="outlined" size="small" onClick={handleClear} sx={{ fontSize: 11 }}>
                  {locale === 'th' ? 'ล้างเลือก' : 'Clear'}
                </Button>
              </Box>

              <Typography sx={{ fontSize: 10, color: '#6c7f92', lineHeight: 1.5 }}>
                {locale === 'th'
                  ? '1 ช่อง = 1 เมตร ระบบ snap grid อัตโนมัติและตรวจ collision'
                  : '1 cell = 1m, auto grid snap and collision detection'}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* === Center: Canvas === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Airport/Building/Floor selector */}
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(22,63,107,.08)', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#f8fafc' }}>
            <Select size="small" value={airportId} onChange={(e) => setAirportId(e.target.value)} sx={{ fontSize: 12, minWidth: 160 }}>
              {airportOptions.map((a) => (
                <MenuItem key={a.value} value={a.value}>{locale === 'th' ? a.labelTh : a.labelEn}</MenuItem>
              ))}
            </Select>
            <Select size="small" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} sx={{ fontSize: 12, minWidth: 140 }}>
              {buildingOptions.map((b) => (
                <MenuItem key={b.value} value={b.value}>{locale === 'th' ? b.labelTh : b.labelEn}</MenuItem>
              ))}
            </Select>
            <Select size="small" value={floorId} onChange={(e) => setFloorId(e.target.value)} sx={{ fontSize: 12, minWidth: 100 }}>
              {floorOptions.map((f) => (
                <MenuItem key={f.value} value={f.value}>{locale === 'th' ? f.labelTh : f.labelEn}</MenuItem>
              ))}
            </Select>
            {floorplanFilename && (
              <Chip
                size="small"
                label={floorplanFilename}
                onDelete={() => { setFloorplanSvg(null); setFloorplanFilename(''); }}
                sx={{ fontSize: 10, ml: 'auto' }}
              />
            )}
          </Box>

          {/* Stats bar (edit mode) */}
          {mode === 'edit' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1, p: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', bgcolor: '#f8fafc' }}>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'ขนาด' : 'Size'}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                  {selection ? `${selection.widthM}×${selection.heightM}m` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'พื้นที่' : 'Area'}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                  {selection ? `${selection.areaSqm.toFixed(1)} sqm` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'ราคา' : 'Price'}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: currentCollision ? '#d9534f' : '#1a9e5c' }}>
                  {selection ? `฿${formatMoney(selection.totalPrice)}` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'สถานะ' : 'Status'}</Typography>
                <Chip
                  label={currentCollision ? (locale === 'th' ? 'ชน' : 'Collide') : selection ? (locale === 'th' ? 'พร้อม' : 'OK') : '—'}
                  size="small"
                  sx={{
                    fontSize: 10, fontWeight: 700, height: 22,
                    bgcolor: currentCollision ? 'rgba(217,83,79,.1)' : selection ? 'rgba(26,158,92,.1)' : '#f4f8fc',
                    color: currentCollision ? '#d9534f' : selection ? '#1a9e5c' : '#6c7f92',
                    border: `1px solid ${currentCollision ? 'rgba(217,83,79,.25)' : selection ? 'rgba(26,158,92,.25)' : 'rgba(22,63,107,.12)'}`,
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Canvas */}
          <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 2 } }}>
            <Box
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setDrawing(null)}
              sx={{
                position: 'relative',
                width: canvasSize.width,
                height: canvasSize.height,
                border: '1px solid rgba(22,63,107,.12)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: mode === 'edit' ? 'crosshair' : 'default',
                background: `
                  linear-gradient(rgba(0,91,159,.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,91,159,.04) 1px, transparent 1px),
                  linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE}px ${GRID_SIZE}px, auto`,
              }}
            >
              {/* Uploaded SVG background */}
              {floorplanSvg && (
                <Box
                  sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .7,
                    '& svg': { width: '100%', height: '100%' },
                    '& img': { width: '100%', height: '100%', objectFit: 'contain' },
                  }}
                  dangerouslySetInnerHTML={{ __html: floorplanSvg }}
                />
              )}

              {/* Empty state */}
              {!floorplanSvg && apiUnits.length === 0 && draftZones.length === 0 && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#6c7f92' }}>
                  <span className="material-icons-outlined" style={{ fontSize: 72, opacity: .25 }}>add_photo_alternate</span>
                  <Typography sx={{ fontSize: 13, mt: 1, fontWeight: 600 }}>
                    {locale === 'th' ? 'ยังไม่มี Floor Plan' : 'No Floor Plan yet'}
                  </Typography>
                  <Typography sx={{ fontSize: 11, mt: .5 }}>
                    {locale === 'th' ? 'กดปุ่ม "อัปโหลด SVG" ด้านบน' : 'Click "Upload SVG" button above'}
                  </Typography>
                </Box>
              )}

              {/* SVG zones layer */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {/* Existing units from DB */}
                {apiUnits.slice(0, 48).map((u, i) => {
                  if (!u.id) return null;
                  // ใช้ grid layout สำหรับ units ที่ไม่มี coords
                  const cols = 8;
                  const x = 30 + (i % cols) * 105;
                  const y = 70 + Math.floor(i / cols) * 95;
                  const w = 95, h = 80;
                  const color = unitStatusColors[u.status] || unitStatusColors.VACANT;
                  return (
                    <g key={`db-${u.id}`}>
                      <rect x={x} y={y} width={w} height={h} fill={color.fill} stroke={color.stroke} strokeWidth="2" rx="4" />
                      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill={color.stroke} fontFamily="'IBM Plex Mono',monospace">
                        {u.unitCode}
                      </text>
                      {u.currentShop && (
                        <text x={x + w / 2} y={y + 40} textAnchor="middle" fontSize="9" fill="#3a5068">
                          {u.currentShop.length > 12 ? u.currentShop.slice(0, 12) + '…' : u.currentShop}
                        </text>
                      )}
                      <text x={x + w / 2} y={y + 56} textAnchor="middle" fontSize="8" fill="#6c7f92" fontFamily="'IBM Plex Mono',monospace">
                        {u.areaSqm} sqm
                      </text>
                    </g>
                  );
                })}

                {/* Draft zones (ใหม่จากการวาด) */}
                {draftZones.map((zone) => {
                  const x = zone.x * GRID_SIZE;
                  const y = zone.y * GRID_SIZE;
                  const w = zone.w * GRID_SIZE;
                  const h = zone.h * GRID_SIZE;
                  const stroke = zone.zoneColor || '#005b9f';
                  const fill = hexToFill(stroke);
                  return (
                    <g key={zone.id}>
                      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth="2" rx="4" strokeDasharray={zone.saved ? '0' : '4 2'} />
                      <text x={x + 6} y={y + 16} fontSize="11" fontWeight="700" fill={stroke}>
                        {zone.bookerName}
                      </text>
                      <text x={x + 6} y={y + 30} fontSize="9" fill="#6c7f92" fontFamily="'IBM Plex Mono',monospace">
                        {zone.w}×{zone.h}m {zone.saved ? '✓' : '(draft)'}
                      </text>
                    </g>
                  );
                })}

                {/* Current selection */}
                {currentRect && currentRect.w >= GRID_SIZE && currentRect.h >= GRID_SIZE && (
                  <g>
                    <rect
                      x={currentRect.x} y={currentRect.y}
                      width={currentRect.w} height={currentRect.h}
                      fill={currentCollision ? 'rgba(217,83,79,.28)' : 'rgba(240,173,78,.32)'}
                      stroke={currentCollision ? '#d9534f' : '#d7a94b'}
                      strokeWidth="2.5" strokeDasharray="6 4" rx="4"
                    />
                    <text x={currentRect.x + 6} y={currentRect.y + 18} fontSize="11" fontWeight="700" fill={currentCollision ? '#d9534f' : '#b2832d'}>
                      {currentCollision ? (locale === 'th' ? 'ทับพื้นที่!' : 'Collision!') : (locale === 'th' ? 'กำลังเลือก' : 'Selecting')}
                    </text>
                  </g>
                )}
              </svg>
            </Box>
          </Box>
        </Paper>

        {/* === Right: Info/List panel === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>list_alt</span>
              {mode === 'edit'
                ? `${locale === 'th' ? 'พื้นที่วาดใหม่' : 'Drafts'} (${draftZones.length})`
                : `${locale === 'th' ? 'พื้นที่ทั้งหมด' : 'All Units'} (${apiUnits.length})`}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'auto', maxHeight: 560 }}>
            {/* Draft list */}
            {mode === 'edit' && draftZones.length === 0 && (
              <Alert severity="info" sx={{ fontSize: 11 }}>
                {locale === 'th' ? 'ยังไม่มีการจอง — ลากบนแปลนเพื่อจอง' : 'No drafts — drag on plan to book'}
              </Alert>
            )}
            {mode === 'edit' && draftZones.map((zone, i) => {
              const stroke = zone.zoneColor || '#005b9f';
              return (
              <Paper key={zone.id} elevation={0} sx={{ p: 1.25, border: `1px solid ${stroke}40`, bgcolor: `${stroke}08` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: .5 }}>
                  <Chip
                    label={`#${i + 1} ${zone.zoneLabel || zone.zoneType}`}
                    size="small"
                    sx={{ fontSize: 9, fontWeight: 700, height: 20, bgcolor: `${stroke}20`, color: stroke }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                    {zone.saved && (
                      <Chip size="small" label="✓" sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(26,158,92,.15)', color: '#1a9e5c' }} />
                    )}
                    <IconButton size="small" onClick={() => handleDeleteDraft(zone.id)} sx={{ color: '#d9534f' }}>
                      <span className="material-icons-outlined" style={{ fontSize: 16 }}>delete</span>
                    </IconButton>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{zone.bookerName}</Typography>
                <Typography sx={{ fontSize: 10, color: '#6c7f92', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {zone.w}×{zone.h}m · {(zone.w * zone.h).toFixed(1)}sqm · ฿{formatMoney(zone.w * zone.h * zone.ratePerSqm)}
                </Typography>
                <Typography sx={{ fontSize: 9, color: '#6c7f92', mt: .3 }}>
                  {zone.startDate} → {zone.endDate}
                </Typography>
              </Paper>
              );
            })}

            {/* Existing units (view mode) */}
            {mode === 'view' && apiUnits.length === 0 && (
              <Alert severity="info" sx={{ fontSize: 11 }}>
                {locale === 'th' ? 'ยังไม่มียูนิตในระบบ' : 'No units in database'}
              </Alert>
            )}
            {mode === 'view' && apiUnits.slice(0, 20).map((u) => (
              <Paper key={u.id} elevation={0} sx={{ p: 1.25, border: '1px solid rgba(22,63,107,.12)', '&:hover': { bgcolor: '#f4f8fc' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                    {u.unitCode}
                  </Typography>
                  <Chip
                    label={u.status}
                    size="small"
                    sx={{
                      fontSize: 9, fontWeight: 700, height: 20,
                      bgcolor: unitStatusColors[u.status]?.fill || '#f4f8fc',
                      color: unitStatusColors[u.status]?.stroke || '#6c7f92',
                    }}
                  />
                </Box>
                {u.currentShop && (
                  <Typography sx={{ fontSize: 11, fontWeight: 600, mt: .3 }}>{u.currentShop}</Typography>
                )}
                <Typography sx={{ fontSize: 10, color: '#6c7f92', fontFamily: "'IBM Plex Mono', monospace", mt: .2 }}>
                  {u.areaSqm} sqm · {u.purpose || '—'}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
