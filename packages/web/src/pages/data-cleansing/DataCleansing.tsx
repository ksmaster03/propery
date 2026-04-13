import { Box, Paper, Typography, Button, Chip, LinearProgress } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

const issues = [
  { severity: 'error', icon: 'error', titleTh: 'เลขภาษีซ้ำ', titleEn: 'Duplicate Tax IDs', count: 3, descTh: 'พบ 3 ผู้เช่าที่มีเลขภาษีซ้ำกัน ต้องรวม record', descEn: 'Found 3 tenants with duplicate tax IDs — merge required' },
  { severity: 'error', icon: 'error', titleTh: 'สัญญาไม่มีพื้นที่', titleEn: 'Contracts without Unit', count: 1, descTh: 'มีสัญญา 1 รายการที่ไม่ได้เชื่อมกับ unit', descEn: '1 contract not linked to any unit' },
  { severity: 'warning', icon: 'warning', titleTh: 'ข้อมูลติดต่อไม่ครบ', titleEn: 'Incomplete Contact Info', count: 8, descTh: 'มีผู้เช่า 8 ราย ไม่มีเบอร์โทรศัพท์', descEn: '8 tenants without phone number' },
  { severity: 'warning', icon: 'warning', titleTh: 'ยูนิตไม่มีพิกัด Floor Plan', titleEn: 'Units without Floor Plan Coords', count: 5, descTh: 'มี 5 ยูนิตที่ยังไม่ได้กำหนดพิกัดบน Floor Plan', descEn: '5 units without floor plan coordinates' },
  { severity: 'info', icon: 'info', titleTh: 'สัญญาหมดอายุ', titleEn: 'Expired Contracts', count: 2, descTh: '2 สัญญาหมดอายุแล้วแต่สถานะยังเป็น ACTIVE', descEn: '2 contracts expired but status still ACTIVE' },
];

const severityStyles = {
  error: { color: '#b52822', bg: 'rgba(217,83,79,.08)', border: 'rgba(217,83,79,.25)' },
  warning: { color: '#a45a00', bg: 'rgba(217,119,6,.08)', border: 'rgba(217,119,6,.25)' },
  info: { color: '#0f73b8', bg: 'rgba(15,115,184,.08)', border: 'rgba(15,115,184,.25)' },
};

export default function DataCleansing() {
  const { locale } = useTranslation();
  const totalIssues = issues.reduce((s, i) => s + i.count, 0);
  const quality = Math.round(100 - (totalIssues / 150) * 100);

  return (
    <>
      <PageHeader
        icon="🧹"
        title={locale === 'th' ? 'ตรวจสอบคุณภาพข้อมูล' : 'Data Quality Check'}
        subtitle={locale === 'th' ? 'ตรวจหาปัญหาข้อมูลและเสนอวิธีแก้ไข' : 'Detect data issues and suggest fixes'}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>refresh</span>
            {locale === 'th' ? 'สแกนใหม่' : 'Rescan'}
          </Button>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* คะแนนคุณภาพ */}
        <Paper elevation={0} sx={{ p: 3, mb: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{
              width: 100, height: 100, borderRadius: '50%',
              border: `6px solid ${quality >= 90 ? '#0f7a43' : quality >= 70 ? '#a45a00' : '#b52822'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', flexShrink: 0,
            }}>
              <Typography sx={{ fontSize: 28, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: quality >= 90 ? '#0f7a43' : quality >= 70 ? '#a45a00' : '#b52822' }}>
                {quality}%
              </Typography>
              <Typography sx={{ fontSize: 9, color: '#5a6d80' }}>{locale === 'th' ? 'คุณภาพ' : 'Quality'}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                {locale === 'th' ? 'คะแนนคุณภาพข้อมูล' : 'Data Quality Score'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#5a6d80', mt: .5 }}>
                {locale === 'th'
                  ? `พบปัญหา ${totalIssues} รายการจากข้อมูลทั้งหมด — ต้องแก้ไขเพื่อเพิ่มคุณภาพ`
                  : `Found ${totalIssues} issues — fix to improve quality`}
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
                <Chip label={`${issues.filter(i => i.severity === 'error').reduce((s, i) => s + i.count, 0)} ${locale === 'th' ? 'ร้ายแรง' : 'Errors'}`} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: 'rgba(217,83,79,.1)', color: '#b52822', border: '1px solid rgba(217,83,79,.25)' }} />
                <Chip label={`${issues.filter(i => i.severity === 'warning').reduce((s, i) => s + i.count, 0)} ${locale === 'th' ? 'เตือน' : 'Warnings'}`} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: 'rgba(217,119,6,.1)', color: '#a45a00', border: '1px solid rgba(217,119,6,.25)' }} />
                <Chip label={`${issues.filter(i => i.severity === 'info').reduce((s, i) => s + i.count, 0)} ${locale === 'th' ? 'ข้อมูล' : 'Info'}`} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: 'rgba(15,115,184,.1)', color: '#0f73b8', border: '1px solid rgba(15,115,184,.25)' }} />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* รายการปัญหา */}
        <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>
            🔍 {locale === 'th' ? 'รายการปัญหาที่ตรวจพบ' : 'Detected Issues'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {issues.map((issue, i) => {
              const s = severityStyles[issue.severity as keyof typeof severityStyles];
              return (
                <Box
                  key={i}
                  sx={{
                    p: 2, borderRadius: 1.5, border: `1px solid ${s.border}`, bgcolor: s.bg,
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}
                >
                  <span className="material-icons-outlined" style={{ fontSize: 28, color: s.color }}>{issue.icon}</span>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                      {locale === 'th' ? issue.titleTh : issue.titleEn}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#5a6d80', mt: .25 }}>
                      {locale === 'th' ? issue.descTh : issue.descEn}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: s.color, mx: 2 }}>
                    {issue.count}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ fontSize: 11, color: s.color, borderColor: s.border }}>
                    {locale === 'th' ? 'ตรวจสอบ' : 'Review'}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
