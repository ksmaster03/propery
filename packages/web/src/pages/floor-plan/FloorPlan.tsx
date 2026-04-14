import { useState, useRef, MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Select, MenuItem, Divider, Chip, Alert, IconButton, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';
import { useUnits } from '../../api/hooks';
import { useMaster, ZoneType, useFloorplan, useSaveFloorplan } from '../../api/master-hooks';

// === Types ===
type DrawMode = 'rect' | 'polygon' | 'freehand';
type ShapeType = 'RECT' | 'POLYGON' | 'FREEHAND';

interface Point { x: number; y: number } // หน่วย grid (1 = 1 เมตร)

interface ZoneDraft {
  id: string;
  shapeType: ShapeType;
  // สำหรับ RECT: ใช้ x/y/w/h (grid units)
  x: number;
  y: number;
  w: number;
  h: number;
  // สำหรับ POLYGON/FREEHAND: ใช้ points (grid units)
  points?: Point[];
  bookerName: string;
  zoneType: string;
  zoneColor?: string;
  zoneLabel?: string;
  ratePerSqm: number;
  startDate: string;
  endDate: string;
  // Manual override — ถ้า true ให้ใช้ areaSqm/totalPrice จาก input แทนการคำนวณจาก shape
  manualArea?: number | null;
  manualPrice?: number | null;
  saved?: boolean;
  unitId?: number;
}

// === Geometry helpers ===
// พื้นที่ polygon ด้วย Shoelace formula — คืนค่าเป็น sqm (หน่วย grid^2)
function shoelaceArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

// Bounding box ของ points (grid units)
function pointsBounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = points[0].x, minY = points[0].y, maxX = points[0].x, maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

// Ramer-Douglas-Peucker simplification — ลดจำนวน points ของ freehand path
function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const projX = a.x + t * dx, projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}
function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  let maxDist = 0, maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIndex = i; }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

