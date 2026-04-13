import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, InputAdornment, Pagination,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import { useContracts } from '../../api/hooks';

// Fallback — ใช้ตอน offline/demo
const fallbackContracts = [
  { id: 1, contractNo: 'CTR-2566-001', contractType: 'FIXED_RENT', contractStatus: 'ACTIVE', unitCode: 'A-101', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', shopName: 'ครัวไทย', startDate: '2023-04-15', endDate: '2026-04-26', monthlyRent: 65000, daysLeft: 14 },
  { id: 2, contractNo: 'CTR-2566-002', contractType: 'REVENUE_SHARING', contractStatus: 'ACTIVE', unitCode: 'B-201', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', shopName: 'The Brew Coffee', startDate: '2023-04-28', endDate: '2026-05-10', monthlyRent: 80000, daysLeft: 28 },
  { id: 3, contractNo: 'CTR-2566-003', contractType: 'FIXED_RENT', contractStatus: 'ACTIVE', unitCode: 'C-305', partnerName: 'บริษัท คิวเอ็ม จำกัด', shopName: 'QuickMart', startDate: '2023-05-15', endDate: '2026-05-27', monthlyRent: 85000, daysLeft: 45 },
  { id: 4, contractNo: 'CTR-2566-004', contractType: 'FIXED_RENT', contractStatus: 'ACTIVE', unitCode: 'A-112', partnerName: 'บริษัท อินนิก้า จำกัด', shopName: 'SouvThai', startDate: '2023-06-06', endDate: '2026-06-18', monthlyRent: 45000, daysLeft: 67 },
  { id: 5, contractNo: 'CTR-2567-005', contractType: 'CONSIGNMENT', contractStatus: 'ACTIVE', unitCode: 'A-102', partnerName: 'บริษัท ไทยฟู้ด จำกัด', shopName: 'ข้าวแกงป้าแจ่ม', startDate: '2024-01-01', endDate: '2027-12-31', monthlyRent: 15000, daysLeft: 630 },
  { id: 6, contractNo: 'CTR-2567-006', contractType: 'REVENUE_SHARING', contractStatus: 'ACTIVE', unitCode: 'B-202', partnerName: 'บริษัท สตาร์บัคส์ จำกัด', shopName: 'Starbucks', startDate: '2024-03-01', endDate: '2029-02-28', monthlyRent: 120000, daysLeft: 1054 },
  { id: 7, contractNo: 'CTR-2568-007', contractType: 'FIXED_RENT', contractStatus: 'DRAFT', unitCode: 'A-114', partnerName: 'บริษัท เฮลท์พลัส จำกัด', shopName: 'ร้านยา เฮลท์พลัส', startDate: '2025-04-01', endDate: '2028-03-31', monthlyRent: 55000, daysLeft: 1085 },
  { id: 8, contractNo: 'CTR-2568-008', contractType: 'REAL_ESTATE', contractStatus: 'PENDING_APPROVAL', unitCode: 'LAND-01', partnerName: 'บริษัท ปตท. จำกัด (มหาชน)', shopName: 'สถานีบริการน้ำมัน', startDate: '2025-05-01', endDate: '2035-04-30', monthlyRent: 250000, daysLeft: 3306 },
];

const typeConfig: Record<string, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  FIXED_RENT: { label: 'ค่าเช่าคงที่', labelEn: 'Fixed Rent', color: '#005b9f', bg: 'rgba(0,91,159,.1)', border: 'rgba(0,91,159,.25)' },
  REVENUE_SHARING: { label: 'ปันผลประโยชน์', labelEn: 'Revenue Sharing', color: '#0f7a43', bg: 'rgba(26,158,92,.1)', border: 'rgba(26,158,92,.25)' },
  CONSIGNMENT: { label: 'ฝากขาย', labelEn: 'Consignment', color: '#a45a00', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)' },
  REAL_ESTATE: { label: 'อสังหาริมทรัพย์', labelEn: 'Real Estate', color: '#7c3aed', bg: 'rgba(124,58,237,.1)', border: 'rgba(124,58,237,.25)' },
};

const statusConfig: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  ACTIVE: { label: 'มีผลบังคับ', labelEn: 'Active', color: '#0f7a43', bg: 'rgba(26,158,92,.1)' },
  DRAFT: { label: 'ร่าง', labelEn: 'Draft', color: '#5a6d80', bg: 'rgba(108,127,146,.1)' },
  PENDING_REVIEW: { label: 'รอตรวจสอบ', labelEn: 'Pending Review', color: '#a45a00', bg: 'rgba(217,119,6,.1)' },
  PENDING_APPROVAL: { label: 'รออนุมัติ', labelEn: 'Pending Approval', color: '#0f73b8', bg: 'rgba(15,115,184,.1)' },
  EXPIRED: { label: 'หมดอายุ', labelEn: 'Expired', color: '#b52822', bg: 'rgba(217,83,79,.1)' },
};

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(n);

