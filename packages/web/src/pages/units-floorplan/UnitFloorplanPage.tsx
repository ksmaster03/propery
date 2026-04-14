import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, Select, MenuItem, Chip, IconButton, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';
import { useAirports, useBuildings, useFloors, useFloorplan } from '../../api/master-hooks';

// === Types ===
type UnitStatus = 'VACANT' | 'LEASED' | 'RESERVED' | 'MAINTENANCE';

interface UnitRow {
  id: number;
  unitCode: string;
  unitNameTh?: string | null;
  areaSqm: number;
  status: UnitStatus;
  purpose?: string | null;
  meterNumber?: string | null;
  airportId: number;
  airportCode: string;
  currentTenant?: string | null;
  currentShop?: string | null;
  currentContractNo?: string | null;
  fpCoordX?: number | null;
  fpCoordY?: number | null;
  fpWidth?: number | null;
  fpHeight?: number | null;
  fpShapeType?: 'RECT' | 'POLYGON' | 'FREEHAND' | null;
  fpPoints?: { x: number; y: number }[] | null;
}

const GRID_SIZE = 24;

const statusColors: Record<UnitStatus, { fill: string; stroke: string; label: string }> = {
  VACANT:      { fill: 'rgba(15,122,67,.15)',   stroke: '#0f7a43', label: 'ว่าง' },
  LEASED:      { fill: 'rgba(0,91,159,.18)',    stroke: '#005b9f', label: 'เช่าแล้ว' },
  RESERVED:    { fill: 'rgba(164,90,0,.18)',    stroke: '#a45a00', label: 'รอทำสัญญา' },
  MAINTENANCE: { fill: 'rgba(90,109,128,.15)',  stroke: '#5a6d80', label: 'ซ่อมแซม' },
};

// แปลง points array → SVG polygon points attribute
function pointsToPolygon(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x * GRID_SIZE},${p.y * GRID_SIZE}`).join(' ');
}
function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * GRID_SIZE},${p.y * GRID_SIZE}`).join(' ') + ' Z';
}