// แปลง points array → SVG path "M x,y L x,y ... Z"
function pointsToPath(points: Point[], gridSize: number, closed = true): string {
  if (points.length === 0) return '';
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * gridSize},${p.y * gridSize}`).join(' ');
  return closed ? `${d} Z` : d;
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
  VACANT: { fill: 'rgba(26,158,92,.15)', stroke: '#0f7a43' },
  LEASED: { fill: 'rgba(0,91,159,.18)', stroke: '#005b9f' },
  RESERVED: { fill: 'rgba(217,119,6,.18)', stroke: '#a45a00' },
  MAINTENANCE: { fill: 'rgba(108,127,146,.15)', stroke: '#5a6d80' },
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

  // === Drawing mode: rect / polygon / freehand ===
  const [drawMode, setDrawMode] = useState<DrawMode>('rect');

  // === Zoom + Pan state ===
  const [zoom, setZoom] = useState(1);         // 0.25 .. 4
  const [pan, setPan] = useState({ x: 0, y: 0 }); // pixel offset

  // === Drawing state (Rect) ===
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // === Drawing state (Polygon) — points ในหน่วย grid ===
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [polygonCursor, setPolygonCursor] = useState<Point | null>(null); // preview line

  // === Drawing state (Freehand) — raw points ขณะลาก ===
  const [freehandPath, setFreehandPath] = useState<Point[]>([]);
  const [isFreehanding, setIsFreehanding] = useState(false);

  // === Manual override fields (ใน booking form) ===
  const [manualAreaOverride, setManualAreaOverride] = useState(false);
  const [manualArea, setManualArea] = useState<number | ''>('');
  const [manualPriceOverride, setManualPriceOverride] = useState(false);
  const [manualPrice, setManualPrice] = useState<number | ''>('');

  const [draftZones, setDraftZones] = useState<ZoneDraft[]>([]);
  const [savingZone, setSavingZone] = useState(false);

  // === View mode: selected unit (สำหรับ side panel แสดงรายละเอียด + สัญญา) ===
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  // === โหลด units เดิมจาก API (ใช้ fallback ถ้า offline) ===
  const { data: apiData, refetch } = useUnits({});
  const apiUnits = apiData?.data || [];

  // === Master data: zone types ===
  const { data: zoneTypes = [] } = useMaster<ZoneType>('zone-types');

  // === Booking form ===
  const [bookerName, setBookerName] = useState('');
  const [unitCode, setUnitCode] = useState('');        // รหัสพื้นที่ — auto-generate + editable
  const [unitCodeTouched, setUnitCodeTouched] = useState(false); // ถ้า user แก้แล้ว จะไม่ override
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

  // === API hooks สำหรับ Floor Plan SVG ===
  // TODO: ควรใช้ airport ID จาก DB จริง — ตอนนี้ใช้ 1 ทั้งหมด (DMK)
  const airportIdNum = 1;
  const { data: apiFloorplans = [] } = useFloorplan(airportIdNum, buildingId, floorId);
  const saveFloorplanMut = useSaveFloorplan();

  // โหลด SVG จาก API ตอน airport/building/floor เปลี่ยน
  useEffect(() => {
    if (apiFloorplans.length > 0) {
      const fp = apiFloorplans[0];
      setFloorplanSvg(fp.svgContent);
      setFloorplanFilename(fp.name);
    } else {
      setFloorplanSvg(null);
      setFloorplanFilename('');
    }
  }, [apiFloorplans]);

  // Auto-generate unit code ตาม zoneType + running number — ถ้า user ยังไม่ได้แก้
  useEffect(() => {
    if (unitCodeTouched) return;
    const prefix = (zoneType || 'U').charAt(0).toUpperCase();
    // เริ่มนับจาก apiUnits + drafts + 1, ค้นหาเลขที่ยังไม่ซ้ำในระบบ
    const existingCodes = new Set<string>([
      ...apiUnits.map((u) => u.unitCode),
      ...draftZones.map((d: any) => d.unitCode || ''),
    ]);
    let n = apiUnits.filter((u) => u.unitCode?.startsWith(`${prefix}-`)).length + 1;
    let code = `${prefix}-${String(n).padStart(3, '0')}`;
    while (existingCodes.has(code) && n < 9999) {
      n++;
      code = `${prefix}-${String(n).padStart(3, '0')}`;
    }
    setUnitCode(code);
  }, [zoneType, apiUnits, draftZones, unitCodeTouched]);

  // === Upload SVG handler — ส่งขึ้น API ===
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      let svgFinal: string;
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        svgFinal = content;
      } else {
        // PNG/JPG — wrap เป็น SVG
        svgFinal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}"><image href="${content}" width="${canvasSize.width}" height="${canvasSize.height}" preserveAspectRatio="xMidYMid meet" /></svg>`;
      }

      // แสดงบน canvas ทันที
      setFloorplanSvg(svgFinal);
      setFloorplanFilename(file.name);

      // บันทึกลง DB ผ่าน API
      try {
        await saveFloorplanMut.mutateAsync({
          airportId: airportIdNum,
          buildingCode: buildingId,
          floorCode: floorId,
          name: file.name,
          svgContent: svgFinal,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        });
      } catch (err) {
        console.warn('Failed to save floorplan to DB:', err);
      }
    };

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // === Helpers ===
  const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  // แปลง screen pixel → canvas pixel โดยหัก zoom/pan ออก
  const getMousePos = (e: ReactMouseEvent<HTMLDivElement>, snapGrid = true) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    // screen offset ภายใน wrapper
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    // กลับทิศ transform: raw = (screen - pan) / zoom
    const x = (sx - pan.x) / zoom;
    const y = (sy - pan.y) / zoom;
    return snapGrid ? { x: snap(x), y: snap(y) } : { x, y };
  };

  // canvas pixel → grid coord
  const toGrid = (px: number) => px / GRID_SIZE;

  // === Drawing handlers ===
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit') return;
    // Middle click / Space + click → pan (handled separately)
    if (drawMode === 'rect') {
      const pos = getMousePos(e);
      setDrawing(pos);
      setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    } else if (drawMode === 'polygon') {
      const pos = getMousePos(e);
      // Double-click close ใช้ onDoubleClick แยก
      // Click จุดแรกซ้ำ → close polygon
      if (polygonPoints.length >= 3) {
        const first = polygonPoints[0];
        const distPx = Math.hypot(pos.x - first.x * GRID_SIZE, pos.y - first.y * GRID_SIZE);
        if (distPx < GRID_SIZE) {
          // ปิด polygon ไม่ต้องเพิ่ม point
          return;
        }
      }
      setPolygonPoints([...polygonPoints, { x: toGrid(pos.x), y: toGrid(pos.y) }]);
    } else if (drawMode === 'freehand') {
      const pos = getMousePos(e, false); // ไม่ snap — ลื่นกว่า
      setIsFreehanding(true);
      setFreehandPath([{ x: toGrid(pos.x), y: toGrid(pos.y) }]);
    }
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit') return;
    if (drawMode === 'rect' && drawing) {
      const pos = getMousePos(e);
      const x = Math.min(drawing.x, pos.x);
      const y = Math.min(drawing.y, pos.y);
      const w = Math.max(GRID_SIZE, Math.abs(pos.x - drawing.x));
      const h = Math.max(GRID_SIZE, Math.abs(pos.y - drawing.y));
      setCurrentRect({ x, y, w, h });
    } else if (drawMode === 'polygon' && polygonPoints.length > 0) {
      const pos = getMousePos(e);
      setPolygonCursor({ x: toGrid(pos.x), y: toGrid(pos.y) });
    } else if (drawMode === 'freehand' && isFreehanding) {
      const pos = getMousePos(e, false);
      setFreehandPath((prev) => [...prev, { x: toGrid(pos.x), y: toGrid(pos.y) }]);
    }
  };

  const handleMouseUp = () => {
    if (drawMode === 'rect') {
      setDrawing(null);
    } else if (drawMode === 'freehand' && isFreehanding) {
      setIsFreehanding(false);
      // simplify ด้วย RDP epsilon = 0.15 grid units
      setFreehandPath((prev) => (prev.length > 3 ? rdpSimplify(prev, 0.15) : prev));
    }
  };

  // Double-click → ปิด polygon
  const handleDoubleClick = () => {
    if (drawMode === 'polygon' && polygonPoints.length >= 3) {
      setPolygonCursor(null);
    }
  };

  // === Selection calc (unified สำหรับทุก shape) ===
  const selection = useMemo(() => {
    if (drawMode === 'rect' && currentRect && currentRect.w >= GRID_SIZE && currentRect.h >= GRID_SIZE) {
      const widthM = currentRect.w / GRID_SIZE;
      const heightM = currentRect.h / GRID_SIZE;
      const areaSqm = widthM * heightM;
      return {
        shapeType: 'RECT' as ShapeType,
        widthM, heightM, areaSqm,
        totalPrice: areaSqm * ratePerSqm,
      };
    }
    if (drawMode === 'polygon' && polygonPoints.length >= 3) {
      const areaSqm = shoelaceArea(polygonPoints);
      const bb = pointsBounds(polygonPoints);
      return {
        shapeType: 'POLYGON' as ShapeType,
        widthM: bb.maxX - bb.minX,
        heightM: bb.maxY - bb.minY,
        areaSqm,
        totalPrice: areaSqm * ratePerSqm,
      };
    }
    if (drawMode === 'freehand' && freehandPath.length >= 3 && !isFreehanding) {
      const areaSqm = shoelaceArea(freehandPath);
      const bb = pointsBounds(freehandPath);
      return {
        shapeType: 'FREEHAND' as ShapeType,
        widthM: bb.maxX - bb.minX,
        heightM: bb.maxY - bb.minY,
        areaSqm,
        totalPrice: areaSqm * ratePerSqm,
      };
    }
    return null;
  }, [drawMode, currentRect, polygonPoints, freehandPath, isFreehanding, ratePerSqm]);

  // Effective area/price หลัง apply manual override
  const effectiveArea = manualAreaOverride && typeof manualArea === 'number' ? manualArea : selection?.areaSqm || 0;
  const effectivePrice = manualPriceOverride && typeof manualPrice === 'number'
    ? manualPrice
    : effectiveArea * ratePerSqm;

  // === Zoom handlers ===
  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return; // ต้องกด Ctrl + scroll เพื่อ zoom
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(4, Math.max(0.25, zoom * delta));
    // zoom toward cursor — ปรับ pan ให้จุดใต้ cursor อยู่กับที่
    const newPanX = sx - ((sx - pan.x) * newZoom) / zoom;
    const newPanY = sy - ((sy - pan.y) * newZoom) / zoom;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };
  const zoomIn = () => setZoom((z) => Math.min(4, z * 1.2));
  const zoomOut = () => setZoom((z) => Math.max(0.25, z / 1.2));
  const zoomFit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Clear drawing state เมื่อเปลี่ยน drawMode
  const setDrawModeAndReset = (m: DrawMode) => {
    setDrawMode(m);
    setCurrentRect(null);
    setDrawing(null);
    setPolygonPoints([]);
    setPolygonCursor(null);
    setFreehandPath([]);
    setIsFreehanding(false);
  };

  // === Collision check — rect only สำหรับ draft (polygon/freehand ข้าม — AABB ก็พอ) ===
  const hasCollision = (rect: { x: number; y: number; w: number; h: number }) => {
    return draftZones.some((z) => {
      // สำหรับ draft ที่เป็น polygon/freehand ใช้ bounding box check
      if (z.shapeType !== 'RECT' && z.points) {
        const bb = pointsBounds(z.points);
        const zx = bb.minX * GRID_SIZE, zy = bb.minY * GRID_SIZE;
        const zw = (bb.maxX - bb.minX) * GRID_SIZE, zh = (bb.maxY - bb.minY) * GRID_SIZE;
        return rect.x < zx + zw && rect.x + rect.w > zx && rect.y < zy + zh && rect.y + rect.h > zy;
      }
      const zx = z.x * GRID_SIZE, zy = z.y * GRID_SIZE, zw = z.w * GRID_SIZE, zh = z.h * GRID_SIZE;
      return rect.x < zx + zw && rect.x + rect.w > zx && rect.y < zy + zh && rect.y + rect.h > zy;
    });
  };

  // Collision check สำหรับ current drawing (ใช้ bounding box ของ shape)
  const currentCollision = useMemo(() => {
    if (drawMode === 'rect' && currentRect) return hasCollision(currentRect);
    if (drawMode === 'polygon' && polygonPoints.length >= 3) {
      const bb = pointsBounds(polygonPoints);
      return hasCollision({ x: bb.minX * GRID_SIZE, y: bb.minY * GRID_SIZE, w: (bb.maxX - bb.minX) * GRID_SIZE, h: (bb.maxY - bb.minY) * GRID_SIZE });
    }
    if (drawMode === 'freehand' && freehandPath.length >= 3) {
      const bb = pointsBounds(freehandPath);
      return hasCollision({ x: bb.minX * GRID_SIZE, y: bb.minY * GRID_SIZE, w: (bb.maxX - bb.minX) * GRID_SIZE, h: (bb.maxY - bb.minY) * GRID_SIZE });
    }
    return false;
  }, [drawMode, currentRect, polygonPoints, freehandPath, draftZones]);

  // === Save zone → POST /api/units ===
  const handleConfirm = async () => {
    if (!selection || currentCollision) return;
    if (!bookerName.trim()) {
      alert(locale === 'th' ? 'กรุณากรอกชื่อผู้จอง' : 'Please enter booker name');
      return;
    }

    const zt = activeZoneTypes.find((z) => z.code === zoneType);

    // สร้าง ZoneDraft ตามประเภท shape
    let newDraft: ZoneDraft;
    const common = {
      id: `draft-${Date.now()}`,
      bookerName,
      zoneType,
      zoneColor: zt?.color || '#005b9f',
      zoneLabel: zt ? (locale === 'th' ? zt.nameTh : (zt.nameEn || zt.nameTh)) : zoneType,
      ratePerSqm,
      startDate,
      endDate,
      manualArea: manualAreaOverride && typeof manualArea === 'number' ? manualArea : null,
      manualPrice: manualPriceOverride && typeof manualPrice === 'number' ? manualPrice : null,
      saved: false,
    };

    if (selection.shapeType === 'RECT' && currentRect) {
      newDraft = {
        ...common,
        shapeType: 'RECT',
        x: currentRect.x / GRID_SIZE,
        y: currentRect.y / GRID_SIZE,
        w: currentRect.w / GRID_SIZE,
        h: currentRect.h / GRID_SIZE,
      };
    } else if (selection.shapeType === 'POLYGON') {
      const bb = pointsBounds(polygonPoints);
      newDraft = {
        ...common,
        shapeType: 'POLYGON',
        x: bb.minX, y: bb.minY,
        w: bb.maxX - bb.minX, h: bb.maxY - bb.minY,
        points: polygonPoints,
      };
    } else {
      // FREEHAND
      const bb = pointsBounds(freehandPath);
      newDraft = {
        ...common,
        shapeType: 'FREEHAND',
        x: bb.minX, y: bb.minY,
        w: bb.maxX - bb.minX, h: bb.maxY - bb.minY,
        points: freehandPath,
      };
    }

    // ตรวจ unique รหัส unit
    if (!unitCode.trim()) {
      alert(locale === 'th' ? 'กรุณากรอกรหัสพื้นที่' : 'Please enter unit code');
      return;
    }
    const allCodes = new Set<string>(apiUnits.map((u) => u.unitCode).filter(Boolean));
    if (allCodes.has(unitCode)) {
      alert(locale === 'th' ? `รหัส "${unitCode}" ถูกใช้แล้ว` : `Code "${unitCode}" already taken`);
      return;
    }

    setSavingZone(true);

    // พยายามบันทึกลง DB (graceful fallback ถ้า API ไม่มี)
    try {
      const payload: any = {
        unitCode,
        unitNameTh: bookerName,
        airportId: 1, // TODO: resolve from airportId string
        areaSqm: effectiveArea,
        status: 'RESERVED',
        purpose: zt?.nameTh || zoneType,
        fpCoordX: newDraft.x,
        fpCoordY: newDraft.y,
        fpWidth: newDraft.w,
        fpHeight: newDraft.h,
        fpShapeType: newDraft.shapeType,
        fpPoints: newDraft.points || null,
        fpManualArea: !!common.manualArea,
        fpManualPrice: common.manualPrice ?? null,
      };

      const { data } = await api.post('/units', payload);
      if (data.success) {
        newDraft.saved = true;
        newDraft.unitId = data.data.id;
        refetch();
      }
    } catch (err) {
      console.warn('Save to DB failed, keeping as draft:', err);
    }

    setDraftZones([...draftZones, newDraft]);
    // เคลียร์ shape ปัจจุบัน
    setCurrentRect(null);
    setPolygonPoints([]);
    setPolygonCursor(null);
    setFreehandPath([]);
    setManualAreaOverride(false);
    setManualArea('');
    setManualPriceOverride(false);
    setManualPrice('');
    setUnitCodeTouched(false); // กลับไป auto-generate ให้พื้นที่ถัดไป
    setSavingZone(false);
  };

  const handleClear = () => {
    setCurrentRect(null);
    setPolygonPoints([]);
    setPolygonCursor(null);
    setFreehandPath([]);
    setIsFreehanding(false);
  };
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

      <Box tabIndex={0} sx={{
        flex: 1, overflow: 'auto',
        p: { xs: 1.5, md: 2.5 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: mode === 'edit' ? '300px 1fr 280px' : '1fr 300px' },
        gap: 2,
        '&:focus-visible': { outline: '2px solid #005b9f', outlineOffset: -2 },
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
                label={locale === 'th' ? 'รหัสพื้นที่ (แก้ไขได้)' : 'Unit Code (editable)'}
                value={unitCode}
                onChange={(e) => { setUnitCode(e.target.value.toUpperCase()); setUnitCodeTouched(true); }}
                helperText={
                  unitCodeTouched
                    ? (locale === 'th' ? 'แก้ไขเอง — กด reset ถ้าต้องการให้ auto' : 'Custom — click reset to auto')
                    : (locale === 'th' ? 'สร้างอัตโนมัติตามประเภท' : 'Auto from zone type')
                }
                InputProps={{
                  endAdornment: unitCodeTouched && (
                    <IconButton size="small" onClick={() => setUnitCodeTouched(false)} title="Reset to auto">
                      <span className="material-icons-outlined" style={{ fontSize: 16 }}>refresh</span>
                    </IconButton>
                  ),
                  style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 },
                }}
                FormHelperTextProps={{ sx: { fontSize: 9, mt: .25 } }}
              />
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

              {/* === Manual override พื้นที่/ราคา === */}
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#5a6d80', mb: .5, display: 'flex', alignItems: 'center', gap: .5 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 14 }}>tune</span>
                  {locale === 'th' ? 'แก้ไข manual (optional)' : 'Manual override (optional)'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
                  <Button
                    size="small" variant={manualAreaOverride ? 'contained' : 'outlined'}
                    onClick={() => {
                      if (!manualAreaOverride && selection) setManualArea(Number(selection.areaSqm.toFixed(2)));
                      setManualAreaOverride(!manualAreaOverride);
                    }}
                    sx={{ fontSize: 9, minWidth: 60, py: .3 }}
                  >
                    {locale === 'th' ? 'พื้นที่' : 'Area'}
                  </Button>
                  <TextField
                    size="small" type="number" placeholder="sqm"
                    disabled={!manualAreaOverride}
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value === '' ? '' : Number(e.target.value))}
                    inputProps={{ step: '0.01', style: { fontSize: 12 } }}
                  />
                  <Button
                    size="small" variant={manualPriceOverride ? 'contained' : 'outlined'}
                    onClick={() => {
                      if (!manualPriceOverride) setManualPrice(Math.round(effectiveArea * ratePerSqm));
                      setManualPriceOverride(!manualPriceOverride);
                    }}
                    sx={{ fontSize: 9, minWidth: 60, py: .3 }}
                  >
                    {locale === 'th' ? 'ราคา' : 'Price'}
                  </Button>
                  <TextField
                    size="small" type="number" placeholder="THB"
                    disabled={!manualPriceOverride}
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    inputProps={{ style: { fontSize: 12 } }}
                  />
                </Box>
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

              <Typography sx={{ fontSize: 10, color: '#5a6d80', lineHeight: 1.5 }}>
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

          {/* Drawing mode + Zoom toolbar (edit mode) */}
          {mode === 'edit' && (
            <Box sx={{ p: 1.25, borderBottom: '1px solid rgba(22,63,107,.08)', bgcolor: '#f8fafc', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <ToggleButtonGroup
                value={drawMode}
                exclusive
                size="small"
                onChange={(_, v) => v && setDrawModeAndReset(v)}
                aria-label="drawing mode"
              >
                <ToggleButton value="rect" sx={{ fontSize: 10, px: 1.25, py: .5 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>crop_square</span>
                  {locale === 'th' ? 'สี่เหลี่ยม' : 'Rect'}
                </ToggleButton>
                <ToggleButton value="polygon" sx={{ fontSize: 10, px: 1.25, py: .5 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>polyline</span>
                  {locale === 'th' ? 'หลายเหลี่ยม' : 'Polygon'}
                </ToggleButton>
                <ToggleButton value="freehand" sx={{ fontSize: 10, px: 1.25, py: .5 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>gesture</span>
                  {locale === 'th' ? 'ลากมือ' : 'Freehand'}
                </ToggleButton>
              </ToggleButtonGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: .25, ml: 'auto' }}>
                <IconButton size="small" onClick={zoomOut} title="Zoom out">
                  <span className="material-icons-outlined" style={{ fontSize: 18 }}>zoom_out</span>
                </IconButton>
                <Chip label={`${Math.round(zoom * 100)}%`} size="small" sx={{ fontSize: 10, minWidth: 52, fontFamily: "'IBM Plex Mono', monospace" }} />
                <IconButton size="small" onClick={zoomIn} title="Zoom in">
                  <span className="material-icons-outlined" style={{ fontSize: 18 }}>zoom_in</span>
                </IconButton>
                <IconButton size="small" onClick={zoomFit} title="Fit">
                  <span className="material-icons-outlined" style={{ fontSize: 18 }}>crop_free</span>
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Stats bar (edit mode) */}
          {mode === 'edit' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1, p: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', bgcolor: '#f8fafc' }}>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>{locale === 'th' ? 'ขนาด' : 'Size'}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                  {selection ? `${selection.widthM.toFixed(1)}×${selection.heightM.toFixed(1)}m` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>
                  {locale === 'th' ? 'พื้นที่' : 'Area'} {manualAreaOverride && <span style={{ color: '#a45a00' }}>✎</span>}
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#163f6b' }}>
                  {selection ? `${effectiveArea.toFixed(2)} sqm` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>
                  {locale === 'th' ? 'ราคา' : 'Price'} {manualPriceOverride && <span style={{ color: '#a45a00' }}>✎</span>}
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: currentCollision ? '#b52822' : '#0f7a43' }}>
                  {selection ? `฿${formatMoney(effectivePrice)}` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>{locale === 'th' ? 'สถานะ' : 'Status'}</Typography>
                <Chip
                  label={
                    currentCollision ? (locale === 'th' ? 'ชน' : 'Collide') :
                    selection ? (selection.shapeType === 'POLYGON' ? '▲ OK' : selection.shapeType === 'FREEHAND' ? '✎ OK' : '▭ OK') : '—'
                  }
                  size="small"
                  sx={{
                    fontSize: 10, fontWeight: 700, height: 22,
                    bgcolor: currentCollision ? 'rgba(217,83,79,.1)' : selection ? 'rgba(26,158,92,.1)' : '#f4f8fc',
                    color: currentCollision ? '#b52822' : selection ? '#0f7a43' : '#5a6d80',
                    border: `1px solid ${currentCollision ? 'rgba(217,83,79,.25)' : selection ? 'rgba(26,158,92,.25)' : 'rgba(22,63,107,.12)'}`,
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Canvas viewport (scrollable + zoom/pan) */}
          <Box
            tabIndex={0}
            onWheel={handleWheel}
            sx={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              p: 0,
              bgcolor: '#eef3fa',
              '&:focus-visible': { outline: '2px solid #005b9f', outlineOffset: -2 },
            }}
          >
            <Box
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              onMouseLeave={() => { setDrawing(null); setPolygonCursor(null); }}
              sx={{
                position: 'absolute',
                left: 0, top: 0,
                width: canvasSize.width,
                height: canvasSize.height,
                border: '1px solid rgba(22,63,107,.12)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: mode === 'edit' ? (drawMode === 'polygon' ? 'copy' : drawMode === 'freehand' ? 'grabbing' : 'crosshair') : 'default',
                // === Zoom + Pan transform ===
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isFreehanding || drawing ? 'none' : 'transform .1s ease-out',
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
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#5a6d80' }}>
                  <span className="material-icons-outlined" style={{ fontSize: 72, opacity: .25 }}>add_photo_alternate</span>
                  <Typography sx={{ fontSize: 13, mt: 1, fontWeight: 600 }}>
                    {locale === 'th' ? 'ยังไม่มี Floor Plan' : 'No Floor Plan yet'}
                  </Typography>
                  <Typography sx={{ fontSize: 11, mt: .5 }}>
                    {locale === 'th' ? 'กดปุ่ม "อัปโหลด SVG" ด้านบน' : 'Click "Upload SVG" button above'}
                  </Typography>
                </Box>
              )}

              {/* SVG zones layer — pointerEvents เปิดใน view mode เพื่อให้คลิก unit ได้ */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: mode === 'view' ? 'auto' : 'none' }}>
                {/* Existing units from DB */}
                {apiUnits.slice(0, 48).map((u, i) => {
                  if (!u.id) return null;
                  // ใช้ grid layout สำหรับ units ที่ไม่มี coords
                  const cols = 8;
                  const x = 30 + (i % cols) * 105;
                  const y = 70 + Math.floor(i / cols) * 95;
                  const w = 95, h = 80;
                  const color = unitStatusColors[u.status] || unitStatusColors.VACANT;
                  const isSelected = selectedUnitId === u.id;
                  return (
                    <g
                      key={`db-${u.id}`}
                      onClick={() => mode === 'view' && setSelectedUnitId(u.id!)}
                      style={{ cursor: mode === 'view' ? 'pointer' : 'default' }}
                    >
                      <rect
                        x={x} y={y} width={w} height={h}
                        fill={color.fill}
                        stroke={isSelected ? '#d7a94b' : color.stroke}
                        strokeWidth={isSelected ? 4 : 2}
                        rx="4"
                      />
                      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill={color.stroke} fontFamily="'IBM Plex Mono',monospace">
                        {u.unitCode}
                      </text>
                      {u.currentShop && (
                        <text x={x + w / 2} y={y + 40} textAnchor="middle" fontSize="9" fill="#3a5068">
                          {u.currentShop.length > 12 ? u.currentShop.slice(0, 12) + '…' : u.currentShop}
                        </text>
                      )}
                      <text x={x + w / 2} y={y + 56} textAnchor="middle" fontSize="8" fill="#5a6d80" fontFamily="'IBM Plex Mono',monospace">
                        {u.areaSqm} sqm
                      </text>
                    </g>
                  );
                })}

                {/* Draft zones (ใหม่จากการวาด) — render ตาม shape type */}
                {draftZones.map((zone) => {
                  const stroke = zone.zoneColor || '#005b9f';
                  const fill = hexToFill(stroke);
                  const dashArray = zone.saved ? '0' : '4 2';
                  // label ตรงบริเวณมุมบน-ซ้ายของ bbox
                  const labelX = zone.x * GRID_SIZE + 6;
                  const labelY = zone.y * GRID_SIZE + 16;
                  const displayArea = zone.manualArea != null ? zone.manualArea : (zone.shapeType === 'RECT' ? zone.w * zone.h : zone.points ? shoelaceArea(zone.points) : 0);

                  if (zone.shapeType === 'POLYGON' && zone.points) {
                    const pts = zone.points.map((p) => `${p.x * GRID_SIZE},${p.y * GRID_SIZE}`).join(' ');
                    return (
                      <g key={zone.id}>
                        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2" strokeDasharray={dashArray} />
                        <text x={labelX} y={labelY} fontSize="11" fontWeight="700" fill={stroke}>{zone.bookerName}</text>
                        <text x={labelX} y={labelY + 14} fontSize="9" fill="#5a6d80" fontFamily="'IBM Plex Mono',monospace">
                          ▲ {displayArea.toFixed(1)}sqm {zone.saved ? '✓' : '(draft)'}
                        </text>
                      </g>
                    );
                  }
                  if (zone.shapeType === 'FREEHAND' && zone.points) {
                    const d = pointsToPath(zone.points, GRID_SIZE, true);
                    return (
                      <g key={zone.id}>
                        <path d={d} fill={fill} stroke={stroke} strokeWidth="2" strokeDasharray={dashArray} strokeLinejoin="round" />
                        <text x={labelX} y={labelY} fontSize="11" fontWeight="700" fill={stroke}>{zone.bookerName}</text>
                        <text x={labelX} y={labelY + 14} fontSize="9" fill="#5a6d80" fontFamily="'IBM Plex Mono',monospace">
                          ✎ {displayArea.toFixed(1)}sqm {zone.saved ? '✓' : '(draft)'}
                        </text>
                      </g>
                    );
                  }
                  // RECT (default)
                  const x = zone.x * GRID_SIZE;
                  const y = zone.y * GRID_SIZE;
                  const w = zone.w * GRID_SIZE;
                  const h = zone.h * GRID_SIZE;
                  return (
                    <g key={zone.id}>
                      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth="2" rx="4" strokeDasharray={dashArray} />
                      <text x={x + 6} y={y + 16} fontSize="11" fontWeight="700" fill={stroke}>{zone.bookerName}</text>
                      <text x={x + 6} y={y + 30} fontSize="9" fill="#5a6d80" fontFamily="'IBM Plex Mono',monospace">
                        {zone.w}×{zone.h}m {zone.saved ? '✓' : '(draft)'}
                      </text>
                    </g>
                  );
                })}

                {/* Current selection — Rect */}
                {drawMode === 'rect' && currentRect && currentRect.w >= GRID_SIZE && currentRect.h >= GRID_SIZE && (
                  <g>
                    <rect
                      x={currentRect.x} y={currentRect.y}
                      width={currentRect.w} height={currentRect.h}
                      fill={currentCollision ? 'rgba(217,83,79,.28)' : 'rgba(240,173,78,.32)'}
                      stroke={currentCollision ? '#b52822' : '#d7a94b'}
                      strokeWidth="2.5" strokeDasharray="6 4" rx="4"
                    />
                    <text x={currentRect.x + 6} y={currentRect.y + 18} fontSize="11" fontWeight="700" fill={currentCollision ? '#b52822' : '#b2832d'}>
                      {currentCollision ? (locale === 'th' ? 'ทับพื้นที่!' : 'Collision!') : (locale === 'th' ? 'กำลังเลือก' : 'Selecting')}
                    </text>
                  </g>
                )}

                {/* Current selection — Polygon (กำลังวาด) */}
                {drawMode === 'polygon' && polygonPoints.length > 0 && (
                  <g>
                    {/* Closed polygon preview ถ้า >= 3 จุด */}
                    {polygonPoints.length >= 3 && (
                      <polygon
                        points={polygonPoints.map((p) => `${p.x * GRID_SIZE},${p.y * GRID_SIZE}`).join(' ')}
                        fill={currentCollision ? 'rgba(217,83,79,.28)' : 'rgba(240,173,78,.28)'}
                        stroke={currentCollision ? '#b52822' : '#d7a94b'}
                        strokeWidth="2.5" strokeDasharray="6 4"
                      />
                    )}
                    {/* เส้นที่กำลังลาก (cursor preview) */}
                    {polygonCursor && (
                      <line
                        x1={polygonPoints[polygonPoints.length - 1].x * GRID_SIZE}
                        y1={polygonPoints[polygonPoints.length - 1].y * GRID_SIZE}
                        x2={polygonCursor.x * GRID_SIZE}
                        y2={polygonCursor.y * GRID_SIZE}
                        stroke="#d7a94b" strokeWidth="1.5" strokeDasharray="3 3"
                      />
                    )}
                    {/* จุดแต่ละ vertex */}
                    {polygonPoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x * GRID_SIZE} cy={p.y * GRID_SIZE}
                        r={i === 0 ? 6 : 4}
                        fill={i === 0 ? '#0f7a43' : '#d7a94b'}
                        stroke="#fff" strokeWidth="2"
                      />
                    ))}
                    <text
                      x={polygonPoints[0].x * GRID_SIZE + 10}
                      y={polygonPoints[0].y * GRID_SIZE - 8}
                      fontSize="10" fontWeight="700" fill="#0f7a43"
                    >
                      {locale === 'th' ? `${polygonPoints.length} จุด (คลิกจุดแรกเพื่อปิด)` : `${polygonPoints.length} pts (click first to close)`}
                    </text>
                  </g>
                )}

                {/* Current selection — Freehand */}
                {drawMode === 'freehand' && freehandPath.length > 0 && (
                  <g>
                    <path
                      d={pointsToPath(freehandPath, GRID_SIZE, !isFreehanding)}
                      fill={isFreehanding ? 'none' : (currentCollision ? 'rgba(217,83,79,.28)' : 'rgba(240,173,78,.28)')}
                      stroke={currentCollision ? '#b52822' : '#d7a94b'}
                      strokeWidth="2.5"
                      strokeDasharray={isFreehanding ? '0' : '6 4'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
                      <Chip size="small" label="✓" sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(26,158,92,.15)', color: '#0f7a43' }} />
                    )}
                    <IconButton size="small" onClick={() => handleDeleteDraft(zone.id)} sx={{ color: '#b52822' }}>
                      <span className="material-icons-outlined" style={{ fontSize: 16 }}>delete</span>
                    </IconButton>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{zone.bookerName}</Typography>
                <Typography sx={{ fontSize: 10, color: '#5a6d80', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {zone.w}×{zone.h}m · {(zone.w * zone.h).toFixed(1)}sqm · ฿{formatMoney(zone.w * zone.h * zone.ratePerSqm)}
                </Typography>
                <Typography sx={{ fontSize: 9, color: '#5a6d80', mt: .3 }}>
                  {zone.startDate} → {zone.endDate}
                </Typography>
              </Paper>
              );
            })}

            {/* Existing units (view mode) — show selected unit detail or list */}
            {mode === 'view' && apiUnits.length === 0 && (
              <Alert severity="info" sx={{ fontSize: 11 }}>
                {locale === 'th' ? 'ยังไม่มียูนิตในระบบ' : 'No units in database'}
              </Alert>
            )}

            {/* Selected unit detail panel */}
            {mode === 'view' && selectedUnitId && (
              <UnitDetailPanel
                unitId={selectedUnitId}
                apiUnits={apiUnits}
                locale={locale}
                onClose={() => setSelectedUnitId(null)}
              />
            )}

            {/* Unit list (when nothing selected) */}
            {mode === 'view' && !selectedUnitId && apiUnits.slice(0, 20).map((u) => (
              <Paper
                key={u.id}
                elevation={0}
                onClick={() => setSelectedUnitId(u.id!)}
                sx={{ p: 1.25, border: '1px solid rgba(22,63,107,.12)', cursor: 'pointer', '&:hover': { bgcolor: '#f4f8fc', borderColor: '#005b9f' } }}
              >
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
                      color: unitStatusColors[u.status]?.stroke || '#5a6d80',
                    }}
                  />
                </Box>
                {u.currentShop && (
                  <Typography sx={{ fontSize: 11, fontWeight: 600, mt: .3 }}>{u.currentShop}</Typography>
                )}
                <Typography sx={{ fontSize: 10, color: '#5a6d80', fontFamily: "'IBM Plex Mono', monospace", mt: .2 }}>
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

// === Side panel component — รายละเอียด unit ที่เลือก + active contract + ปุ่มจัดการ ===
function UnitDetailPanel({ unitId, apiUnits, locale, onClose }: {
  unitId: number;
  apiUnits: any[];
  locale: string;
  onClose: () => void;
}) {
  const unit = apiUnits.find((u) => u.id === unitId);
  const [contractInfo, setContractInfo] = useState<{ active: any; history: any[]; total: number } | null>(null);
  const [loadingContracts, setLoadingContracts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingContracts(true);
    api.get(`/contracts/by-unit/${unitId}`)
      .then(({ data }) => { if (!cancelled) setContractInfo(data.data); })
      .catch(() => { if (!cancelled) setContractInfo({ active: null, history: [], total: 0 }); })
      .finally(() => { if (!cancelled) setLoadingContracts(false); });
    return () => { cancelled = true; };
  }, [unitId]);

  if (!unit) {
    return (
      <Alert severity="warning" sx={{ fontSize: 11 }}>
        {locale === 'th' ? 'ไม่พบข้อมูลพื้นที่' : 'Unit not found'}
      </Alert>
    );
  }

  const handleNewContract = () => {
    window.location.href = `/contracts/create?unitId=${unit.id}`;
  };
  const handleViewContract = () => {
    if (contractInfo?.active?.id) {
      window.location.href = `/contracts?id=${contractInfo.active.id}`;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size="small" onClick={onClose}>
          <span className="material-icons-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        </IconButton>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#005b9f' }}>
          {locale === 'th' ? 'รายละเอียดพื้นที่' : 'Unit Details'}
        </Typography>
      </Box>

      {/* Unit header card */}
      <Paper elevation={0} sx={{ p: 1.75, border: '1px solid rgba(22,63,107,.12)', background: 'linear-gradient(135deg, rgba(0,91,159,.06), transparent)' }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
          {unit.unitCode}
        </Typography>
        {unit.unitNameTh && (
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{unit.unitNameTh}</Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Chip
            label={unit.status}
            size="small"
            sx={{
              fontSize: 9, fontWeight: 700, height: 20,
              bgcolor: unitStatusColors[unit.status]?.fill || '#f4f8fc',
              color: unitStatusColors[unit.status]?.stroke || '#5a6d80',
            }}
          />
          <Chip label={`${unit.areaSqm} sqm`} size="small" variant="outlined" sx={{ fontSize: 9, height: 20 }} />
          {unit.purpose && <Chip label={unit.purpose} size="small" variant="outlined" sx={{ fontSize: 9, height: 20 }} />}
        </Box>
      </Paper>

      {/* Active contract */}
      <Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#5a6d80', mb: .5 }}>
          {locale === 'th' ? '📄 สัญญาปัจจุบัน' : '📄 Active Contract'}
        </Typography>
        {loadingContracts ? (
          <Typography sx={{ fontSize: 11, color: '#8a9cb2' }}>
            {locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}
          </Typography>
        ) : contractInfo?.active ? (
          <Paper elevation={0} sx={{ p: 1.5, border: '1px solid rgba(0,91,159,.25)', bgcolor: 'rgba(0,91,159,.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: .5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                {contractInfo.active.contractNo}
              </Typography>
              <Chip label="ACTIVE" size="small" sx={{ fontSize: 9, fontWeight: 700, height: 18, bgcolor: 'rgba(26,158,92,.15)', color: '#0f7a43' }} />
            </Box>
            {contractInfo.active.partner && (
              <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
                {contractInfo.active.partner.shopNameTh || contractInfo.active.partner.nameTh}
              </Typography>
            )}
            <Typography sx={{ fontSize: 9, color: '#5a6d80' }}>
              {new Date(contractInfo.active.startDate).toLocaleDateString('th-TH')} → {new Date(contractInfo.active.endDate).toLocaleDateString('th-TH')}
            </Typography>
            <Button
              size="small" variant="outlined" fullWidth sx={{ mt: 1, fontSize: 10 }}
              onClick={handleViewContract}
            >
              <span className="material-icons-outlined" style={{ fontSize: 14, marginRight: 4 }}>open_in_new</span>
              {locale === 'th' ? 'เปิดสัญญา' : 'Open Contract'}
            </Button>
          </Paper>
        ) : (
          <Alert severity="info" sx={{ fontSize: 10, py: .5 }}>
            {locale === 'th' ? 'ยังไม่มีสัญญาที่ active' : 'No active contract'}
          </Alert>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained" size="small" color="primary"
          onClick={handleNewContract}
          disabled={!!contractInfo?.active}
          sx={{ fontSize: 11 }}
        >
          <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>add_circle</span>
          {locale === 'th' ? 'สร้างสัญญาเช่าใหม่' : 'New Contract'}
        </Button>
      </Box>

      {/* History */}
      {contractInfo && contractInfo.history.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#5a6d80', mb: .5 }}>
            {locale === 'th' ? `📜 ประวัติสัญญา (${contractInfo.history.length})` : `📜 History (${contractInfo.history.length})`}
          </Typography>
          {contractInfo.history.slice(0, 5).map((c: any) => (
            <Paper key={c.id} elevation={0} sx={{ p: 1, border: '1px solid rgba(22,63,107,.08)', mb: .5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                  {c.contractNo}
                </Typography>
                <Chip label={c.contractStatus} size="small" sx={{ fontSize: 8, height: 16 }} />
              </Box>
              {c.partner && (
                <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>
                  {c.partner.shopNameTh || c.partner.nameTh}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
