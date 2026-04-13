import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Chip, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import { generateSimplePdf } from '../../lib/pdf';

// ข้อมูล mock ใบเสร็จ
const mockReceipts = [
  { id: 1, receiptNo: 'REC-202603-001', billNo: 'BILL-202603-001', contractNo: 'CTR-2566-001', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', shopName: 'ครัวไทย', amount: 77789, paymentDate: '2026-03-03', paymentMethod: 'TRANSFER', status: 'VERIFIED' },
  { id: 2, receiptNo: 'REC-202603-002', billNo: 'BILL-202603-002', contractNo: 'CTR-2566-002', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', shopName: 'The Brew Coffee', amount: 92662, paymentDate: '2026-03-04', paymentMethod: 'QR_CODE', status: 'VERIFIED' },
  { id: 3, receiptNo: 'REC-202603-003', billNo: 'BILL-202603-003', contractNo: 'CTR-2566-003', partnerName: 'บริษัท คิวเอ็ม จำกัด', shopName: 'QuickMart', amount: 96835, paymentDate: '2026-03-09', paymentMethod: 'TRANSFER', status: 'VERIFIED' },
  { id: 4, receiptNo: 'REC-202602-001', billNo: 'BILL-202602-001', contractNo: 'CTR-2566-001', partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด', shopName: 'ครัวไทย', amount: 77789, paymentDate: '2026-02-05', paymentMethod: 'TRANSFER', status: 'VERIFIED' },
  { id: 5, receiptNo: 'REC-202602-002', billNo: 'BILL-202602-002', contractNo: 'CTR-2566-002', partnerName: 'นาย สมศักดิ์ วงศ์ทอง', shopName: 'The Brew Coffee', amount: 89550, paymentDate: '2026-02-04', paymentMethod: 'QR_CODE', status: 'VERIFIED' },
];

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);

export default function ReceiptPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = mockReceipts.filter((r) =>
    !search
    || r.receiptNo.toLowerCase().includes(search.toLowerCase())
    || r.partnerName.includes(search)
    || r.shopName.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        icon="🧾"
        title={t('nav.receipt')}
        subtitle={locale === 'th' ? 'จัดการใบเสร็จรับเงินทั้งหมด' : 'Manage all receipts'}
        actions={
          <Button variant="outlined" size="small" sx={{ fontSize: 11 }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>sync</span>
            {locale === 'th' ? 'Sync จากระบบกลาง' : 'Sync from Central'}
          </Button>
        }
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75 }}>
        {/* KPI */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { label: locale === 'th' ? 'ใบเสร็จทั้งหมด' : 'Total Receipts', value: mockReceipts.length, color: '#005b9f' },
            { label: locale === 'th' ? 'ยอดรวม' : 'Total Amount', value: `฿${formatMoney(totalAmount)}`, color: '#1a9e5c' },
            { label: locale === 'th' ? 'เดือนนี้' : 'This Month', value: 3, color: '#0f73b8' },
            { label: locale === 'th' ? 'รอตรวจสอบ' : 'Pending Verify', value: 0, color: '#d97706' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
              <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color, mt: .5 }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Search */}
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder={locale === 'th' ? 'ค้นหาเลขใบเสร็จ, ผู้เช่า...' : 'Search receipt no, tenant...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 400, '& .MuiOutlinedInput-root': { fontSize: 12.5 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: '#6c7f92' }}>search</span>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Table */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{locale === 'th' ? 'เลขใบเสร็จ' : 'Receipt No.'}</TableCell>
                <TableCell>{locale === 'th' ? 'อ้างบิล' : 'Bill Ref'}</TableCell>
                <TableCell>{locale === 'th' ? 'ผู้ชำระ' : 'Payer'}</TableCell>
                <TableCell align="right">{locale === 'th' ? 'จำนวนเงิน' : 'Amount'}</TableCell>
                <TableCell>{locale === 'th' ? 'วันที่ชำระ' : 'Payment Date'}</TableCell>
                <TableCell>{locale === 'th' ? 'ช่องทาง' : 'Method'}</TableCell>
                <TableCell>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
                <TableCell align="center">{t('units.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#1a9e5c' }}>{r.receiptNo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>{r.billNo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{r.shopName}</Typography>
                    <Typography sx={{ fontSize: 10.5, color: '#6c7f92' }}>{r.partnerName}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>฿{formatMoney(r.amount)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 11.5 }}>{new Date(r.paymentDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<span className="material-icons-outlined" style={{ fontSize: 14, marginLeft: 4 }}>{r.paymentMethod === 'QR_CODE' ? 'qr_code_2' : 'account_balance'}</span>}
                      label={r.paymentMethod === 'QR_CODE' ? (locale === 'th' ? 'QR Code' : 'QR Code') : (locale === 'th' ? 'โอนธนาคาร' : 'Bank Transfer')}
                      sx={{ fontSize: 10, height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={locale === 'th' ? 'ตรวจสอบแล้ว' : 'Verified'} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 22, bgcolor: 'rgba(26,158,92,.1)', color: '#1a9e5c', border: '1px solid rgba(26,158,92,.25)' }} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: '#005b9f' }} title={locale === 'th' ? 'ดูใบเสร็จ' : 'View Receipt'}>
                      <span className="material-icons-outlined" style={{ fontSize: 18 }}>visibility</span>
                    </IconButton>
                    <IconButton
                      size="small" sx={{ color: '#6c7f92' }} title={locale === 'th' ? 'พิมพ์' : 'Print'}
                      onClick={() => window.print()}
                    >
                      <span className="material-icons-outlined" style={{ fontSize: 18 }}>print</span>
                    </IconButton>
                    <IconButton
                      size="small" sx={{ color: '#1a9e5c' }} title={locale === 'th' ? 'ดาวน์โหลด PDF' : 'Download PDF'}
                      onClick={() => {
                        generateSimplePdf(
                          `ใบเสร็จรับเงิน / Official Receipt`,
                          [
                            ['เลขที่ใบเสร็จ / Receipt No.', r.receiptNo],
                            ['อ้างอิงบิล / Bill Ref', r.billNo],
                            ['สัญญา / Contract', r.contractNo],
                            ['ผู้ชำระ / Payer', r.shopName],
                            ['นิติบุคคล / Entity', r.partnerName],
                            ['จำนวนเงิน / Amount', `฿${formatMoney(r.amount)}`],
                            ['วันที่ชำระ / Payment Date', r.paymentDate],
                            ['ช่องทางชำระ / Method', r.paymentMethod],
                            ['สถานะ / Status', r.status],
                          ],
                          `${r.receiptNo}.pdf`
                        );
                      }}
                    >
                      <span className="material-icons-outlined" style={{ fontSize: 18 }}>download</span>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </>
  );
}
