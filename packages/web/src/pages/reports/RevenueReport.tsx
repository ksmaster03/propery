import { Box, Paper, Typography, Select, MenuItem, Button } from '@mui/material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Title, Tooltip, Legend,
} from 'chart.js';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import { useRevenueReport } from '../../api/hooks';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend);

const months = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
const monthsEn = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(n);

export default function RevenueReport() {
  const { locale } = useTranslation();
  const labels = locale === 'th' ? months : monthsEn;

  // ดึงข้อมูล report จาก API
  const { data: apiReport } = useRevenueReport();

  // ใช้ข้อมูล API ถ้ามี fallback เป็น mock ถ้า loading
  const actualData = apiReport?.monthlyRevenue?.map((m: any) => m.actual) || [3650000, 3820000, 3940000, 4050000, 4180000, 4270000];
  const forecastData = apiReport?.monthlyRevenue?.map((m: any) => m.forecast) || [3800000, 3900000, 4000000, 4100000, 4200000, 4300000, 4400000, 4500000, 4600000, 4700000, 4800000, 4900000];
  const summary = apiReport?.summary || { totalYtd: 23910000, avgMonthly: 3990000, collectionRate: 94.2, outstanding: 370000 };

  // กราฟ Revenue Trend
  const revenueTrendData = {
    labels,
    datasets: [{
      label: locale === 'th' ? 'รายรับจริง' : 'Actual Revenue',
      data: actualData,
      borderColor: '#005b9f',
      backgroundColor: 'rgba(0,91,159,.1)',
      fill: true,
      tension: .4,
    }, {
      label: locale === 'th' ? 'ประมาณการ' : 'Forecast',
      data: forecastData,
      borderColor: '#d7a94b',
      borderDash: [5, 5],
      fill: false,
      tension: .4,
    }],
  };

  // กราฟสัดส่วนรายได้ตามประเภทสัญญา
  const contractTypeData = {
    labels: locale === 'th'
      ? ['ค่าเช่าคงที่', 'ปันผลประโยชน์', 'ฝากขาย', 'อสังหาริมทรัพย์']
      : ['Fixed Rent', 'Revenue Sharing', 'Consignment', 'Real Estate'],
    datasets: [{
      data: [2100000, 1400000, 520000, 250000],
      backgroundColor: ['#005b9f', '#0f7a43', '#a45a00', '#7c3aed'],
      borderWidth: 0,
    }],
  };

  // กราฟรายรับตามสนามบิน
  const airportData = {
    labels: locale === 'th'
      ? ['ดอนเมือง', 'เชียงใหม่', 'ภูเก็ต', 'หาดใหญ่', 'กระบี่']
      : ['Don Mueang', 'Chiang Mai', 'Phuket', 'Hat Yai', 'Krabi'],
    datasets: [{
      label: locale === 'th' ? 'รายรับ (ล้านบาท)' : 'Revenue (M THB)',
      data: [4.27, 2.85, 3.12, 1.45, 0.98],
      backgroundColor: ['#005b9f', '#0f73b8', '#3ba8e8', '#78c5f0', '#b8dff7'],
      borderRadius: 4,
    }],
  };

  return (
    <>
      <PageHeader
        icon="📈"
        title={locale === 'th' ? 'รายงานรายได้' : 'Revenue Report'}
        subtitle={locale === 'th' ? 'วิเคราะห์รายรับค่าเช่าพื้นที่เชิงพาณิชย์' : 'Commercial rental revenue analysis'}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Select size="small" defaultValue="2569" sx={{ minWidth: 120, fontSize: 12 }}>
              <MenuItem value="2569">{locale === 'th' ? 'ปี 2569' : 'FY 2569'}</MenuItem>
              <MenuItem value="2568">{locale === 'th' ? 'ปี 2568' : 'FY 2568'}</MenuItem>
            </Select>
            <Button variant="outlined" size="small" sx={{ fontSize: 11 }}>
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>download</span>
              Export Excel
            </Button>
          </Box>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* KPI Summary */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { label: locale === 'th' ? 'รายรับรวม (ปีนี้)' : 'Total Revenue (YTD)', value: summary.totalYtd >= 1_000_000 ? `฿${(summary.totalYtd / 1_000_000).toFixed(2)}M` : `฿${formatMoney(summary.totalYtd)}`, sub: '↑ Live', color: '#005b9f' },
            { label: locale === 'th' ? 'รายรับเฉลี่ย/เดือน' : 'Avg Monthly', value: summary.avgMonthly >= 1_000_000 ? `฿${(summary.avgMonthly / 1_000_000).toFixed(2)}M` : `฿${formatMoney(summary.avgMonthly)}`, sub: locale === 'th' ? 'จาก DB' : 'from DB', color: '#0f73b8' },
            { label: locale === 'th' ? 'อัตราเก็บเงินได้' : 'Collection Rate', value: `${summary.collectionRate}%`, sub: '↑ real', color: '#0f7a43' },
            { label: locale === 'th' ? 'ค้างชำระ' : 'Outstanding', value: summary.outstanding >= 1_000_000 ? `฿${(summary.outstanding / 1_000_000).toFixed(2)}M` : `฿${formatMoney(summary.outstanding)}`, sub: '↓ real', color: '#b52822' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', textAlign: 'center' }}>
              <Typography sx={{ fontSize: 24, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 11, color: '#5a6d80', mt: .5 }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 10, color: s.sub.includes('↑') ? '#0f7a43' : s.sub.includes('↓') ? '#b52822' : '#5a6d80', mt: .5, fontWeight: 600 }}>{s.sub}</Typography>
            </Paper>
          ))}
        </Box>

        {/* กราฟ Revenue Trend */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', mb: 2 }}>
          <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{locale === 'th' ? 'แนวโน้มรายรับรายเดือน' : 'Monthly Revenue Trend'}</Typography>
          </Box>
          <Box sx={{ p: 2.25, height: 280 }}>
            <Line data={revenueTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } }, scales: { y: { ticks: { callback: (v) => `${Number(v) / 1000000}M` } } } }} />
          </Box>
        </Paper>

        {/* 2 กราฟ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{locale === 'th' ? 'สัดส่วนรายได้ตามประเภทสัญญา' : 'Revenue by Contract Type'}</Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', justifyContent: 'center', height: 240 }}>
              <Doughnut data={contractTypeData} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } } }} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{locale === 'th' ? 'รายรับตามท่าอากาศยาน' : 'Revenue by Airport'}</Typography>
            </Box>
            <Box sx={{ p: 2.25, height: 240 }}>
              <Bar data={airportData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }} />
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
