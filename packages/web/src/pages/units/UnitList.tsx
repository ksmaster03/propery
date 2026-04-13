import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, InputAdornment, Pagination,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import { useUnits } from '../../api/hooks';

// Fallback — ใช้ตอน offline/demo mode (ไม่มี auth token)
const fallbackUnits = Array.from({ length: 48 }, (_, i) => {
  const zone = i < 16 ? 'A' : i < 32 ? 'B' : 'C';
  const num = zone === 'A' ? 101 + i : zone === 'B' ? 201 + (i - 16) : 301 + (i - 32);
  const statusList = ['LEASED', 'LEASED', 'LEASED', 'RESERVED', 'VACANT'] as const;
  const status = statusList[i % 5];
  const tenants = ['บริษัท ฟู้ดแลนด์ จำกัด', 'นาย สมศักดิ์ วงศ์ทอง', 'บริษัท คิวเอ็ม จำกัด', null, null];
  const shops = ['ครัวไทย', 'The Brew Coffee', 'QuickMart', null, null];

  return {
    id: i + 1,
    unitCode: `${zone}-${num}`,
    unitNameTh: `คูหา ${zone}-${num}`,
    zoneNameTh: zone === 'A' ? 'โซน A (ร้านอาหาร)' : zone === 'B' ? 'โซน B (ร้านค้า)' : 'โซน C (บริการ)',
    areaSqm: 30 + Math.round(Math.random() * 70),
    status,
    purpose: zone === 'A' ? 'ร้านอาหาร' : zone === 'B' ? 'ร้านค้า' : 'บริการ',
    currentTenant: tenants[i % 5],
    currentShop: shops[i % 5],
  };
});

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  LEASED: { color: '#005b9f', bg: 'rgba(0,91,159,.1)', border: 'rgba(0,91,159,.25)' },
  VACANT: { color: '#1a9e5c', bg: 'rgba(26,158,92,.1)', border: 'rgba(26,158,92,.25)' },
  RESERVED: { color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)' },
  MAINTENANCE: { color: '#9e9e9e', bg: 'rgba(158,158,158,.1)', border: 'rgba(158,158,158,.25)' },
};

export default function UnitList() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const perPage = 15;

  // เรียก API — fallback เป็น mock data ตอน offline
  const { data: apiData } = useUnits({
    page,
    search: search || undefined,
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
  });

  const sourceUnits = apiData?.data && apiData.data.length > 0 ? apiData.data : fallbackUnits;

  // กรองข้อมูล (ตอนใช้ fallback — ตอนใช้ API จริง server filter ให้แล้ว)
  const filtered = apiData?.data
    ? sourceUnits
    : sourceUnits.filter((u: any) => {
        const matchSearch = !search || u.unitCode.toLowerCase().includes(search.toLowerCase()) || (u.unitNameTh && u.unitNameTh.includes(search));
        const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
        return matchSearch && matchStatus;
      });

  const paged = apiData?.data ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <PageHeader
        icon="📐"
        title={t('units.title')}
        subtitle={`${t('units.subtitle')} · ${filtered.length} ${locale === 'th' ? 'ยูนิต' : 'units'}`}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>add</span>
            {t('units.addUnit')}
          </Button>
        }
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75 }}>
        {/* ค้นหาและ filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('units.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ flex: 1, maxWidth: 350, '& .MuiOutlinedInput-root': { fontSize: 12.5 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: '#6c7f92' }}>search</span>
                </InputAdornment>
              ),
            }}
          />
          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            sx={{ minWidth: 140, fontSize: 12 }}
          >
            <MenuItem value="ALL">{t('common.all')}</MenuItem>
            <MenuItem value="LEASED">{t('status.leased')}</MenuItem>
            <MenuItem value="VACANT">{t('status.vacant')}</MenuItem>
            <MenuItem value="RESERVED">{t('status.reserved')}</MenuItem>
            <MenuItem value="MAINTENANCE">{t('status.maintenance')}</MenuItem>
          </Select>
          <Button variant="outlined" size="small" sx={{ fontSize: 11 }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>download</span>
            Export
          </Button>
        </Box>

        {/* ตาราง */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{t('units.unitCode')}</TableCell>
                <TableCell>{t('units.unitName')}</TableCell>
                <TableCell>{t('units.zone')}</TableCell>
                <TableCell align="right">{t('units.areaSqm')}</TableCell>
                <TableCell>{t('units.status')}</TableCell>
                <TableCell>{t('units.currentTenant')}</TableCell>
                <TableCell>{t('units.purpose')}</TableCell>
                <TableCell align="center">{t('units.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((unit) => {
                const st = statusConfig[unit.status] || statusConfig.VACANT;
                return (
                  <TableRow key={unit.id} hover sx={{ '&:hover td': { bgcolor: 'rgba(0,91,159,.04)' } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                        {unit.unitCode}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{unit.unitNameTh}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{unit.zoneNameTh}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {unit.areaSqm}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`status.${unit.status.toLowerCase()}`)}
                        size="small"
                        sx={{
                          fontSize: 10, fontWeight: 700, height: 22,
                          bgcolor: st.bg, color: st.color,
                          border: `1px solid ${st.border}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {unit.currentTenant ? (
                        <Box>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{unit.currentShop}</Typography>
                          <Typography sx={{ fontSize: 10.5, color: '#6c7f92' }}>{unit.currentTenant}</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 11, color: '#9e9e9e' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{unit.purpose}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" sx={{ color: '#005b9f' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span>
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#6c7f92' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>visibility</span>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(filtered.length / perPage)}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            size="small"
          />
        </Box>
      </Box>
    </>
  );
}
