import { useState } from 'react';
// ใช้ direct imports เพื่อ tree-shake MUI — ลด initial bundle ของ Login page
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth-store';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';

// หน้า Login — ทั้ง Admin และ Tenant Portal ใช้หน้านี้ร่วมกัน
export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setMode } = useAuthStore();
  const { locale, setLocale } = useTranslation();

  const [loginType, setLoginType] = useState<'admin' | 'tenant'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError(locale === 'th' ? 'กรุณากรอกข้อมูลให้ครบ' : 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        const { data } = await api.post('/auth/login', { username, password });
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
        setMode('admin');
        navigate('/');
      } else {
        const { data } = await api.post('/auth/portal-login', { taxId: username, password });
        setAuth(
          { userId: data.data.partner.partnerCode, username: data.data.partner.shopNameTh || data.data.partner.nameTh, role: 'TENANT' },
          data.data.accessToken,
          data.data.refreshToken
        );
        setMode('tenant');
        navigate('/portal');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (locale === 'th' ? 'เข้าสู่ระบบไม่สำเร็จ' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #163f6b 0%, #005b9f 60%, #0f73b8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2, position: 'relative',
      }}
    >
      {/* Language switcher */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: .5, bgcolor: 'rgba(255,255,255,.1)', borderRadius: 999, p: .3 }}>
        <Button size="small" onClick={() => setLocale('th')} sx={{ minWidth: 32, px: 1, py: .3, borderRadius: 999, fontSize: 11, fontWeight: 700, color: locale === 'th' ? '#163f6b' : '#fff', bgcolor: locale === 'th' ? '#fff' : 'transparent' }}>TH</Button>
        <Button size="small" onClick={() => setLocale('en')} sx={{ minWidth: 32, px: 1, py: .3, borderRadius: 999, fontSize: 11, fontWeight: 700, color: locale === 'en' ? '#163f6b' : '#fff', bgcolor: locale === 'en' ? '#fff' : 'transparent' }}>EN</Button>
      </Box>

      <Paper elevation={0} sx={{ width: '100%', maxWidth: 440, borderRadius: 3, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <Box sx={{
          p: 3, textAlign: 'center',
          background: 'linear-gradient(90deg, #163f6b 0%, #0f73b8 100%)',
          borderBottom: '3px solid #d7a94b',
        }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1,
            bgcolor: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
          }}>
            <span className="material-icons-round" style={{ fontSize: 32, color: '#163f6b' }}>flight</span>
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            {locale === 'th' ? 'ระบบบริหารสัญญาเช่าพื้นที่' : 'Commercial Lease System'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.75)', mt: .3 }}>
            {locale === 'th' ? 'กรมท่าอากาศยาน · Department of Airports' : 'Department of Airports (DOA)'}
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ p: 3 }}>
          {/* Tab เลือกประเภทผู้ใช้ */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, p: .5, bgcolor: '#f4f8fc', borderRadius: 2 }}>
            <Button
              fullWidth
              onClick={() => setLoginType('admin')}
              sx={{
                fontSize: 12, fontWeight: 700, py: 1, borderRadius: 1.5,
                bgcolor: loginType === 'admin' ? '#fff' : 'transparent',
                color: loginType === 'admin' ? '#005b9f' : '#5a6d80',
                boxShadow: loginType === 'admin' ? '0 2px 8px rgba(10,22,40,.08)' : 'none',
                '&:hover': { bgcolor: loginType === 'admin' ? '#fff' : '#edf2f7' },
              }}
            >
              🏢 {locale === 'th' ? 'เจ้าหน้าที่' : 'Officer'}
            </Button>
            <Button
              fullWidth
              onClick={() => setLoginType('tenant')}
              sx={{
                fontSize: 12, fontWeight: 700, py: 1, borderRadius: 1.5,
                bgcolor: loginType === 'tenant' ? '#fff' : 'transparent',
                color: loginType === 'tenant' ? '#005b9f' : '#5a6d80',
                boxShadow: loginType === 'tenant' ? '0 2px 8px rgba(10,22,40,.08)' : 'none',
                '&:hover': { bgcolor: loginType === 'tenant' ? '#fff' : '#edf2f7' },
              }}
            >
              👤 {locale === 'th' ? 'ผู้เช่า' : 'Tenant'}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}

          <TextField
            fullWidth size="small" autoFocus
            label={loginType === 'admin' ? (locale === 'th' ? 'ชื่อผู้ใช้' : 'Username') : (locale === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth size="small" type="password"
            label={locale === 'th' ? 'รหัสผ่าน' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth variant="contained" size="large"
            onClick={handleLogin}
            disabled={loading}
            sx={{ py: 1.25, fontSize: 13, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign In')}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>
              {locale === 'th' ? 'บัญชีทดสอบ' : 'Demo Accounts'}
            </Typography>
          </Divider>

          <Box sx={{ fontSize: 11, color: '#5a6d80', textAlign: 'center' }}>
            {loginType === 'admin' ? (
              <>
                <Box>Admin: <code>admin</code> / <code>admin123</code></Box>
                <Box>Operator: <code>operator1</code> / <code>operator123</code></Box>
              </>
            ) : (
              <Box>Tax ID: <code>0105562001234</code> / <code>tenant123</code></Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
