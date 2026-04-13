import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { Box, Paper, Typography, Button, TextField, Select, MenuItem, Divider, Chip, Alert } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

// === Types ===
interface DrawnZone {
  id: string;
  x: number;       // grid units (1 cell = 1 meter)
  y: number;
  w: number;
  h: number;
  bookerName: string;
  zoneType: 'booth' | 'retail' | 'event' | 'lounge';
  ratePerSqm: number;
  startDate: string;
  endDate: string;
  label?: string;
  fillColor: string;
  strokeColor: string;
}

// สีตามประเภท
const zoneColors = {
  booth: { fill: 'rgba(0,91,159,.18)', stroke: '#005b9f', labelTh: 'คูหา', labelEn: 'Booth' },
  retail: { fill: 'rgba(26,158,92,.18)', stroke: '#1a9e5c', labelTh: 'ร้านค้า', labelEn: 'Retail' },
  event: { fill: 'rgba(217,119,6,.18)', stroke: '#d97706', labelTh: 'พื้นที่กิจกรรม', labelEn: 'Event' },
  lounge: { fill: 'rgba(124,58,237,.18)', stroke: '#7c3aed', labelTh: 'Lounge', labelEn: 'Lounge' },
};

const GRID_SIZE = 24; // 1 grid cell = 24px on screen = 1 meter

