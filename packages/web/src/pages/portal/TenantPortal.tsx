import { Box, Paper, Typography, Button, Chip, Divider } from '@mui/material';
import { useTranslation } from '../../lib/i18n';
import { usePortalDashboard } from '../../api/hooks';

// ข้อมูลจำลอง — fallback เมื่อ API ยังโหลดไม่เสร็จหรือ user ไม่ใช่ tenant
const fallbackTenantInfo = {
  shopName: 'ครัวไทย',
  partnerName: 'บริษัท ฟู้ดแลนด์ จำกัด',
  contractNo: 'CTR-2566-001',
  unitCode: 'A-101',
  areaSqm: 68.5,
  endDate: '2026-04-26',
  daysLeft: 14,
};

const fallbackCurrentBill = {
  billNo: 'BILL-202604-001',
  month: 'เม.ย. 2569',
  totalAmount: 78110,
  dueDate: '2026-04-05',
  status: 'OVERDUE',
  overdueDays: 7,
  lateFee: 224.15,
  items: [
    { label: 'ค่าเช่าพื้นที่', amount: 65000 },
    { label: 'ค่าไฟฟ้า (100 หน่วย)', amount: 4500 },
    { label: 'ค่าบริการส่วนกลาง', amount: 3500 },
    { label: 'VAT 7%', amount: 5110 },
  ],
};

const fallbackPaymentHistory = [
  { month: 'มี.ค. 2569', billNo: 'BILL-202603-001', amount: 77789, date: '2026-03-03', status: 'PAID' },
  { month: 'ก.พ. 2569', billNo: 'BILL-202602-001', amount: 77789, date: '2026-02-05', status: 'PAID' },
  { month: 'ม.ค. 2569', billNo: 'BILL-202601-001', amount: 77789, date: '2026-01-04', status: 'PAID' },
];

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);