export default function UnitFloorplanPage() {
  const { locale } = useTranslation();
  const qc = useQueryClient();

  // === DB-driven selector (เหมือน FloorPlan page) ===
  const { data: airports = [] } = useAirports();
  const [selectedAirportId, setSelectedAirportId] = useState<number | null>(null);
  const { data: buildings = [] } = useBuildings(selectedAirportId || undefined);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const { data: floors = [] } = useFloors(selectedBuildingId || undefined);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedAirportId && airports.length > 0) setSelectedAirportId(airports[0].id);
  }, [airports, selectedAirportId]);
  useEffect(() => { setSelectedBuildingId(null); setSelectedFloorId(null); }, [selectedAirportId]);
  useEffect(() => {
    if (!selectedBuildingId && buildings.length > 0) setSelectedBuildingId(buildings[0].id);
  }, [buildings, selectedBuildingId]);
  useEffect(() => { setSelectedFloorId(null); }, [selectedBuildingId]);
  useEffect(() => {
    if (!selectedFloorId && floors.length > 0) setSelectedFloorId(floors[0].id);
  }, [floors, selectedFloorId]);

  const activeAirport = airports.find((a) => a.id === selectedAirportId);
  const activeBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const activeFloor = floors.find((f) => f.id === selectedFloorId);

  // === Fetch units + floorplan SVG ===
  const { data: unitsResponse } = useQuery({
    queryKey: ['units-floorplan', selectedAirportId],
    queryFn: async () => {
      const { data } = await api.get('/units', { params: { airportId: selectedAirportId, limit: 100 } });
      return data;
    },
    enabled: !!selectedAirportId,
  });
  const allUnits: UnitRow[] = unitsResponse?.data || [];

  const { data: floorplans = [] } = useFloorplan(
    activeAirport?.id,
    activeBuilding?.buildingCode,
    activeFloor?.floorCode,
  );
  const floorplanSvg = floorplans[0]?.svgContent || null;

  // === Selection state ===
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const selectedUnit = allUnits.find((u) => u.id === selectedUnitId);

  // === Quick status update mutation ===
  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: UnitStatus }) => {
      const { data } = await api.put(`/units/${id}`, { status });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units-floorplan'] }),
  });

  // === Full edit dialog state ===
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UnitRow>>({});

  const openEditDialog = (unit: UnitRow) => {
    setEditForm({ ...unit });
    setEditDialogOpen(true);
  };
  const updateUnitMut = useMutation({
    mutationFn: async (payload: Partial<UnitRow> & { id: number }) => {
      const { id, ...data } = payload;
      const { data: res } = await api.put(`/units/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['units-floorplan'] });
      setEditDialogOpen(false);
    },
  });
  const deleteUnitMut = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/units/${id}`);
      return data;
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['units-floorplan'] });
      if (res.warning) alert(res.warning);
      setEditDialogOpen(false);
    },
  });
  const handleDelete = () => {
    if (!editForm.id) return;
    const confirmed = window.confirm(
      locale === 'th'
        ? `ลบพื้นที่ "${editForm.unitCode}"?\n(ถ้ามีสัญญาจะทำ soft delete)`
        : `Delete unit "${editForm.unitCode}"?`
    );
    if (!confirmed) return;
    deleteUnitMut.mutate(editForm.id);
  };

  // === Canvas pan + zoom (read-only) ===
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const canvasSize = { width: 960, height: 640 };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(4, Math.max(0.25, zoom * delta));
    const scaleChange = 1 - newZoom / zoom;
    setPan({ x: pan.x + sx * scaleChange, y: pan.y + sy * scaleChange });
    setZoom(newZoom);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    setIsPanning(true);
    setPanStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, panX: pan.x, panY: pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStart) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - panStart.x;
    const dy = (e.clientY - rect.top) - panStart.y;
    setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
  };
  const handleMouseUp = () => { setIsPanning(false); setPanStart(null); };

  return (
    <>
      <PageHeader
        icon="🗺️"
        title={locale === 'th' ? 'รายการพื้นที่เช่า — Floor Plan' : 'Rental Units — Floor Plan'}
        subtitle={locale === 'th' ? 'แสดงพื้นที่เช่าบนแปลน · คลิกเพื่อดูและแก้ไข' : 'View units on plan · click to inspect'}
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, '&:focus-visible': { outline: '2px solid #005b9f', outlineOffset: -2 } }}>
        {/* === Filter bar === */}
        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid rgba(22,63,107,.12)', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box sx={{ minWidth: 180 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#5a6d80', mb: .3, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: .5 }}>
              <span className="material-icons-outlined" style={{ fontSize: 13, color: '#005b9f' }}>place</span>
              {locale === 'th' ? 'สถานที่' : 'Location'}
            </Typography>
            <Select
              size="small" fullWidth
              value={selectedAirportId || ''}
              onChange={(e) => setSelectedAirportId(Number(e.target.value))}
              sx={{ fontSize: 12, bgcolor: '#fff' }}
            >
              {airports.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.airportCode} · {locale === 'th' ? a.airportNameTh : (a.airportNameEn || a.airportNameTh)}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ minWidth: 160 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#5a6d80', mb: .3, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: .5 }}>
              <span className="material-icons-outlined" style={{ fontSize: 13, color: '#005b9f' }}>apartment</span>
              {locale === 'th' ? 'อาคาร' : 'Building'}
            </Typography>
            <Select
              size="small" fullWidth
              value={selectedBuildingId || ''}
              onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
              sx={{ fontSize: 12, bgcolor: '#fff' }}
              disabled={!selectedAirportId || buildings.length === 0}
              displayEmpty
              renderValue={(v) => {
                if (!v) return <span style={{ color: '#8a9cb2' }}>{locale === 'th' ? 'เลือกอาคาร' : 'Select'}</span>;
                const b = buildings.find((x) => x.id === v);
                return b ? `${b.buildingCode} · ${locale === 'th' ? b.buildingNameTh : (b.buildingNameEn || b.buildingNameTh)}` : '';
              }}
            >
              {buildings.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.buildingCode} · {locale === 'th' ? b.buildingNameTh : (b.buildingNameEn || b.buildingNameTh)}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ minWidth: 160 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#5a6d80', mb: .3, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: .5 }}>
              <span className="material-icons-outlined" style={{ fontSize: 13, color: '#005b9f' }}>layers</span>
              {locale === 'th' ? 'ชั้น' : 'Floor'}
            </Typography>
            <Select
              size="small" fullWidth
              value={selectedFloorId || ''}
              onChange={(e) => setSelectedFloorId(Number(e.target.value))}
              sx={{ fontSize: 12, bgcolor: '#fff' }}
              disabled={!selectedBuildingId || floors.length === 0}
              displayEmpty
              renderValue={(v) => {
                if (!v) return <span style={{ color: '#8a9cb2' }}>{locale === 'th' ? 'เลือกชั้น' : 'Select'}</span>;
                const f = floors.find((x) => x.id === v);
                return f ? `${f.floorCode} · ${locale === 'th' ? f.floorNameTh : (f.floorNameEn || f.floorNameTh)}` : '';
              }}
            >
              {floors.map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.floorCode} · {locale === 'th' ? f.floorNameTh : (f.floorNameEn || f.floorNameTh)}</MenuItem>
              ))}
            </Select>
          </Box>

          {/* Summary chips */}
          <Box sx={{ display: 'flex', gap: .75, ml: 'auto', alignItems: 'center' }}>
            <Chip label={`${allUnits.length} ${locale === 'th' ? 'พื้นที่' : 'units'}`} size="small" sx={{ fontSize: 10 }} />
            {(['VACANT', 'LEASED', 'RESERVED', 'MAINTENANCE'] as UnitStatus[]).map((s) => {
              const count = allUnits.filter((u) => u.status === s).length;
              return (
                <Chip
                  key={s}
                  label={`${statusColors[s].label}: ${count}`}
                  size="small"
                  sx={{ fontSize: 10, bgcolor: statusColors[s].fill, color: statusColors[s].stroke }}
                />
              );
            })}
          </Box>
        </Paper>

        {/* === Top: Mini floor plan (read-only) === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(22,63,107,.08)', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
            <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>map</span>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {locale === 'th' ? 'แผนผังพื้นที่' : 'Floor Plan View'}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#5a6d80', ml: 2 }}>
              {locale === 'th' ? '(ลากเพื่อย้าย · Ctrl+wheel เพื่อ zoom)' : '(drag to pan · Ctrl+wheel to zoom)'}
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: .25, alignItems: 'center' }}>
              <IconButton size="small" onClick={() => setZoom((z) => Math.max(0.25, z / 1.2))}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>zoom_out</span>
              </IconButton>
              <Chip label={`${Math.round(zoom * 100)}%`} size="small" sx={{ fontSize: 10 }} />
              <IconButton size="small" onClick={() => setZoom((z) => Math.min(4, z * 1.2))}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>zoom_in</span>
              </IconButton>
              <IconButton size="small" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>crop_free</span>
              </IconButton>
            </Box>
          </Box>
          <Box
            onWheel={handleWheel}
            sx={{ position: 'relative', overflow: 'hidden', height: 420, bgcolor: '#eef3fa' }}
          >
            <Box
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              sx={{
                position: 'absolute',
                left: 0, top: 0,
                width: canvasSize.width,
                height: canvasSize.height,
                cursor: isPanning ? 'grabbing' : 'grab',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                background: `
                  linear-gradient(rgba(0,91,159,.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,91,159,.04) 1px, transparent 1px),
                  #fff
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE}px ${GRID_SIZE}px, auto`,
              }}
            >
              {/* Uploaded SVG background */}
              {floorplanSvg && (
                <Box
                  sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .7, '& svg': { width: '100%', height: '100%' } }}
                  dangerouslySetInnerHTML={{ __html: floorplanSvg }}
                />
              )}

              {/* Units */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {allUnits.map((u, i) => {
                  const color = statusColors[u.status as UnitStatus] || statusColors.VACANT;
                  const isSelected = selectedUnitId === u.id;
                  const strokeW = isSelected ? 4 : 2;
                  const strokeColor = isSelected ? '#d7a94b' : color.stroke;
                  const onClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedUnitId(u.id);
                  };

                  if (u.fpShapeType === 'POLYGON' && u.fpPoints && Array.isArray(u.fpPoints)) {
                    return (
                      <g key={u.id} onClick={onClick} style={{ cursor: 'pointer' }}>
                        <polygon points={pointsToPolygon(u.fpPoints)} fill={color.fill} stroke={strokeColor} strokeWidth={strokeW} />
                        <text
                          x={(u.fpCoordX || 0) * GRID_SIZE + 6}
                          y={(u.fpCoordY || 0) * GRID_SIZE + 16}
                          fontSize="11" fontWeight="700" fill={color.stroke}
                          fontFamily="'IBM Plex Mono',monospace"
                        >
                          {u.unitCode}
                        </text>
                      </g>
                    );
                  }
                  if (u.fpShapeType === 'FREEHAND' && u.fpPoints && Array.isArray(u.fpPoints)) {
                    return (
                      <g key={u.id} onClick={onClick} style={{ cursor: 'pointer' }}>
                        <path d={pointsToPath(u.fpPoints)} fill={color.fill} stroke={strokeColor} strokeWidth={strokeW} strokeLinejoin="round" />
                        <text
                          x={(u.fpCoordX || 0) * GRID_SIZE + 6}
                          y={(u.fpCoordY || 0) * GRID_SIZE + 16}
                          fontSize="11" fontWeight="700" fill={color.stroke}
                          fontFamily="'IBM Plex Mono',monospace"
                        >
                          {u.unitCode}
                        </text>
                      </g>
                    );
                  }
                  // RECT with coords
                  if (u.fpCoordX != null && u.fpWidth != null) {
                    const x = u.fpCoordX * GRID_SIZE;
                    const y = (u.fpCoordY || 0) * GRID_SIZE;
                    const w = u.fpWidth * GRID_SIZE;
                    const h = (u.fpHeight || 0) * GRID_SIZE;
                    return (
                      <g key={u.id} onClick={onClick} style={{ cursor: 'pointer' }}>
                        <rect x={x} y={y} width={w} height={h} fill={color.fill} stroke={strokeColor} strokeWidth={strokeW} rx="4" />
                        <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill={color.stroke} fontFamily="'IBM Plex Mono',monospace">{u.unitCode}</text>
                        <text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize="9" fill="#5a6d80">{u.areaSqm} sqm</text>
                      </g>
                    );
                  }
                  // Fallback grid layout
                  const cols = 8;
                  const gx = 30 + (i % cols) * 105;
                  const gy = 30 + Math.floor(i / cols) * 85;
                  return (
                    <g key={u.id} onClick={onClick} style={{ cursor: 'pointer' }}>
                      <rect x={gx} y={gy} width={95} height={70} fill={color.fill} stroke={strokeColor} strokeWidth={strokeW} rx="4" />
                      <text x={gx + 47} y={gy + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill={color.stroke} fontFamily="'IBM Plex Mono',monospace">{u.unitCode}</text>
                      <text x={gx + 47} y={gy + 42} textAnchor="middle" fontSize="9" fill="#5a6d80">{u.areaSqm} sqm</text>
                    </g>
                  );
                })}
              </svg>
            </Box>
          </Box>
        </Paper>

        {/* === Bottom: Table === */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(22,63,107,.08)', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
            <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>list_alt</span>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {locale === 'th' ? `รายการพื้นที่เช่า (${allUnits.length})` : `Units List (${allUnits.length})`}
            </Typography>
          </Box>
          {allUnits.length === 0 ? (
            <Alert severity="info" sx={{ m: 2, fontSize: 12 }}>
              {locale === 'th' ? 'ยังไม่มีพื้นที่ในสถานที่นี้ — สร้างจากหน้า Floor Plan' : 'No units yet — create from Floor Plan page'}
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 10 }}>{locale === 'th' ? 'รหัส' : 'Code'}</TableCell>
                    <TableCell sx={{ fontSize: 10 }}>{locale === 'th' ? 'ชื่อ' : 'Name'}</TableCell>
                    <TableCell sx={{ fontSize: 10 }} align="right">{locale === 'th' ? 'พื้นที่' : 'Area'}</TableCell>
                    <TableCell sx={{ fontSize: 10 }}>{locale === 'th' ? 'วัตถุประสงค์' : 'Purpose'}</TableCell>
                    <TableCell sx={{ fontSize: 10 }}>{locale === 'th' ? 'ผู้เช่าปัจจุบัน' : 'Current Tenant'}</TableCell>
                    <TableCell sx={{ fontSize: 10 }}>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
                    <TableCell sx={{ fontSize: 10 }} align="center">{locale === 'th' ? 'จัดการ' : 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allUnits.map((u) => (
                    <TableRow
                      key={u.id}
                      hover
                      selected={selectedUnitId === u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': { bgcolor: 'rgba(215,169,75,.12)' },
                        '&.Mui-selected:hover': { bgcolor: 'rgba(215,169,75,.18)' },
                      }}
                    >
                      <TableCell sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: '#005b9f' }}>
                        {u.unitCode}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{u.unitNameTh || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} align="right">
                        {u.areaSqm} sqm
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{u.purpose || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>
                        {u.currentShop || u.currentTenant || <span style={{ color: '#8a9cb2' }}>—</span>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
                        <Select
                          size="small"
                          value={u.status}
                          onChange={(e) => updateStatusMut.mutate({ id: u.id, status: e.target.value as UnitStatus })}
                          sx={{
                            fontSize: 10, minWidth: 120,
                            bgcolor: statusColors[u.status as UnitStatus]?.fill,
                            color: statusColors[u.status as UnitStatus]?.stroke,
                            '& .MuiSelect-select': { py: .5 },
                          }}
                        >
                          {(['VACANT', 'LEASED', 'RESERVED', 'MAINTENANCE'] as UnitStatus[]).map((s) => (
                            <MenuItem key={s} value={s} sx={{ fontSize: 11 }}>
                              {s} · {statusColors[s].label}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={() => openEditDialog(u)} title={locale === 'th' ? 'ดูรายละเอียด' : 'View detail'}>
                          <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* === Full edit dialog === */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700 }}>
          {locale === 'th' ? 'แก้ไขพื้นที่เช่า' : 'Edit Unit'}
          {editForm.unitCode && (
            <Typography sx={{ fontSize: 11, color: '#5a6d80', fontWeight: 400, fontFamily: "'IBM Plex Mono', monospace" }}>
              {editForm.unitCode}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              size="small" fullWidth label={locale === 'th' ? 'รหัสพื้นที่' : 'Unit Code'}
              value={editForm.unitCode || ''}
              onChange={(e) => setEditForm({ ...editForm, unitCode: e.target.value.toUpperCase() })}
              inputProps={{ style: { fontFamily: "'IBM Plex Mono', monospace" } }}
            />
            <TextField
              size="small" fullWidth label={locale === 'th' ? 'ชื่อพื้นที่' : 'Name'}
              value={editForm.unitNameTh || ''}
              onChange={(e) => setEditForm({ ...editForm, unitNameTh: e.target.value })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                size="small" type="number" label={locale === 'th' ? 'พื้นที่ (sqm)' : 'Area (sqm)'}
                value={editForm.areaSqm ?? ''}
                onChange={(e) => setEditForm({ ...editForm, areaSqm: Number(e.target.value) })}
              />
              <Select
                size="small"
                value={editForm.status || 'VACANT'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UnitStatus })}
              >
                {(['VACANT', 'LEASED', 'RESERVED', 'MAINTENANCE'] as UnitStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{s} · {statusColors[s].label}</MenuItem>
                ))}
              </Select>
            </Box>
            <TextField
              size="small" fullWidth label={locale === 'th' ? 'วัตถุประสงค์' : 'Purpose'}
              value={editForm.purpose || ''}
              onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
            />
            <TextField
              size="small" fullWidth label={locale === 'th' ? 'เลขมิเตอร์' : 'Meter Number'}
              value={editForm.meterNumber || ''}
              onChange={(e) => setEditForm({ ...editForm, meterNumber: e.target.value })}
            />
            {editForm.currentShop && (
              <Alert severity="info" sx={{ fontSize: 11 }}>
                {locale === 'th' ? `ผู้เช่าปัจจุบัน: ${editForm.currentShop}` : `Current tenant: ${editForm.currentShop}`}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={handleDelete} color="error" size="small" disabled={deleteUnitMut.isPending}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>delete</span>
            {locale === 'th' ? 'ลบ' : 'Delete'}
          </Button>
          <Box>
            <Button onClick={() => setEditDialogOpen(false)} size="small">
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              onClick={() => updateUnitMut.mutate(editForm as any)}
              variant="contained" size="small"
              disabled={updateUnitMut.isPending}
              sx={{ ml: 1 }}
            >
              {updateUnitMut.isPending ? (locale === 'th' ? 'บันทึก...' : 'Saving...') : (locale === 'th' ? 'บันทึก' : 'Save')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
