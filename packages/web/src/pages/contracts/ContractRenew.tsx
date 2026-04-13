import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

// ข้อมูล mock สัญญาใกล้หมดอายุ
const mockExpiring = [
  { id: 1, contractNo: 'CTR-2566-001', unitCode: 'A-101', shopName: 'ครัวไทย', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', endDate: '2026-04-26', monthlyRent: 65000, contractType: 'FIXED_RENT', daysLeft: 14, urgency: 'urgent' },
  { id: 2, contractNo: 'CTR-2566-002', unitCode: 'B-201', shopName: 'The Brew Coffee', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', endDate: '2026-05-10', monthlyRent: 80000, contractType: 'REVENUE_SHARING', daysLeft: 28, urgency: 'warning' },
  { id: 3, contractNo: 'CTR-2566-003', unitCode: 'C-305', shopName: 'QuickMart', partnerName: 'บริษัท คิวเอ็ม จำกัด', endDate: '2026-05-27', monthlyRent: 85000, contractType: 'FIXED_RENT', daysLeft: 45, urgency: 'warning' },
  { id: 4, contractNo: 'CTR-2566-004', unitCode: 'A-112', shopName: 'SouvThai', partnerName: 'บริษัท อินนิก้า จำกัด', endDate: '2026-06-18', monthlyRent: 45000, contractType: 'FIXED_RENT', daysLeft: 67, urgency: 'normal' },
  { id: 5, contractNo: 'CTR-2566-008', unitCode: 'B-215', shopName: 'Mister Donut', partnerName: 'บริษัท เซ็นทรัล เรสตอรองส์ จำกัด', endDate: '2026-07-08', monthlyRent: 55000, contractType: 'FIXED_RENT', daysLeft: 87, urgency: 'normal' },
];

const urgencyConfig: Record<string, { color: string; bg: string; border: string; labelTh: string; labelEn: string }> = {
  urgent: { color: '#d9534f', bg: 'rgba(217,83,79,.1)', border: 'rgba(217,83,79,.25)', labelTh: 'เร่งด่วน', labelEn: 'Urgent' },
  warning: { color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)', labelTh: 'ใกล้ถึง', labelEn: 'Approaching' },
  normal: { color: '#005b9f', bg: 'rgba(0,91,159,.1)', border: 'rgba(0,91,159,.25)', labelTh: 'ปกติ', labelEn: 'Normal' },
};

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(n);

export default function ContractRenew() {
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState(0);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selected, setSelected] = useState<typeof mockExpiring[0] | null>(null);

  const tabFilters = [null, 'urgent', 'warning', 'normal'];
  const filtered = tab === 0 ? mockExpiring : mockExpiring.filter((c) => c.urgency === tabFilters[tab]);

  const handleRenew = (contract: typeof mockExpiring[0]) => {
    setSelected(contract);
    setRenewOpen(true);
  };

  return (
    <>
      <PageHeader
        icon="🔄"
        title={t('nav.contractRenew')}
        subtitle={locale === 'th' ? 'จัดการสัญญาใกล้หมดอายุและต่ออายุสัญญา' : 'Manage expiring contracts and renewals'}
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75 }}>
        {/* KPI */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { label: locale === 'th' ? 'เร่งด่วน (≤30 วัน)' : 'Urgent (≤30 days)', value: mockExpiring.filter((c) => c.urgency === 'urgent').length, color: '#d9534f' },
            { label: locale === 'th' ? 'ใกล้ถึง (31-60 วัน)' : 'Approaching (31-60 days)', value: mockExpiring.filter((c) => c.urgency === 'warning').length, color: '#d97706' },
            { label: locale === 'th' ? 'ปกติ (61-90 วัน)' : 'Normal (61-90 days)', value: mockExpiring.filter((c) => c.urgency === 'normal').length, color: '#005b9f' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
              <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color, mt: .5 }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(22,63,107,.08)', minHeight: 40 }}>
            <Tab label={`${t('common.all')} (${mockExpiring.length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'เร่งด่วน' : 'Urgent'} (${mockExpiring.filter((c) => c.urgency === 'urgent').length})`} sx={{ fontSize: 12, minHeight: 40, color: '#d9534f' }} />
            <Tab label={`${locale === 'th' ? 'ใกล้ถึง' : 'Approaching'} (${mockExpiring.filter((c) => c.urgency === 'warning').length})`} sx={{ fontSize: 12, minHeight: 40, color: '#d97706' }} />
            <Tab label={`${locale === 'th' ? 'ปกติ' : 'Normal'} (${mockExpiring.filter((c) => c.urgency === 'normal').length})`} sx={{ fontSize: 12, minHeight: 40 }} />
          </Tabs>

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{locale === 'th' ? 'เลขสัญญา' : 'Contract No.'}</TableCell>
                <TableCell>{locale === 'th' ? 'พื้นที่' : 'Unit'}</TableCell>
                <TableCell>{locale === 'th' ? 'ผู้เช่า' : 'Tenant'}</TableCell>
                <TableCell align="right">{locale === 'th' ? 'ค่าเช่า/เดือน' : 'Monthly Rent'}</TableCell>
                <TableCell>{locale === 'th' ? 'วันสิ้นสุด' : 'End Date'}</TableCell>
                <TableCell align="center">{locale === 'th' ? 'เหลือ' : 'Days Left'}</TableCell>
                <TableCell>{locale === 'th' ? 'ความเร่งด่วน' : 'Urgency'}</TableCell>
                <TableCell align="center">{t('units.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => {
                const u = urgencyConfig[c.urgency];
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>{c.contractNo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{c.unitCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{c.shopName}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#6c7f92' }}>{c.partnerName}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>฿{formatMoney(c.monthlyRent)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12 }}>{new Date(c.endDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: u.color }}>
                        {c.daysLeft}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: '#6c7f92' }}>{locale === 'th' ? 'วัน' : 'days'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={locale === 'th' ? u.labelTh : u.labelEn} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 22, bgcolor: u.bg, color: u.color, border: `1px solid ${u.border}` }} />
                    </TableCell>
                    <TableCell align="center">
                      <Button variant="contained" size="small" onClick={() => handleRenew(c)} sx={{ fontSize: 10, py: .5, mr: .5 }}>
                        <span className="material-icons-outlined" style={{ fontSize: 14, marginRight: 2 }}>autorenew</span>
                        {locale === 'th' ? 'ต่อสัญญา' : 'Renew'}
                      </Button>
                      <Button variant="outlined" size="small" color="error" sx={{ fontSize: 10, py: .5 }}>
                        {locale === 'th' ? 'ไม่ต่อ' : 'Terminate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* Modal ต่อสัญญา */}
      <Dialog open={renewOpen} onClose={() => setRenewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)' }}>
          🔄 {locale === 'th' ? 'ต่ออายุสัญญาเช่า' : 'Renew Lease Contract'}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {selected && (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#f4f8fc', border: '1px solid rgba(0,91,159,.12)' }}>
                <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{locale === 'th' ? 'สัญญาเดิม' : 'Original Contract'}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selected.contractNo} · {selected.unitCode}</Typography>
                <Typography sx={{ fontSize: 12, color: '#6c7f92', mt: .5 }}>{selected.shopName} · {selected.partnerName}</Typography>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField size="small" type="date" label={locale === 'th' ? 'วันที่เริ่มสัญญาใหม่' : 'New Start Date'} defaultValue={selected.endDate} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="date" label={locale === 'th' ? 'วันที่สิ้นสุดสัญญาใหม่' : 'New End Date'} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label={locale === 'th' ? 'ระยะเวลา (ปี)' : 'Duration (years)'} defaultValue="3" />
                <TextField size="small" label={locale === 'th' ? 'ค่าเช่าใหม่ (บาท/เดือน)' : 'New Rent (THB/month)'} defaultValue={selected.monthlyRent + 5000} />
                <TextField size="small" label={locale === 'th' ? 'อัตราเพิ่ม (%)' : 'Increase (%)'} defaultValue="7.7" sx={{ gridColumn: '1/3' }} helperText={locale === 'th' ? 'ตามระเบียบการต่อสัญญา' : 'Per renewal policy'} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(22,63,107,.12)' }}>
          <Button onClick={() => setRenewOpen(false)} variant="outlined">{t('common.cancel')}</Button>
          <Button variant="contained">{locale === 'th' ? 'สร้างสัญญาใหม่' : 'Create New Contract'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
