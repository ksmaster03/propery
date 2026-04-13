import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, InputAdornment, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

// ข้อมูล mock ผู้เช่า
const mockPartners = [
  { id: 1, partnerCode: 'P-001', partnerType: 'JURISTIC', nameTh: 'บริษัท ฟู้ดแลนด์ จำกัด', nameEn: 'Foodland Co., Ltd.', shopNameTh: 'ครัวไทย', taxId: '0105562001234', contactPerson: 'นาย สมศักดิ์ รุ่งเรือง', phone: '081-234-5678', email: 'somsakr@foodland.co.th', contractCount: 2 },
  { id: 2, partnerCode: 'P-002', partnerType: 'INDIVIDUAL', nameTh: 'นาย สมศักดิ์ วงศ์ทอง', nameEn: 'Somsak Wongthong', shopNameTh: 'The Brew Coffee', taxId: '1100500123456', contactPerson: 'นาย สมศักดิ์ วงศ์ทอง', phone: '089-876-5432', email: 'somsak@thebrew.com', contractCount: 1 },
  { id: 3, partnerCode: 'P-003', partnerType: 'JURISTIC', nameTh: 'บริษัท คิวเอ็ม จำกัด', nameEn: 'QM Co., Ltd.', shopNameTh: 'QuickMart', taxId: '0105563009876', contactPerson: 'นาง พิมพ์ใจ สุขสบาย', phone: '092-111-2222', email: 'pimjai@quickmart.co.th', contractCount: 1 },
  { id: 4, partnerCode: 'P-004', partnerType: 'JURISTIC', nameTh: 'บริษัท อินนิก้า จำกัด', nameEn: 'Innica Co., Ltd.', shopNameTh: 'SouvThai', taxId: '0105564005555', contactPerson: 'นาย ธนวัฒน์ เจริญสุข', phone: '086-333-4444', email: 'thanawat@innica.co.th', contractCount: 1 },
  { id: 5, partnerCode: 'P-005', partnerType: 'JURISTIC', nameTh: 'บริษัท เฮลท์พลัส จำกัด', nameEn: 'HealthPlus Co., Ltd.', shopNameTh: 'ร้านยา เฮลท์พลัส', taxId: '0105567082345', contactPerson: 'นาย ประเสริฐ สุขดี', phone: '081-555-6666', email: 'prasert@healthplus.co.th', contractCount: 0 },
  { id: 6, partnerCode: 'P-006', partnerType: 'JURISTIC', nameTh: 'บริษัท สยามบุ๊คส์ จำกัด', nameEn: 'SiamBooks Co., Ltd.', shopNameTh: 'ร้านหนังสือ SiamBooks', taxId: '0105565007777', contactPerson: 'นาง มาลี อ่อนน้อม', phone: '083-777-8888', email: 'malee@siambooks.co.th', contractCount: 1 },
  { id: 7, partnerCode: 'P-007', partnerType: 'JURISTIC', nameTh: 'บริษัท สตาร์บัคส์ (ประเทศไทย) จำกัด', nameEn: 'Starbucks (Thailand) Co., Ltd.', shopNameTh: 'Starbucks', taxId: '0105548001111', contactPerson: 'นาง วรรณา ดีเลิศ', phone: '02-999-1234', email: 'wanna@starbucks.co.th', contractCount: 3 },
  { id: 8, partnerCode: 'P-008', partnerType: 'INDIVIDUAL', nameTh: 'นาง สมหญิง รักดี', nameEn: 'Somying Rakdee', shopNameTh: 'ก๋วยเตี๋ยวนายเฮง', taxId: '3100600456789', contactPerson: 'นาง สมหญิง รักดี', phone: '087-654-3210', email: '', contractCount: 1 },
];

