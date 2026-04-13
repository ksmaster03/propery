import { Box, Paper, Typography, TextField, Button, Switch, FormControlLabel, Divider, Select, MenuItem } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

export default function SettingsPage() {
  const { locale } = useTranslation();

  return (
    <>
      <PageHeader
        icon="⚙️"
        title={locale === 'th' ? 'ตั้งค่าระบบ' : 'System Settings'}
        subtitle={locale === 'th' ? 'ปรับแต่งพารามิเตอร์และนโยบายของระบบ' : 'Configure system parameters and policies'}
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.75 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 1200 }}>
          {/* การเงิน */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>payments</span>
                {locale === 'th' ? 'การเงินและการแบ่งรายได้' : 'Finance & Revenue Split'}
              </Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField size="small" label={locale === 'th' ? '% กรมธนารักษ์' : '% Treasury'} defaultValue="50" />
              <TextField size="small" label={locale === 'th' ? '% กองทุนสวัสดิการ ทย.' : '% Welfare Fund'} defaultValue="20" />
              <TextField size="small" label={locale === 'th' ? '% เงินทุนหมุนเวียน ทย.' : '% Revolving Fund'} defaultValue="30" />
              <Divider />
              <TextField size="small" label={locale === 'th' ? 'อัตราภาษีมูลค่าเพิ่ม (%)' : 'VAT Rate (%)'} defaultValue="7" />
              <TextField size="small" label={locale === 'th' ? 'ค่าปรับชำระล่าช้า (%/ปี)' : 'Late Penalty (%/year)'} defaultValue="15" />
            </Box>
          </Paper>

          {/* สัญญา */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>article</span>
                {locale === 'th' ? 'นโยบายสัญญาเช่า' : 'Contract Policies'}
              </Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField size="small" label={locale === 'th' ? 'แจ้งเตือนสัญญาใกล้หมดอายุ (วัน)' : 'Contract Alert (days)'} defaultValue="90" />
              <TextField size="small" label={locale === 'th' ? 'จำนวนเดือนของเงินประกัน' : 'Deposit Months'} defaultValue="3" />
              <Select size="small" defaultValue="5">
                <MenuItem value={1}>{locale === 'th' ? 'ชำระวันที่ 1 ของเดือน' : 'Due 1st of month'}</MenuItem>
                <MenuItem value={5}>{locale === 'th' ? 'ชำระวันที่ 5 ของเดือน' : 'Due 5th of month'}</MenuItem>
                <MenuItem value={10}>{locale === 'th' ? 'ชำระวันที่ 10 ของเดือน' : 'Due 10th of month'}</MenuItem>
                <MenuItem value={15}>{locale === 'th' ? 'ชำระวันที่ 15 ของเดือน' : 'Due 15th of month'}</MenuItem>
              </Select>
              <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'ให้ผู้เช่าแก้ไข Profile ตนเองได้ (Tenant Portal)' : 'Allow tenant to edit profile (Portal)'}</Typography>} />
              <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'ส่งอีเมลแจ้งเตือนใบแจ้งหนี้' : 'Send email bill notifications'}</Typography>} />
            </Box>
          </Paper>

          {/* ระบบ */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>settings</span>
                {locale === 'th' ? 'ระบบและความปลอดภัย' : 'System & Security'}
              </Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField size="small" label={locale === 'th' ? 'อายุ Access Token (นาที)' : 'Access Token TTL (min)'} defaultValue="15" />
              <TextField size="small" label={locale === 'th' ? 'อายุ Refresh Token (วัน)' : 'Refresh Token TTL (days)'} defaultValue="7" />
              <TextField size="small" label={locale === 'th' ? 'ความยาวรหัสผ่านขั้นต่ำ' : 'Min Password Length'} defaultValue="8" />
              <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'บังคับใช้ 2FA สำหรับ Admin' : 'Require 2FA for Admin'}</Typography>} />
              <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'เก็บ Audit Log ทั้งหมด' : 'Enable full audit logging'}</Typography>} />
            </Box>
          </Paper>

          {/* องค์กร */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>business</span>
                {locale === 'th' ? 'ข้อมูลองค์กร' : 'Organization'}
              </Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField size="small" label={locale === 'th' ? 'ชื่อหน่วยงาน' : 'Organization Name'} defaultValue={locale === 'th' ? 'กรมท่าอากาศยาน' : 'Department of Airports'} />
              <TextField size="small" label={locale === 'th' ? 'ชื่อย่อ' : 'Abbreviation'} defaultValue="DOA" />
              <TextField size="small" label={locale === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'} defaultValue="0994000165510" />
              <TextField size="small" multiline rows={2} label={locale === 'th' ? 'ที่อยู่' : 'Address'} defaultValue={locale === 'th' ? '71 ซ.งามดูพลี ถ.พระราม 4 แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120' : '71 Soi Ngam Dupli, Rama 4 Rd, Thungmahamek, Sathon, Bangkok 10120'} />
            </Box>
          </Paper>
        </Box>

        <Box sx={{ mt: 3, maxWidth: 1200, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" size="small">
            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button variant="contained" size="small">
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>save</span>
            {locale === 'th' ? 'บันทึกการตั้งค่า' : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