export default function ContractList() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  const { data: apiData } = useContracts({
    search: search || undefined,
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
    type: filterType !== 'ALL' ? filterType : undefined,
  });

  const source = apiData?.data && apiData.data.length > 0 ? apiData.data : fallbackContracts;

  const filtered = apiData?.data
    ? source
    : source.filter((c: any) => {
        const matchSearch = !search || c.contractNo.toLowerCase().includes(search.toLowerCase()) || c.partnerName.includes(search) || (c.shopName && c.shopName.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filterStatus === 'ALL' || c.contractStatus === filterStatus;
        const matchType = filterType === 'ALL' || c.contractType === filterType;
        return matchSearch && matchStatus && matchType;
      });

  return (
    <>
      <PageHeader
        icon="📋"
        title={t('nav.contractList')}
        subtitle={`${locale === 'th' ? 'จัดการสัญญาเช่าทั้งหมด' : 'Manage all lease contracts'} · ${filtered.length} ${locale === 'th' ? 'สัญญา' : 'contracts'}`}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }} onClick={() => window.location.href = '/contracts/create'}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>add</span>
            {t('nav.contractCreate')}
          </Button>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small" placeholder={locale === 'th' ? 'ค้นหาเลขสัญญา, ผู้เช่า...' : 'Search contract, tenant...'}
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: 350, '& .MuiOutlinedInput-root': { fontSize: 12.5 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><span className="material-icons-outlined" style={{ fontSize: 18, color: '#5a6d80' }}>search</span></InputAdornment> }}
          />
          <Select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 140, fontSize: 12 }}>
            <MenuItem value="ALL">{t('common.all')}</MenuItem>
            <MenuItem value="ACTIVE">{locale === 'th' ? 'มีผลบังคับ' : 'Active'}</MenuItem>
            <MenuItem value="DRAFT">{locale === 'th' ? 'ร่าง' : 'Draft'}</MenuItem>
            <MenuItem value="PENDING_APPROVAL">{locale === 'th' ? 'รออนุมัติ' : 'Pending'}</MenuItem>
            <MenuItem value="EXPIRED">{locale === 'th' ? 'หมดอายุ' : 'Expired'}</MenuItem>
          </Select>
          <Select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 160, fontSize: 12 }}>
            <MenuItem value="ALL">{t('common.all')}</MenuItem>
            <MenuItem value="FIXED_RENT">{t('contract.fixedRent')}</MenuItem>
            <MenuItem value="REVENUE_SHARING">{t('contract.revenueSharing')}</MenuItem>
            <MenuItem value="CONSIGNMENT">{t('contract.consignment')}</MenuItem>
            <MenuItem value="REAL_ESTATE">{t('contract.realEstate')}</MenuItem>
          </Select>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{locale === 'th' ? 'เลขสัญญา' : 'Contract No.'}</TableCell>
                <TableCell>{locale === 'th' ? 'ประเภท' : 'Type'}</TableCell>
                <TableCell>{locale === 'th' ? 'พื้นที่' : 'Unit'}</TableCell>
                <TableCell>{locale === 'th' ? 'ผู้เช่า' : 'Tenant'}</TableCell>
                <TableCell align="right">{locale === 'th' ? 'ค่าเช่า/เดือน' : 'Monthly Rent'}</TableCell>
                <TableCell>{locale === 'th' ? 'สิ้นสุด' : 'End Date'}</TableCell>
                <TableCell>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
                <TableCell align="center">{t('units.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => {
                const tp = typeConfig[c.contractType];
                const st = statusConfig[c.contractStatus] || statusConfig.DRAFT;
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                        {c.contractNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={locale === 'th' ? tp.label : tp.labelEn} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 22, bgcolor: tp.bg, color: tp.color, border: `1px solid ${tp.border}` }} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{c.unitCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{c.shopName}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#5a6d80' }}>{c.partnerName}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                        ฿{formatMoney(c.monthlyRent)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11.5 }}>
                        {new Date(c.endDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                      {c.daysLeft <= 90 && c.contractStatus === 'ACTIVE' && (
                        <Typography sx={{ fontSize: 10, color: c.daysLeft <= 30 ? '#b52822' : '#a45a00', fontWeight: 600 }}>
                          {c.daysLeft} {t('floorplan.days')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={locale === 'th' ? st.label : st.labelEn} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 22, bgcolor: st.bg, color: st.color }} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" sx={{ color: '#005b9f' }}><span className="material-icons-outlined" style={{ fontSize: 18 }}>visibility</span></IconButton>
                      <IconButton size="small" sx={{ color: '#5a6d80' }}><span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
