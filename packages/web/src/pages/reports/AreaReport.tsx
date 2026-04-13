import { Box, Paper, Typography, Select, MenuItem, Button } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

const formatMoney = (n: number) => new Intl.NumberFormat('th-TH').format(n);

export default function AreaReport() {
  const { locale } = useTranslation();

  // Occupancy rate by airport
  const occupancyData = {
    labels: locale === 'th'
      ? ['ดอนเมือง', 'เชียงใหม่', 'ภูเก็ต', 'หาดใหญ่', 'กระบี่', 'อุบลราชธานี']
      : ['Don Mueang', 'Chiang Mai', 'Phuket', 'Hat Yai', 'Krabi', 'Ubon'],
    datasets: [{
      label: '% Occupancy',
      data: [70.8, 82.3, 75.5, 68.2, 55.7, 48.9],
      backgroundColor: ['#005b9f', '#0f73b8', '#0f7a43', '#a45a00', '#7c3aed', '#b52822'],
      borderRadius: 4,
    }],
  };

  // Area distribution by zone type
  const zoneData = {
    labels: locale === 'th'
      ? ['ร้านอาหาร', 'ร้านค้า', 'บริการ', 'Lounge', 'อื่นๆ']
      : ['F&B', 'Retail', 'Service', 'Lounge', 'Other'],
    datasets: [{
      data: [3450, 4120, 2800, 1500, 970],
      backgroundColor: ['#005b9f', '#0f7a43', '#a45a00', '#7c3aed', '#5a6d80'],
      borderWidth: 0,
    }],
  };

  // Revenue per sqm by zone
  const revenuePerSqmData = {
    labels: locale === 'th'
      ? ['โซน A (ร้านอาหาร)', 'โซน B (ร้านค้า)', 'โซน C (บริการ)']
      : ['Zone A (F&B)', 'Zone B (Retail)', 'Zone C (Service)'],
    datasets: [{
      label: locale === 'th' ? 'รายได้/ตร.ม./เดือน' : 'Revenue/sqm/month',
      data: [1850, 2250, 980],
      backgroundColor: '#005b9f',
      borderRadius: 4,
    }],
  };

  return (
    <>
      <PageHeader
        icon="📉"
        title={locale === 'th' ? 'วิเคราะห์พื้นที่' : 'Area Analysis'}
        subtitle={locale === 'th' ? 'วิเคราะห์อัตราการใช้พื้นที่และรายได้ต่อตารางเมตร' : 'Occupancy and revenue-per-sqm analysis'}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Select size="small" defaultValue="ALL" sx={{ minWidth: 160, fontSize: 12 }}>
              <MenuItem value="ALL">{locale === 'th' ? 'ทุกท่าอากาศยาน' : 'All Airports'}</MenuItem>
              <MenuItem value="DMK">{locale === 'th' ? 'ดอนเมือง' : 'Don Mueang'}</MenuItem>
            </Select>
            <Button variant="outlined" size="small" sx={{ fontSize: 11 }}>
              <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>download</span>
              Export
            </Button>
          </Box>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* KPI */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
          {[
            { label: locale === 'th' ? 'พื้นที่รวม' : 'Total Area', value: '12,840 ตร.ม.', color: '#005b9f' },
            { label: locale === 'th' ? 'อัตราเช่าเฉลี่ย' : 'Avg Occupancy', value: '66.9%', color: '#0f7a43' },
            { label: locale === 'th' ? 'พื้นที่ว่าง' : 'Vacant', value: '4,250 ตร.ม.', color: '#b52822' },
            { label: locale === 'th' ? 'รายได้/ตร.ม.' : 'Revenue/sqm', value: '฿1,862', color: '#d7a94b' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
              <Typography sx={{ fontSize: 11, color: '#5a6d80' }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color, mt: .5 }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* กราฟ Occupancy */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', mb: 2 }}>
          <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{locale === 'th' ? 'อัตราการเช่าตามท่าอากาศยาน (%)' : 'Occupancy Rate by Airport (%)'}</Typography>
          </Box>
          <Box sx={{ p: 2.25, height: 260 }}>
            <Bar data={occupancyData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100, ticks: { callback: (v) => `${v}%` } } } }} />
          </Box>
        </Paper>

        {/* 2 กราฟ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{locale === 'th' ? 'การกระจายพื้นที่ตามประเภท (ตร.ม.)' : 'Area Distribution by Type (sqm)'}</Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', justifyContent: 'center', height: 240 }}>
              <Doughnut data={zoneData} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } } }} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{locale === 'th' ? 'รายได้ต่อตารางเมตรตามโซน' : 'Revenue per sqm by Zone'}</Typography>
            </Box>
            <Box sx={{ p: 2.25, height: 240 }}>
              <Bar data={revenuePerSqmData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v) => `฿${formatMoney(Number(v))}` } } } }} />
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
