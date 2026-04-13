import { Box, Paper, Typography, Button, Select, MenuItem, Chip } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import PageHeader from '../../components/shared/PageHeader';
import KpiCard from '../../components/shared/KpiCard';
import { useDashboardKpi, useExpiringContracts } from '../../api/hooks';

// ลงทะเบียน Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ค่า fallback ใช้ตอน API ยังไม่ response หรือ offline demo mode
const fallbackKpi = {
  totalUnits: 48,
  leasedUnits: 34,
  vacantUnits: 9,
  reservedUnits: 5,
  totalAreaSqm: 12840,
  monthlyRevenue: 4270000,
  occupancyRate: 70.8,
};

// ข้อมูลกราฟรายรับรายเดือน
const revenueChartData = {
  labels: ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'],
  datasets: [
    {
      label: 'ประมาณการ',
      data: [3800000, 3900000, 4000000, 4100000, 4200000, 4300000, 4400000, 4500000, 4600000, 4700000, 4800000, 4900000],
      backgroundColor: 'rgba(0,91,159,.15)',
      borderColor: 'rgba(0,91,159,.4)',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'จริง',
      data: [3650000, 3820000, 3940000, 4050000, 4180000, 4270000, null, null, null, null, null, null],
      backgroundColor: 'rgba(0,91,159,.7)',
      borderColor: '#005b9f',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
};

// ข้อมูล fallback สำหรับ expiring contracts (ใช้ตอน API offline)
const fallbackExpiring = [
  { days: 14, shop: 'ร้านอาหาร ครัวไทย (A-104)', partner: 'บริษัท ฟู้ดแลนด์ จำกัด', endDate: '14 เม.ย. 2569', urgency: 'urgent' as const },
  { days: 28, shop: 'ร้านกาแฟ The Brew (B-201)', partner: 'นาย สมศักดิ์ วงศ์ทอง', endDate: '28 เม.ย. 2569', urgency: 'warning' as const },
  { days: 45, shop: 'ร้านสะดวกซื้อ QuickMart (C-305)', partner: 'บริษัท คิวเอ็ม จำกัด', endDate: '15 พ.ค. 2569', urgency: 'warning' as const },
  { days: 67, shop: 'ร้านของที่ระลึก SouvThai (A-112)', partner: 'บริษัท อินนิก้า จำกัด', endDate: '6 มิ.ย. 2569', urgency: 'normal' as const },
];

const urgencyColors = {
  urgent: { color: '#b52822', bg: 'rgba(217,83,79,.1)', border: 'rgba(217,83,79,.25)', label: 'เร่งด่วน' },
  warning: { color: '#a45a00', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)', label: 'ใกล้ถึง' },
  normal: { color: '#005b9f', bg: 'rgba(0,91,159,.1)', border: 'rgba(0,91,159,.25)', label: 'ปกติ' },
};

// ข้อมูลแบ่งรายได้
const revenueSplit = [
  { label: 'กรมธนารักษ์', amount: 2135000, pct: 50, color: '#005b9f' },
  { label: 'กองทุนสวัสดิการ ทย.', amount: 854000, pct: 20, color: '#a45a00' },
  { label: 'เงินทุนหมุนเวียน ทย.', amount: 1281000, pct: 30, color: '#0f7a43' },
];

// ข้อมูลกราฟสถานะชำระ
const paymentChartData = {
  labels: ['ชำระแล้ว', 'รอชำระ', 'เกินกำหนด'],
  datasets: [{
    data: [22, 8, 4],
    backgroundColor: ['#0f7a43', '#a45a00', '#b52822'],
    borderWidth: 0,
  }],
};

export default function Dashboard() {
  // เรียก API จริง — ใช้ fallback เมื่อ offline หรือ error
  const { data: apiKpi } = useDashboardKpi();
  const { data: apiExpiring } = useExpiringContracts(90);

  const kpi = apiKpi || fallbackKpi;

  // แปลงข้อมูล API → format ที่ UI ใช้งาน หรือใช้ fallback
  const expiringContracts = apiExpiring && apiExpiring.length > 0
    ? apiExpiring.map((c) => ({
        days: c.daysLeft,
        shop: `${c.shopName || c.partnerName} (${c.unitCode})`,
        partner: c.partnerName,
        endDate: new Date(c.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        urgency: c.urgency,
      }))
    : fallbackExpiring;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('th-TH').format(n);

  return (
    <>
      <PageHeader
        icon="📊"
        title="Dashboard ภาพรวมรายรับ"
        subtitle="ท่าอากาศยานดอนเมือง · อัปเดต: 31 มี.ค. 2569"
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Select size="small" defaultValue="DMK" sx={{ minWidth: 160, fontSize: 12 }}>
              <MenuItem value="DMK">ท่าอากาศยานดอนเมือง</MenuItem>
              <MenuItem value="CNX">ท่าอากาศยานเชียงใหม่</MenuItem>
              <MenuItem value="HKT">ท่าอากาศยานภูเก็ต</MenuItem>
              <MenuItem value="ALL">ทุกท่าอากาศยาน</MenuItem>
            </Select>
            <Button variant="outlined" size="small" sx={{ fontSize: 11 }}>⬇ ส่งออก Excel</Button>
            <Button variant="contained" size="small" sx={{ fontSize: 11 }}>🖨 พิมพ์รายงาน</Button>
          </Box>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* KPI Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 1.75 }}>
          <KpiCard
            value={kpi.totalUnits}
            label="พื้นที่ทั้งหมด (ยูนิต)"
            subtitle={`▶ ${formatMoney(kpi.totalAreaSqm)} ตร.ม.`}
            subtitleType="neutral"
            accentColor="linear-gradient(90deg, #005b9f, #0f73b8)"
          />
          <KpiCard
            value={kpi.leasedUnits}
            label="พื้นที่เช่าแล้ว"
            subtitle={`${kpi.occupancyRate}% อัตราการเช่า`}
            subtitleType="up"
            accentColor="linear-gradient(90deg, #0f73b8, #3ba8e8)"
          />
          <KpiCard
            value={kpi.vacantUnits}
            label="พื้นที่ว่าง"
            subtitle="18.7% ของทั้งหมด"
            subtitleType="neutral"
            accentColor="linear-gradient(90deg, #0f7a43, #2ec97a)"
          />
          <KpiCard
            value={kpi.reservedUnits}
            label="รอทำสัญญา"
            subtitle="⚠ ใกล้ครบกำหนด 2"
            subtitleType="warn"
            accentColor="linear-gradient(90deg, #a45a00, #f5c842)"
          />
          <KpiCard
            value={kpi.monthlyRevenue >= 1_000_000 ? `${(kpi.monthlyRevenue / 1_000_000).toFixed(2)}M` : formatMoney(kpi.monthlyRevenue)}
            label="รายรับเดือนนี้ (บาท)"
            subtitle="↑ +8.3% จากเดือนก่อน"
            subtitleType="up"
            accentColor="linear-gradient(90deg, #d7a94b, #f5d080)"
          />
        </Box>

        {/* กราฟรายรับ + สัญญาใกล้หมดอายุ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.75, mb: 1.75 }}>
          {/* กราฟรายรับรายเดือน */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.4, borderBottom: '1px solid rgba(22,63,107,.08)', display: 'flex', alignItems: 'center', gap: 1, background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>รายรับค่าเช่ารายเดือน (บาท)</Typography>
                <Typography sx={{ fontSize: 10.5, color: '#5a6d80', mt: .1 }}>เปรียบเทียบประมาณการ vs จริง · ปีงบประมาณ 2569</Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" sx={{ fontSize: 11 }}>ดูทั้งหมด</Button>
            </Box>
            <Box sx={{ p: 2.25, pt: 1 }}>
              <Box sx={{ height: 220 }} role="img" aria-label="กราฟแท่งรายรับรายเดือน — เทียบประมาณการกับยอดจริง">
                <Bar
                  data={revenueChartData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
                    scales: {
                      y: { ticks: { callback: (v) => `${Number(v) / 1000000}M`, font: { size: 10 } } },
                      x: { ticks: { font: { size: 10 } } },
                    },
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* สัญญาใกล้หมดอายุ */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.4, borderBottom: '1px solid rgba(22,63,107,.08)', display: 'flex', alignItems: 'center', gap: 1, background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>⚠ สัญญาใกล้หมดอายุ</Typography>
                <Typography sx={{ fontSize: 10.5, color: '#5a6d80', mt: .1 }}>ภายใน 90 วัน · ต้องดำเนินการต่อสัญญา</Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button size="small" color="warning" variant="outlined" sx={{ fontSize: 11 }}>จัดการ</Button>
            </Box>
            <Box sx={{ p: 2.25 }}>
              {expiringContracts.map((c) => {
                const u = urgencyColors[c.urgency];
                return (
                  <Box
                    key={c.shop}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      p: 1.25, mb: 1, borderRadius: 1,
                      border: '1px solid rgba(22,63,107,.12)',
                      cursor: 'pointer',
                      transition: 'all .15s',
                      '&:hover': { borderColor: u.border, bgcolor: u.bg },
                    }}
                  >
                    <Box sx={{ width: 4, height: 36, borderRadius: .5, bgcolor: u.color, flexShrink: 0 }} />
                    <Box sx={{ textAlign: 'right', minWidth: 38 }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: u.color, lineHeight: 1 }}>
                        {c.days}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: '#5a6d80' }}>วัน</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{c.shop}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#5a6d80' }}>{c.partner} · สิ้นสุด {c.endDate}</Typography>
                    </Box>
                    <Chip
                      label={u.label}
                      size="small"
                      sx={{
                        fontSize: 10, fontWeight: 700, height: 22,
                        bgcolor: u.bg, color: u.color,
                        border: `1px solid ${u.border}`,
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* แถวที่ 3: แบ่งรายได้ + สถานะชำระ + ข้อมูลรวม */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 1.5, mb: 1.75 }}>
          {/* การแบ่งรายได้ */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.4, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>การแบ่งรายได้ (เดือนนี้)</Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {revenueSplit.map((item) => (
                <Box key={item.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, mb: .5 }}>
                    <span>{item.label}</span>
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                      ฿ {formatMoney(item.amount)} ({item.pct}%)
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f4f8fc', borderRadius: 999, height: 7, border: '1px solid rgba(22,63,107,.08)', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${item.pct}%`, borderRadius: 999, bgcolor: item.color }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* สถานะชำระเงิน */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.4, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>สถานะชำระค่าเช่า</Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: 180, height: 180 }} role="img" aria-label="กราฟโดนัทสถานะชำระเงิน — ชำระแล้ว ค้างชำระ เกินกำหนด">
                <Doughnut
                  data={paymentChartData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
                    },
                    cutout: '60%',
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* สรุปสัญญา */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.4, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>สรุปสัญญาเช่า</Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'สัญญาทั้งหมด', value: '34', color: '#005b9f' },
                { label: 'ค่าเช่าคงที่', value: '18', color: '#0f73b8' },
                { label: 'ปันผลประโยชน์', value: '10', color: '#0f7a43' },
                { label: 'ฝากขาย', value: '4', color: '#a45a00' },
                { label: 'อสังหาริมทรัพย์', value: '2', color: '#7c3aed' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .625, borderBottom: '1px solid rgba(22,63,107,.08)', '&:last-child': { borderBottom: 0 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: .5, bgcolor: item.color }} />
                    <Typography sx={{ fontSize: 12 }}>{item.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: item.color }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