export default function PartnerList() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = mockPartners.filter((p) => {
    const matchSearch = !search
      || p.nameTh.includes(search) || p.shopNameTh.includes(search)
      || p.taxId.includes(search) || p.partnerCode.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || p.partnerType === filterType;
    return matchSearch && matchType;
  });

  return (
    <>
      <PageHeader
        icon="🏪"
        title={t('partners.title')}
        subtitle={`${t('partners.subtitle')} · ${filtered.length} ${locale === 'th' ? 'ราย' : 'records'}`}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }} onClick={() => setAddOpen(true)}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>person_add</span>
            {t('partners.addPartner')}
          </Button>
        }
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75 }}>
        {/* ค้นหาและ filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('partners.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 160, fontSize: 12 }}
          >
            <MenuItem value="ALL">{t('common.all')}</MenuItem>
            <MenuItem value="JURISTIC">{t('partners.juristic')}</MenuItem>
            <MenuItem value="INDIVIDUAL">{t('partners.individual')}</MenuItem>
          </Select>
        </Box>

        {/* ตาราง */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{t('partners.code')}</TableCell>
                <TableCell>{t('partners.name')}</TableCell>
                <TableCell>{t('partners.shopName')}</TableCell>
                <TableCell>{t('partners.taxId')}</TableCell>
                <TableCell>{t('partners.type')}</TableCell>
                <TableCell>{t('partners.contact')}</TableCell>
                <TableCell>{t('partners.phone')}</TableCell>
                <TableCell align="center">{t('partners.contracts')}</TableCell>
                <TableCell align="center">{t('units.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                      {p.partnerCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{p.nameTh}</Typography>
                    {p.nameEn && <Typography sx={{ fontSize: 10.5, color: '#6c7f92' }}>{p.nameEn}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.shopNameTh}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{p.taxId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.partnerType === 'JURISTIC' ? t('partners.juristic') : t('partners.individual')}
                      size="small"
                      sx={{
                        fontSize: 10, fontWeight: 700, height: 22,
                        bgcolor: p.partnerType === 'JURISTIC' ? 'rgba(0,91,159,.1)' : 'rgba(124,58,237,.1)',
                        color: p.partnerType === 'JURISTIC' ? '#005b9f' : '#7c3aed',
                        border: `1px solid ${p.partnerType === 'JURISTIC' ? 'rgba(0,91,159,.25)' : 'rgba(124,58,237,.25)'}`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.contactPerson}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.phone}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={p.contractCount}
                      size="small"
                      sx={{
                        fontSize: 10, fontWeight: 700, height: 20, minWidth: 28,
                        bgcolor: p.contractCount > 0 ? 'rgba(26,158,92,.1)' : 'rgba(158,158,158,.1)',
                        color: p.contractCount > 0 ? '#1a9e5c' : '#9e9e9e',
                        border: `1px solid ${p.contractCount > 0 ? 'rgba(26,158,92,.25)' : 'rgba(158,158,158,.25)'}`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: '#005b9f' }}>
                      <span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span>
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#6c7f92' }}>
                      <span className="material-icons-outlined" style={{ fontSize: 18 }}>visibility</span>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Modal เพิ่มผู้เช่า */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span className="material-icons-outlined" style={{ fontSize: 20, color: '#005b9f' }}>person_add</span>
            {t('partners.addPartner')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label={t('partners.name')} size="small" fullWidth required />
            <TextField label={locale === 'th' ? 'ชื่อ (อังกฤษ)' : 'Name (English)'} size="small" fullWidth />
            <TextField label={t('partners.shopName')} size="small" fullWidth />
            <TextField label={t('partners.taxId')} size="small" fullWidth required />
            <TextField label={t('partners.contact')} size="small" fullWidth />
            <TextField label={t('partners.phone')} size="small" fullWidth />
            <TextField label="Email" size="small" fullWidth sx={{ gridColumn: '1/3' }} />
            <TextField
              label={locale === 'th' ? 'ที่อยู่' : 'Address'}
              size="small" fullWidth multiline rows={2}
              sx={{ gridColumn: '1/3' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(22,63,107,.12)' }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" size="small">{t('common.cancel')}</Button>
          <Button variant="contained" size="small">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