export default function FloorPlanEditor() {
  const { locale } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);

  // === State ===
  const [floorplanSvg, setFloorplanSvg] = useState<string | null>(null);
  const [floorplanFilename, setFloorplanFilename] = useState<string>('');
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });
  const [zones, setZones] = useState<DrawnZone[]>([]);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // === Booking form state ===
  const [bookerName, setBookerName] = useState('บริษัทตัวอย่าง จำกัด');
  const [zoneType, setZoneType] = useState<DrawnZone['zoneType']>('booth');
  const [ratePerSqm, setRatePerSqm] = useState(3500);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [remark, setRemark] = useState('');

  // === Upload SVG handler ===
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // รองรับ SVG, PNG, JPG
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        // SVG — ใช้ raw content
        setFloorplanSvg(content);
      } else {
        // PNG/JPG — แปลงเป็น data URL ในรูป SVG wrapper
        setFloorplanSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}"><image href="${content}" width="${canvasSize.width}" height="${canvasSize.height}" preserveAspectRatio="xMidYMid meet" /></svg>`);
      }
      setFloorplanFilename(file.name);
    };

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // === Snap ค่า x,y ให้ตรง grid ===
  const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  // === Get mouse position relative to canvas ===
  const getMousePos = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: snap(e.clientX - rect.left),
      y: snap(e.clientY - rect.top),
    };
  };

  // === Drawing handlers ===
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const pos = getMousePos(e);
    setDrawing(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const pos = getMousePos(e);
    const x = Math.min(drawing.x, pos.x);
    const y = Math.min(drawing.y, pos.y);
    const w = Math.max(GRID_SIZE, Math.abs(pos.x - drawing.x));
    const h = Math.max(GRID_SIZE, Math.abs(pos.y - drawing.y));
    setCurrentRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!drawing || !currentRect) {
      setDrawing(null);
      return;
    }
    // ถ้าพื้นที่ใหญ่พอ ให้โชว์ summary (ยังไม่ confirm)
    // ตอน mouse up เราแค่ finalize selection แต่ยังไม่ save
    setDrawing(null);
  };

  // === คำนวณ area + price ของ selection ปัจจุบัน ===
  const selection = currentRect && currentRect.w >= GRID_SIZE && currentRect.h >= GRID_SIZE
    ? {
        widthM: currentRect.w / GRID_SIZE,
        heightM: currentRect.h / GRID_SIZE,
        areaSqm: (currentRect.w / GRID_SIZE) * (currentRect.h / GRID_SIZE),
        totalPrice: (currentRect.w / GRID_SIZE) * (currentRect.h / GRID_SIZE) * ratePerSqm,
      }
    : null;

  // === ตรวจสอบ collision กับ zones ที่จองแล้ว ===
  const hasCollision = (rect: { x: number; y: number; w: number; h: number }) => {
    return zones.some((z) => {
      const zx = z.x * GRID_SIZE;
      const zy = z.y * GRID_SIZE;
      const zw = z.w * GRID_SIZE;
      const zh = z.h * GRID_SIZE;
      return rect.x < zx + zw && rect.x + rect.w > zx && rect.y < zy + zh && rect.y + rect.h > zy;
    });
  };

  const currentCollision = currentRect ? hasCollision(currentRect) : false;

  // === Confirm booking ===
  const handleConfirm = () => {
    if (!currentRect || !selection) return;
    if (currentCollision) return;

    const newZone: DrawnZone = {
      id: `zone-${Date.now()}`,
      x: currentRect.x / GRID_SIZE,
      y: currentRect.y / GRID_SIZE,
      w: currentRect.w / GRID_SIZE,
      h: currentRect.h / GRID_SIZE,
      bookerName,
      zoneType,
      ratePerSqm,
      startDate,
      endDate,
      label: bookerName,
      fillColor: zoneColors[zoneType].fill,
      strokeColor: zoneColors[zoneType].stroke,
    };
    setZones([...zones, newZone]);
    setCurrentRect(null);
  };

  const handleClear = () => {
    setCurrentRect(null);
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(Math.round(n));

  return (
    <>
      <PageHeader
        icon="🗺️"
        title={locale === 'th' ? 'Floor Plan Editor — จองพื้นที่' : 'Floor Plan Editor — Book Area'}
        subtitle={locale === 'th' ? 'อัปโหลดแปลนแล้วลากเพื่อกำหนดพื้นที่' : 'Upload plan then drag to define area'}
        actions={
          <Button
            variant="contained"
            size="small"
            component="label"
            sx={{ fontSize: 11 }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload_file</span>
            {locale === 'th' ? 'อัปโหลด Floor Plan' : 'Upload Floor Plan'}
            <input type="file" accept=".svg,image/svg+xml,image/png,image/jpeg" hidden onChange={handleUpload} />
          </Button>
        }
      />

      <Box sx={{
        flex: 1, overflow: 'auto',
        p: { xs: 1.5, md: 2.75 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '300px 1fr 300px' },
        gap: 2,
      }}>
        {/* === Left: Booking Form === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>edit_note</span>
              {locale === 'th' ? 'ข้อมูลการจอง' : 'Booking Info'}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: '#6c7f92', mt: .3 }}>
              {locale === 'th' ? 'กรอกข้อมูลแล้วลากเพื่อเลือกพื้นที่' : 'Fill info then drag on plan'}
            </Typography>
          </Box>

          <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              size="small" fullWidth
              label={locale === 'th' ? 'ชื่อผู้จอง / หน่วยงาน' : 'Booker / Organization'}
              value={bookerName}
              onChange={(e) => setBookerName(e.target.value)}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Select size="small" value={zoneType} onChange={(e) => setZoneType(e.target.value as DrawnZone['zoneType'])}>
                <MenuItem value="booth">{locale === 'th' ? 'คูหา' : 'Booth'}</MenuItem>
                <MenuItem value="retail">{locale === 'th' ? 'ร้านค้า' : 'Retail'}</MenuItem>
                <MenuItem value="event">{locale === 'th' ? 'กิจกรรม' : 'Event'}</MenuItem>
                <MenuItem value="lounge">Lounge</MenuItem>
              </Select>
              <TextField
                size="small" type="number"
                label={locale === 'th' ? 'บาท/ตร.ม.' : 'THB/sqm'}
                value={ratePerSqm}
                onChange={(e) => setRatePerSqm(Number(e.target.value))}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <TextField
                size="small" type="date"
                label={locale === 'th' ? 'วันที่เริ่ม' : 'Start'}
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                size="small" type="date"
                label={locale === 'th' ? 'วันที่สิ้นสุด' : 'End'}
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Box>

            <TextField
              size="small" fullWidth
              label={locale === 'th' ? 'หมายเหตุ' : 'Remark'}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button
                variant="contained" size="small"
                disabled={!selection || currentCollision}
                onClick={handleConfirm}
                sx={{ fontSize: 11 }}
              >
                {locale === 'th' ? 'ยืนยันการจอง' : 'Confirm'}
              </Button>
              <Button variant="outlined" size="small" onClick={handleClear} sx={{ fontSize: 11 }}>
                {locale === 'th' ? 'ล้างการเลือก' : 'Clear'}
              </Button>
            </Box>

            <Typography sx={{ fontSize: 10, color: '#6c7f92', mt: 1, lineHeight: 1.5 }}>
              {locale === 'th'
                ? '1 ช่อง = 1 เมตร ระบบ Snap พื้นที่ให้ตรง Grid อัตโนมัติ และตรวจสอบการชนกับพื้นที่ที่จองแล้ว'
                : '1 cell = 1 meter. Auto snap to grid and detect collision with booked areas.'}
            </Typography>
          </Box>
        </Paper>

        {/* === Center: Canvas === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Stats bar */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1, p: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', bgcolor: '#f8fafc' }}>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'ขนาด' : 'Size'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                {selection ? `${selection.widthM} × ${selection.heightM} ${locale === 'th' ? 'ม.' : 'm'}` : '— × —'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'พื้นที่' : 'Area'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                {selection ? `${selection.areaSqm.toFixed(2)} ${locale === 'th' ? 'ตร.ม.' : 'sqm'}` : '— sqm'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'ราคารวม' : 'Total'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: currentCollision ? '#d9534f' : '#1a9e5c' }}>
                {selection ? `฿${formatMoney(selection.totalPrice)}` : '฿—'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{locale === 'th' ? 'สถานะ' : 'Status'}</Typography>
              <Chip
                label={currentCollision ? (locale === 'th' ? 'ทับพื้นที่จอง' : 'Collision') : (selection ? (locale === 'th' ? 'พร้อมจอง' : 'Ready') : (locale === 'th' ? 'ยังไม่เลือก' : 'None'))}
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

          {/* Canvas area — wrapper แบบ scrollable สำหรับ mobile */}
          <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 2 } }}>
            <Box
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { setDrawing(null); }}
              sx={{
                position: 'relative',
                width: canvasSize.width,
                height: canvasSize.height,
                border: '1px solid rgba(22,63,107,.12)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'crosshair',
                background: `
                  linear-gradient(rgba(0,91,159,.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,91,159,.03) 1px, transparent 1px),
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
            {!floorplanSvg && zones.length === 0 && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#6c7f92' }}>
                <span className="material-icons-outlined" style={{ fontSize: 64, opacity: .3 }}>add_photo_alternate</span>
                <Typography sx={{ fontSize: 12, mt: 1 }}>
                  {locale === 'th' ? 'ยังไม่มี Floor Plan — อัปโหลดไฟล์หรือลากเพื่อจองพื้นที่' : 'No Floor Plan — upload file or drag to book'}
                </Typography>
              </Box>
            )}

            {/* Confirmed zones */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {zones.map((zone) => {
                const x = zone.x * GRID_SIZE;
                const y = zone.y * GRID_SIZE;
                const w = zone.w * GRID_SIZE;
                const h = zone.h * GRID_SIZE;
                return (
                  <g key={zone.id}>
                    <rect x={x} y={y} width={w} height={h} fill={zone.fillColor} stroke={zone.strokeColor} strokeWidth="2" rx="4" />
                    <text x={x + 6} y={y + 16} fontSize="11" fontWeight="700" fill={zone.strokeColor} fontFamily="'IBM Plex Sans Thai',sans-serif">
                      {zone.label}
                    </text>
                    <text x={x + 6} y={y + 30} fontSize="9" fill="#6c7f92" fontFamily="'IBM Plex Mono',monospace">
                      {zone.w}×{zone.h}m
                    </text>
                  </g>
                );
              })}

              {/* Current selection (ลากอยู่) */}
              {currentRect && currentRect.w >= GRID_SIZE && currentRect.h >= GRID_SIZE && (
                <g>
                  <rect
                    x={currentRect.x} y={currentRect.y}
                    width={currentRect.w} height={currentRect.h}
                    fill={currentCollision ? 'rgba(217,83,79,.28)' : 'rgba(240,173,78,.32)'}
                    stroke={currentCollision ? '#d9534f' : '#d7a94b'}
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    rx="4"
                  />
                  <text x={currentRect.x + 6} y={currentRect.y + 18} fontSize="11" fontWeight="700" fill={currentCollision ? '#d9534f' : '#b2832d'}>
                    {currentCollision ? (locale === 'th' ? 'ทับพื้นที่จอง!' : 'Collision!') : (locale === 'th' ? 'กำลังเลือก' : 'Selecting')}
                  </text>
                </g>
              )}
            </svg>
            </Box>
          </Box>

          {/* Filename */}
          {floorplanFilename && (
            <Box sx={{ px: 1.5, py: .75, borderTop: '1px solid rgba(22,63,107,.08)', bgcolor: '#f8fafc' }}>
              <Typography sx={{ fontSize: 10.5, color: '#6c7f92', display: 'flex', alignItems: 'center', gap: .5 }}>
                <span className="material-icons-outlined" style={{ fontSize: 14 }}>image</span>
                {floorplanFilename}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* === Right: Booking List === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>list_alt</span>
              {locale === 'th' ? 'รายการจอง' : 'Bookings'} ({zones.length})
            </Typography>
          </Box>

          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 560, overflow: 'auto' }}>
            {zones.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: 11 }}>
                {locale === 'th' ? 'ยังไม่มีการจอง — ลากบนแปลนเพื่อจองพื้นที่' : 'No bookings yet — drag on plan to book'}
              </Alert>
            ) : (
              zones.map((zone, i) => (
                <Paper
                  key={zone.id}
                  elevation={0}
                  sx={{
                    p: 1.5, border: `1px solid ${zone.strokeColor}40`,
                    bgcolor: `${zone.strokeColor}08`,
                    position: 'relative',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: .5 }}>
                    <Chip
                      label={`#${i + 1} ${locale === 'th' ? zoneColors[zone.zoneType].labelTh : zoneColors[zone.zoneType].labelEn}`}
                      size="small"
                      sx={{ fontSize: 9, fontWeight: 700, height: 20, bgcolor: `${zone.strokeColor}20`, color: zone.strokeColor }}
                    />
                    <Button
                      size="small"
                      onClick={() => handleDeleteZone(zone.id)}
                      sx={{ minWidth: 24, p: 0, color: '#d9534f' }}
                    >
                      <span className="material-icons-outlined" style={{ fontSize: 16 }}>delete</span>
                    </Button>
                  </Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{zone.bookerName}</Typography>
                  <Typography sx={{ fontSize: 10.5, color: '#6c7f92', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {zone.w}×{zone.h}m · {(zone.w * zone.h).toFixed(1)} sqm · ฿{formatMoney(zone.w * zone.h * zone.ratePerSqm)}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#6c7f92', mt: .3 }}>
                    {zone.startDate} → {zone.endDate}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
