import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import { useBills } from '../../api/hooks';
import { useMaster, PaymentMethod } from '../../api/master-hooks';
import api from '../../api/client';

// Fallback — ใช้ตอน offline/demo
const fallbackBills = [
  { id: 1, billNo: 'BILL-202604-001', contractNo: 'CTR-2566-001', unitCode: 'A-101', shopName: 'ครัวไทย', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', billingMonth: '2026-04', dueDate: '2026-04-05', status: 'OVERDUE', rentAmount: 65000, totalAmount: 78110, paidAmount: null, overdueDays: 7, lateFee: 224.15 },
  { id: 2, billNo: 'BILL-202604-002', contractNo: 'CTR-2566-002', unitCode: 'B-201', shopName: 'The Brew Coffee', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', billingMonth: '2026-04', dueDate: '2026-04-05', status: 'ISSUED', rentAmount: 80000, totalAmount: 92769, paidAmount: null, overdueDays: 0, lateFee: 0 },
  { id: 3, billNo: 'BILL-202604-003', contractNo: 'CTR-2566-003', unitCode: 'C-305', shopName: 'QuickMart', partnerName: 'บริษัท คิวเอ็ม จำกัด', billingMonth: '2026-04', dueDate: '2026-04-10', status: 'ISSUED', rentAmount: 85000, totalAmount: 96835, paidAmount: null, overdueDays: 0, lateFee: 0 },
  { id: 4, billNo: 'BILL-202603-001', contractNo: 'CTR-2566-001', unitCode: 'A-101', shopName: 'ครัวไทย', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', billingMonth: '2026-03', dueDate: '2026-03-05', status: 'PAID', rentAmount: 65000, totalAmount: 77789, paidAmount: 77789, overdueDays: 0, lateFee: 0 },
  { id: 5, billNo: 'BILL-202603-002', contractNo: 'CTR-2566-002', unitCode: 'B-201', shopName: 'The Brew Coffee', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', billingMonth: '2026-03', dueDate: '2026-03-05', status: 'PAID', rentAmount: 80000, totalAmount: 92662, paidAmount: 92662, overdueDays: 0, lateFee: 0 },
  { id: 6, billNo: 'BILL-202603-003', contractNo: 'CTR-2566-003', unitCode: 'C-305', shopName: 'QuickMart', partnerName: 'บริษัท คิวเอ็ม จำกัด', billingMonth: '2026-03', dueDate: '2026-03-10', status: 'PAID', rentAmount: 85000, totalAmount: 96835, paidAmount: 96835, overdueDays: 0, lateFee: 0 },
];

const statusConfig: Record<string, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  PAID: { label: 'ชำระแล้ว', labelEn: 'Paid', color: '#0f7a43', bg: 'rgba(26,158,92,.1)', border: 'rgba(26,158,92,.25)' },
  ISSUED: { label: 'รอชำระ', labelEn: 'Pending', color: '#a45a00', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)' },
  OVERDUE: { label: 'เกินกำหนด', labelEn: 'Overdue', color: '#b52822', bg: 'rgba(217,83,79,.1)', border: 'rgba(217,83,79,.25)' },
  PARTIALLY_PAID: { label: 'ชำระบางส่วน', labelEn: 'Partial', color: '#0f73b8', bg: 'rgba(15,115,184,.1)', border: 'rgba(15,115,184,.25)' },
};

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);

export default function BillingPage() {
  const { t, locale } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [payForm, setPayForm] = useState({ paidAmount: 0, paymentRef: '', paymentMethod: 'TRANSFER' });
  const [batchMonth, setBatchMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Master data สำหรับ payment method dropdown
  const { data: paymentMethods = [] } = useMaster<PaymentMethod>('payment-methods');

  // Mutations
  const payMut = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.post(`/bills/${id}/pay`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      setPayDialogOpen(false);
      setAlertMsg({ type: 'success', msg: locale === 'th' ? 'บันทึกการชำระเงินเรียบร้อย' : 'Payment recorded' });
      setTimeout(() => setAlertMsg(null), 3000);
    },
    onError: (err: any) => setAlertMsg({ type: 'error', msg: err.response?.data?.error || 'Failed to save payment' }),
  });

  const batchMut = useMutation({
    mutationFn: async (billingMonth: string) => {
      const { data } = await api.post('/bills/generate-batch', { billingMonth: `${billingMonth}-01` });
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      setBatchDialogOpen(false);
      setAlertMsg({ type: 'success', msg: data.message || 'Batch generated' });
      setTimeout(() => setAlertMsg(null), 3000);
    },
    onError: (err: any) => setAlertMsg({ type: 'error', msg: err.response?.data?.error || 'Failed to generate' }),
  });

  const handlePay = (bill: any) => {
    setSelectedBill(bill);
    setPayForm({
      paidAmount: bill.totalAmount + (bill.lateFee || 0),
      paymentRef: '',
      paymentMethod: 'TRANSFER',
    });
    setPayDialogOpen(true);
  };

  const confirmPay = () => {
    if (!selectedBill) return;
    payMut.mutate({ id: selectedBill.id, ...payForm });
  };

  const tabFilters = ['ALL', 'ISSUED', 'PAID', 'OVERDUE'];

  const { data: apiData } = useBills({
    status: tab !== 0 ? tabFilters[tab] : undefined,
  });

  const source = apiData?.data && apiData.data.length > 0 ? apiData.data : fallbackBills;

  const filtered = apiData?.data
    ? source
    : tab === 0 ? source : source.filter((b: any) => b.status === tabFilters[tab]);

  // สรุปตัวเลขจาก source ทั้งหมด (ไม่ filter tab)
  const allBills = apiData?.data || fallbackBills;
  const totalPending = allBills.filter((b: any) => b.status === 'ISSUED').reduce((s: number, b: any) => s + b.totalAmount, 0);
  const totalOverdue = allBills.filter((b: any) => b.status === 'OVERDUE').reduce((s: number, b: any) => s + b.totalAmount, 0);
  const totalPaid = allBills.filter((b: any) => b.status === 'PAID').reduce((s: number, b: any) => s + (b.paidAmount || 0), 0);

  return (
    <>
      <PageHeader
        icon="💳"
        title={t('nav.billing')}
        subtitle={locale === 'th' ? 'จัดการใบแจ้งหนี้และการชำระค่าเช่า' : 'Manage billing and rent payments'}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }} onClick={() => setBatchDialogOpen(true)}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>receipt_long</span>
            {locale === 'th' ? 'สร้างบิลรายเดือน' : 'Generate Monthly Bills'}
          </Button>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* สรุป KPI */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { label: locale === 'th' ? 'บิลทั้งหมด' : 'Total Bills', value: allBills.length, color: '#005b9f' },
            { label: locale === 'th' ? 'รอชำระ' : 'Pending', value: `฿${formatMoney(totalPending)}`, color: '#a45a00' },
            { label: locale === 'th' ? 'เกินกำหนด' : 'Overdue', value: `฿${formatMoney(totalOverdue)}`, color: '#b52822' },
            { label: locale === 'th' ? 'ชำระแล้ว' : 'Paid', value: `฿${formatMoney(totalPaid)}`, color: '#0f7a43' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
              <Typography sx={{ fontSize: 11, color: '#5a6d80' }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color, mt: .5 }}>
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Tabs filter */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(22,63,107,.08)', minHeight: 40 }}>
            <Tab label={`${t('common.all')} (${allBills.length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'รอชำระ' : 'Pending'} (${allBills.filter((b) => b.status === 'ISSUED').length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'ชำระแล้ว' : 'Paid'} (${allBills.filter((b) => b.status === 'PAID').length})`} sx={{ fontSize: 12, minHeight: 40 }} />
            <Tab label={`${locale === 'th' ? 'เกินกำหนด' : 'Overdue'} (${allBills.filter((b) => b.status === 'OVERDUE').length})`} sx={{ fontSize: 12, minHeight: 40, color: '#b52822' }} />
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
                      <Typography sx={{ fontSize: 10.5, color: '#5a6d80' }}>{bill.unitCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{bill.shopName}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#5a6d80' }}>{bill.partnerName}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{bill.billingMonth}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>฿{formatMoney(bill.rentAmount)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>฿{formatMoney(bill.totalAmount)}</Typography>
                      {bill.lateFee > 0 && (
                        <Typography sx={{ fontSize: 10, color: '#b52822' }}>+฿{formatMoney(bill.lateFee)} ({locale === 'th' ? 'ค่าปรับ' : 'late fee'})</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={locale === 'th' ? st.label : st.labelEn} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 22, bgcolor: st.bg, color: st.color, border: `1px solid ${st.border}` }} />
                      {bill.overdueDays > 0 && (
                        <Typography sx={{ fontSize: 10, color: '#b52822', mt: .3 }}>
                          {bill.overdueDays} {locale === 'th' ? 'วัน' : 'days'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {bill.status !== 'PAID' && (
                        <Button size="small" variant="outlined" color="success" sx={{ fontSize: 10, mr: .5 }} onClick={() => handlePay(bill)}>
                          <span className="material-icons-outlined" style={{ fontSize: 14, marginRight: 2 }}>payments</span>
                          {locale === 'th' ? 'ชำระ' : 'Pay'}
                        </Button>
                      )}
                      <IconButton size="small" sx={{ color: '#5a6d80' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>print</span>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        {alertMsg && (
          <Alert severity={alertMsg.type} sx={{ position: 'fixed', top: 80, right: 20, zIndex: 1400, fontSize: 12 }}>
            {alertMsg.msg}
          </Alert>
        )}
      </Box>

      {/* === Pay Dialog === */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)' }}>
          💳 {locale === 'th' ? 'บันทึกการชำระเงิน' : 'Record Payment'}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {selectedBill && (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#f4f8fc' }}>
                <Typography sx={{ fontSize: 11, color: '#5a6d80' }}>{locale === 'th' ? 'บิล' : 'Bill'}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selectedBill.billNo}</Typography>
                <Typography sx={{ fontSize: 12, color: '#5a6d80' }}>{selectedBill.shopName} · ฿{formatMoney(selectedBill.totalAmount)}</Typography>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField size="small" type="number" label={locale === 'th' ? 'จำนวนเงิน' : 'Amount'} value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: Number(e.target.value) })} />
                <Select size="small" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                  {paymentMethods.filter((m) => m.isActive).map((m) => (
                    <MenuItem key={m.id} value={m.code}>{locale === 'th' ? m.nameTh : (m.nameEn || m.nameTh)}</MenuItem>
                  ))}
                </Select>
                <TextField size="small" label={locale === 'th' ? 'เลขอ้างอิง' : 'Reference'} value={payForm.paymentRef} onChange={(e) => setPayForm({ ...payForm, paymentRef: e.target.value })} sx={{ gridColumn: '1/3' }} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(22,63,107,.12)' }}>
          <Button onClick={() => setPayDialogOpen(false)} variant="outlined">
            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button onClick={confirmPay} variant="contained" color="success" disabled={payMut.isPending}>
            {payMut.isPending ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (locale === 'th' ? 'บันทึกการชำระ' : 'Record Payment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* === Batch Generate Dialog === */}
      <Dialog open={batchDialogOpen} onClose={() => setBatchDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)' }}>
          📄 {locale === 'th' ? 'สร้างบิลรายเดือน (Batch)' : 'Generate Monthly Bills'}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Typography sx={{ fontSize: 11, color: '#5a6d80', mb: 2 }}>
            {locale === 'th'
              ? 'ระบบจะสร้างบิลสำหรับทุกสัญญาที่ active ในเดือนที่เลือก คำนวณค่าเช่า + ค่าน้ำค่าไฟ + VAT อัตโนมัติ'
              : 'System will generate bills for all active contracts. Auto-calculates rent + utilities + VAT.'}
          </Typography>
          <TextField
            fullWidth size="small" type="month"
            label={locale === 'th' ? 'เดือนที่ออกบิล' : 'Billing Month'}
            value={batchMonth}
            onChange={(e) => setBatchMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(22,63,107,.12)' }}>
          <Button onClick={() => setBatchDialogOpen(false)} variant="outlined">
            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button onClick={() => batchMut.mutate(batchMonth)} variant="contained" disabled={batchMut.isPending}>
            {batchMut.isPending ? (locale === 'th' ? 'กำลังสร้าง...' : 'Generating...') : (locale === 'th' ? 'สร้างบิล' : 'Generate')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
