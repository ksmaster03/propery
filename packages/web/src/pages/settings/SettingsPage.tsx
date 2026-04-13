import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Divider, Alert, CircularProgress } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';

// === หน้าตั้งค่าระบบ — sync กับ TmConfig ผ่าน API ===
export default function SettingsPage() {
  const { locale } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // === Load settings from API ===
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data } = await api.get('/settings');
      return data.data || {};
    },
  });

  // Sync API data → form state เมื่อโหลดเสร็จ
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  // === Save mutation ===
  const saveMut = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.put('/settings', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'ไม่สามารถบันทึกได้');
    },
  });

  const handleSave = () => {
    saveMut.mutate(form);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <>
      <PageHeader
        icon="⚙️"
        title={locale === 'th' ? 'ตั้งค่าระบบ' : 'System Settings'}
        subtitle={locale === 'th' ? 'ปรับแต่งพารามิเตอร์และนโยบาย — บันทึกใน DB' : 'Configure system parameters — persisted to DB'}
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#5a6d80' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {saved && <Alert severity="success" sx={{ mb: 2, fontSize: 12 }}>{locale === 'th' ? '✓ บันทึกการตั้งค่าเรียบร้อย' : '✓ Settings saved successfully'}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, maxWidth: 1200 }}>
              {/* การเงิน */}
              <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
                <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>payments</span>
                    {locale === 'th' ? 'การเงินและการแบ่งรายได้' : 'Finance & Revenue Split'}
                  </Typography>
                </Box>
                <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField size="small" label={locale === 'th' ? '% กรมธนารักษ์' : '% Treasury'} value={form.TREASURY_PCT || ''} onChange={(e) => update('TREASURY_PCT', e.target.value)} />
                  <TextField size="small" label={locale === 'th' ? '% กองทุนสวัสดิการ' : '% Welfare Fund'} value={form.WELFARE_FUND_PCT || ''} onChange={(e) => update('WELFARE_FUND_PCT', e.target.value)} />
                  <TextField size="small" label={locale === 'th' ? '% เงินทุนหมุนเวียน' : '% Revolving Fund'} value={form.REVOLVING_FUND_PCT || ''} onChange={(e) => update('REVOLVING_FUND_PCT', e.target.value)} />
                  <Divider />
                  <TextField size="small" label={locale === 'th' ? 'อัตราภาษีมูลค่าเพิ่ม (%)' : 'VAT Rate (%)'} value={form.VAT_RATE || ''} onChange={(e) => update('VAT_RATE', e.target.value)} />
                  <TextField size="small" label={locale === 'th' ? 'ค่าปรับชำระล่าช้า (%/ปี)' : 'Late Penalty (%/year)'} value={form.LATE_PENALTY_RATE || ''} onChange={(e) => update('LATE_PENALTY_RATE', e.target.value)} />
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
                  <TextField size="small" label={locale === 'th' ? 'แจ้งเตือนสัญญาใกล้หมดอายุ (วัน)' : 'Contract Alert (days)'} value={form.CONTRACT_ALERT_DAYS || ''} onChange={(e) => update('CONTRACT_ALERT_DAYS', e.target.value)} />
                  <TextField size="small" label={locale === 'th' ? 'จำนวนเดือนของเงินประกัน' : 'Deposit Months'} value={form.DEPOSIT_MONTHS || '3'} onChange={(e) => update('DEPOSIT_MONTHS', e.target.value)} />
                  <TextField size="small" label={locale === 'th' ? 'วันชำระเริ่มต้นของเดือน' : 'Default Payment Due Day'} value={form.DEFAULT_PAYMENT_DUE_DAY || '5'} onChange={(e) => update('DEFAULT_PAYMENT_DUE_DAY', e.target.value)} />
                </Box>
              </Paper>

              {/* องค์กร */}
              <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)', gridColumn: { xs: '1', md: '1/3' } }}>
                <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>business</span>
                    {locale === 'th' ? 'ข้อมูลองค์กรเริ่มต้น' : 'Default Organization'}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#5a6d80', mt: .3 }}>
                    {locale === 'th' ? '💡 การจัดการหน่วยงานหลายๆ หน่วย ดูที่เมนู Master Data' : '💡 Manage multiple organizations in Master Data menu'}
                  </Typography>
                </Box>
                <Box sx={{ p: 2.25, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField size="small" label={locale === 'th' ? 'ชื่อหน่วยงานหลัก' : 'Primary Org'} value={form.ORG_NAME || ''} onChange={(e) => update('ORG_NAME', e.target.value)} />
                  <TextField size="small" label={locale === 'th' ? 'ชื่อย่อ' : 'Abbreviation'} value={form.ORG_ABBR || ''} onChange={(e) => update('ORG_ABBR', e.target.value)} />
                </Box>
              </Paper>
            </Box>

            <Box sx={{ mt: 3, maxWidth: 1200, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={() => setForm(settings || {})}>
                {locale === 'th' ? 'รีเซ็ต' : 'Reset'}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saveMut.isPending}
              >
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>save</span>
                {saveMut.isPending ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (locale === 'th' ? 'บันทึกการตั้งค่า' : 'Save Settings')}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </>
  );
}
