import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

// ข้อมูล mock ใบแจ้งหนี้
const mockBills = [
  { id: 1, billNo: 'BILL-202604-001', contractNo: 'CTR-2566-001', unitCode: 'A-101', shopName: 'ครัวไทย', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', billingMonth: '2026-04', dueDate: '2026-04-05', status: 'OVERDUE', rentAmount: 65000, totalAmount: 78110, paidAmount: null, overdueDays: 7, lateFee: 224.15 },
  { id: 2, billNo: 'BILL-202604-002', contractNo: 'CTR-2566-002', unitCode: 'B-201', shopName: 'The Brew Coffee', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', billingMonth: '2026-04', dueDate: '2026-04-05', status: 'ISSUED', rentAmount: 80000, totalAmount: 92769, paidAmount: null, overdueDays: 0, lateFee: 0 },
  { id: 3, billNo: 'BILL-202604-003', contractNo: 'CTR-2566-003', unitCode: 'C-305', shopName: 'QuickMart', partnerName: 'บริษัท คิวเอ็ม จำกัด', billingMonth: '2026-04', dueDate: '2026-04-10', status: 'ISSUED', rentAmount: 85000, totalAmount: 96835, paidAmount: null, overdueDays: 0, lateFee: 0 },
  { id: 4, billNo: 'BILL-202603-001', contractNo: 'CTR-2566-001', unitCode: 'A-101', shopName: 'ครัวไทย', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', billingMonth: '2026-03', dueDate: '2026-03-05', status: 'PAID', rentAmount: 65000, totalAmount: 77789, paidAmount: 77789, overdueDays: 0, lateFee: 0 },
  { id: 5, billNo: 'BILL-202603-002', contractNo: 'CTR-2566-002', unitCode: 'B-201', shopName: 'The Brew Coffee', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', billingMonth: '2026-03', dueDate: '2026-03-05', status: 'PAID', rentAmount: 80000, totalAmount: 92662, paidAmount: 92662, overdueDays: 0, lateFee: 0 },
  { id: 6, billNo: 'BILL-202603-003', contractNo: 'CTR-2566-003', unitCode: 'C-305', shopName: 'QuickMart', partnerName: 'บริษัท คิวเอ็ม จำกัด', billingMonth: '2026-03', dueDate: '2026-03-10', status: 'PAID', rentAmount: 85000, totalAmount: 96835, paidAmount: 96835, overdueDays: 0, lateFee: 0 },
];

const statusConfig: Record<string, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  PAID: { label: 'ชำระแล้ว', labelEn: 'Paid', color: '#1a9e5c', bg: 'rgba(26,158,92,.1)', border: 'rgba(26,158,92,.25)' },
  ISSUED: { label: 'รอชำระ', labelEn: 'Pending', color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)' },
  OVERDUE: { label: 'เกินกำหนด', labelEn: 'Overdue', color: '#d9534f', bg: 'rgba(217,83,79,.1)', border: 'rgba(217,83,79,.25)' },
  PARTIALLY_PAID: { label: 'ชำระบางส่วน', labelEn: 'Partial', color: '#0f73b8', bg: 'rgba(15,115,184,.1)', border: 'rgba(15,115,184,.25)' },
};

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);

export default function BillingPage() {
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState(0);

  const tabFilters = ['ALL', 'ISSUED', 'PAID', 'OVERDUE'];
  const filtered = tab === 0 ? mockBills : mockBills.filter((b) => b.status === tabFilters[tab]);

  // สรุปตัวเลข
  const totalPending = mockBills.filter((b) => b.status === 'ISSUED').reduce((s, b) => s + b.totalAmount, 0);
  const totalOverdue = mockBills.filter((b) => b.status === 'OVERDUE').reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = mockBills.filter((b) => b.status === 'PAID').reduce((s, b) => s + (b.paidAmount || 0), 0);

  return (
    <>
      <PageHeader
        icon="💳"
        title={t('nav.billing')}
        subtitle={locale === 'th' ? 'จัดการใบแจ้งหนี้และการชำระค่าเช่า' : 'Manage billing and rent payments'}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>receipt_long</span>
            {locale === 'th' ? 'สร้างบิลรายเดือน' : 'Generate Monthly Bills'}
          </Button>
        }
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75 }}>
        {/* สรุป KPI */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { label: locale === 'th' ? 'บิลทั้งหมด' : 'Total Bills', value: mockBills.length, color: '#005b9f' },
            { label: locale === 'th' ? 'รอชำระ' : 'Pending', value: `฿${formatMoney(totalPending)}`, color: '#d97706' },
            { label: locale === 'th' ? 'เกินกำหนด' : 'Overdue', value: `฿${formatMoney(totalOverdue)}`, color: '#d9534f' },
            { label: locale === 'th' ? 'ชำระแล้ว' : 'Paid', value: `฿${formatMoney(totalPaid)}`, color: '#1a9e5c' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
              <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color, mt: .5 }}>
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Tabs filter */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(22,63,107,.08)', minHeight: 40 }}>
            <Tab label={`${t('common.all')} (${mockBills.length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'รอชำระ' : 'Pending'} (${mockBills.filter((b) => b.status === 'ISSUED').length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'ชำระแล้ว' : 'Paid'} (${mockBills.filter((b) => b.status === 'PAID').length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'เกินกำหนด' : 'Overdue'} (${mockBills.filter((b) => b.status === 'OVERDUE').length})`} sx={{ fontSize: 12, minHeight: 40, color: '#d9534f' }} />
          </Tabs>

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{locale === 'th' ? 'เลขบิล' : 'Bill No.'}</TableCell>
                <TableCell>{locale === 'th' ? 'สัญญา' : 'Contract'}</TableCell>
                <TableCell>{locale === 'th' ? 'ผู้เช่า' : 'Tenant'}</TableCell>
                <TableCell>{locale === 'th' ? 'เดือน' : 'Month'}</TableCell>
                <TableCell align="right">{locale === 'th' ? 'ค่าเช่า' : 'Rent'}</TableCell>
                <TableCell align="right">{locale === 'th' ? 'รวมทั้งหมด' : 'Total'}</TableCell>
                <TableCell>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
                <TableCell align="center">{t('units.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((bill) => {
                const st = statusConfig[bill.status] || statusConfig.ISSUED;
                return (
                  <TableRow key={bill.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                        {bill.billNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{bill.contractNo}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#6c7f92' }}>{bill.unitCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{bill.shopName}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#6c7f92' }}>{bill.partnerName}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{bill.billingMonth}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>฿{formatMoney(bill.rentAmount)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>฿{formatMoney(bill.totalAmount)}</Typography>
                      {bill.lateFee > 0 && (
                        <Typography sx={{ fontSize: 10, color: '#d9534f' }}>+฿{formatMoney(bill.lateFee)} ({locale === 'th' ? 'ค่าปรับ' : 'late fee'})</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={locale === 'th' ? st.label : st.labelEn} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 22, bgcolor: st.bg, color: st.color, border: `1px solid ${st.border}` }} />
                      {bill.overdueDays > 0 && (
                        <Typography sx={{ fontSize: 10, color: '#d9534f', mt: .3 }}>
                          {bill.overdueDays} {locale === 'th' ? 'วัน' : 'days'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {bill.status !== 'PAID' && (
                        <Button size="small" variant="outlined" color="success" sx={{ fontSize: 10, mr: .5 }}>
                          <span className="material-icons-outlined" style={{ fontSize: 14, marginRight: 2 }}>payments</span>
                          {locale === 'th' ? 'ชำระ' : 'Pay'}
                        </Button>
                      )}
                      <IconButton size="small" sx={{ color: '#6c7f92' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>print</span>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </>
  );
}