export default function TenantPortal() {
  const { locale } = useTranslation();

  // ดึงข้อมูลจาก API (เฉพาะ tenant role)
  const { data: apiPortal, isError } = usePortalDashboard();

  // ใช้ API data ถ้ามี fallback เป็น mock (สำหรับ demo mode)
  const tenantInfo = apiPortal?.contracts?.[0]
    ? {
        shopName: apiPortal.partner.shopNameTh || apiPortal.partner.nameTh,
        partnerName: apiPortal.partner.nameTh,
        contractNo: apiPortal.contracts[0].contractNo,
        unitCode: apiPortal.contracts[0].unitCode,
        areaSqm: apiPortal.contracts[0].areaSqm,
        endDate: apiPortal.contracts[0].endDate,
        daysLeft: apiPortal.contracts[0].daysLeft,
      }
    : fallbackTenantInfo;

  const currentBill = apiPortal?.pendingBills?.[0]
    ? {
        billNo: apiPortal.pendingBills[0].billNo,
        month: new Date(apiPortal.pendingBills[0].billingMonth).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
        totalAmount: apiPortal.pendingBills[0].totalAmount,
        dueDate: new Date(apiPortal.pendingBills[0].dueDate).toISOString().slice(0, 10),
        status: apiPortal.pendingBills[0].status,
        overdueDays: apiPortal.pendingBills[0].overdueDays,
        lateFee: apiPortal.pendingBills[0].lateFeeAmount,
        items: fallbackCurrentBill.items, // API ไม่มี line items — ใช้ fallback
      }
    : fallbackCurrentBill;

  const paymentHistory = apiPortal?.paidBills?.length
    ? apiPortal.paidBills.map((b: any) => ({
        month: new Date(b.billingMonth).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
        billNo: b.billNo,
        amount: b.paidAmount,
        date: b.paidAt ? new Date(b.paidAt).toISOString().slice(0, 10) : '',
        status: 'PAID',
      }))
    : fallbackPaymentHistory;

  return (
    <Box sx={{
      flex: 1, overflow: 'auto',
      background: 'linear-gradient(135deg, #163f6b 0%, #005b9f 60%, #0f73b8 100%)',
      p: 3,
    }}>
      {/* Welcome */}
      <Box sx={{ color: '#fff', mb: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
          {locale === 'th' ? `สวัสดี ${tenantInfo.shopName} 👋` : `Welcome ${tenantInfo.shopName} 👋`}
        </Typography>
        <Typography sx={{ fontSize: 12, opacity: .75, mt: .5 }}>
          {locale === 'th' ? 'ระบบบริหารสัญญาเช่าพื้นที่ · กรมท่าอากาศยาน' : 'Commercial Lease Portal · Department of Airports'}
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Portal KPI */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { icon: 'store', label: locale === 'th' ? 'รหัสพื้นที่' : 'Unit', value: tenantInfo.unitCode, mono: true },
            { icon: 'straighten', label: locale === 'th' ? 'พื้นที่' : 'Area', value: `${tenantInfo.areaSqm} ตร.ม.` },
            { icon: 'article', label: locale === 'th' ? 'เลขสัญญา' : 'Contract', value: tenantInfo.contractNo, mono: true },
            { icon: 'event', label: locale === 'th' ? 'สัญญาสิ้นสุด' : 'Ends In', value: `${tenantInfo.daysLeft} ${locale === 'th' ? 'วัน' : 'days'}`, color: '#f5d080' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{
              p: 2, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
              backdropFilter: 'blur(8px)', color: '#fff',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, opacity: .7 }}>{s.icon}</span>
                <Typography sx={{ fontSize: 10, opacity: .8, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</Typography>
              </Box>
              <Typography sx={{
                fontSize: 20, fontWeight: 700,
                fontFamily: s.mono ? "'IBM Plex Mono', monospace" : 'inherit',
                color: s.color || '#fff', mt: .5,
              }}>
                {s.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* บิลปัจจุบัน + QR */}
        <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 3, boxShadow: '0 8px 28px rgba(0,0,0,.15)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#6c7f92', textTransform: 'uppercase', letterSpacing: .5 }}>
                {locale === 'th' ? 'ใบแจ้งหนี้ประจำเดือน' : 'Monthly Bill'}
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, mt: .5 }}>
                {currentBill.month} · {currentBill.billNo}
              </Typography>
            </Box>
            <Chip
              label={locale === 'th' ? `⚠ เกินกำหนด ${currentBill.overdueDays} วัน` : `⚠ Overdue ${currentBill.overdueDays} days`}
              sx={{ fontSize: 11, fontWeight: 700, bgcolor: 'rgba(217,83,79,.1)', color: '#d9534f', border: '1px solid rgba(217,83,79,.25)' }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 3, alignItems: 'center' }}>
            {/* รายละเอียด */}
            <Box>
              {currentBill.items.map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: .75, borderBottom: '1px dashed rgba(22,63,107,.12)' }}>
                  <Typography sx={{ fontSize: 12 }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>฿{formatMoney(item.amount)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: .75, borderBottom: '1px dashed rgba(217,83,79,.25)', color: '#d9534f' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                  + {locale === 'th' ? 'ค่าปรับล่าช้า' : 'Late Fee'} ({currentBill.overdueDays} {locale === 'th' ? 'วัน' : 'days'})
                </Typography>
                <Typography sx={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>฿{formatMoney(currentBill.lateFee)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, mt: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                  {locale === 'th' ? 'ยอดรวมที่ต้องชำระ' : 'Total Due'}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#d9534f' }}>
                  ฿{formatMoney(currentBill.totalAmount + currentBill.lateFee)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 10, color: '#6c7f92', textAlign: 'right', mt: 1 }}>
                {locale === 'th' ? 'ครบกำหนดชำระ' : 'Due Date'}: {currentBill.dueDate}
              </Typography>
            </Box>

            {/* QR Code */}
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                width: 160, height: 160,
                background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0/20px 20px',
                border: '4px solid #000', borderRadius: 2, mx: 'auto',
                position: 'relative',
              }}>
                <Box sx={{
                  position: 'absolute', inset: 60, bgcolor: '#005b9f',
                  border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-icons-outlined" style={{ fontSize: 20, color: '#fff' }}>flight</span>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#005b9f', mt: 1 }}>
                PromptPay / QR Code
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>
                {locale === 'th' ? 'สแกนด้วยแอปธนาคาร' : 'Scan with banking app'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small">
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>download</span>
              {locale === 'th' ? 'ดาวน์โหลดใบแจ้งหนี้' : 'Download Bill'}
            </Button>
            <Button variant="contained" color="success" size="small">
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload_file</span>
              {locale === 'th' ? 'แจ้งชำระเงิน' : 'Notify Payment'}
            </Button>
          </Box>
        </Paper>

        {/* ประวัติการชำระ */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, boxShadow: '0 8px 28px rgba(0,0,0,.15)' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>history</span>
            {locale === 'th' ? 'ประวัติการชำระเงิน' : 'Payment History'}
          </Typography>
          {paymentHistory.map((p, i) => (
            <Box
              key={p.billNo}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2, py: 1.5,
                borderBottom: i < paymentHistory.length - 1 ? '1px solid rgba(22,63,107,.08)' : 'none',
              }}
            >
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%',
                bgcolor: 'rgba(26,158,92,.1)', color: '#1a9e5c',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span className="material-icons-outlined" style={{ fontSize: 20 }}>check_circle</span>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{p.month}</Typography>
                <Typography sx={{ fontSize: 10.5, color: '#6c7f92', fontFamily: "'IBM Plex Mono', monospace" }}>{p.billNo}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#1a9e5c' }}>
                  ฿{formatMoney(p.amount)}
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>
                  {locale === 'th' ? 'ชำระเมื่อ' : 'Paid'}: {p.date}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" sx={{ fontSize: 10 }}>
                <span className="material-icons-outlined" style={{ fontSize: 14, marginRight: 2 }}>receipt_long</span>
                {locale === 'th' ? 'ใบเสร็จ' : 'Receipt'}
              </Button>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}
