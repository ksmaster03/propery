import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Avatar, Divider, Alert } from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useAuthStore } from '../../lib/auth-store';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';

// หน้าแก้ไขโปรไฟล์ — ผู้ใช้สามารถแก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน
export default function ProfilePage() {
  const { user } = useAuthStore();
  const { locale } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [error, setError] = useState('');
  const [pwdError, setPwdError] = useState('');

  // โหลดโปรไฟล์ปัจจุบันจาก API
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile');
      return data.data;
    },
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    departmentCode: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Sync API data → form
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        departmentCode: profile.departmentCode || '',
      });
    }
  }, [profile]);

  // Save profile mutation
  const saveMut = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { data } = await api.put('/profile', payload);
      return data;
    },
    onSuccess: () => {
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to save'),
  });

  // Change password mutation
  const pwdMut = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.put('/profile/password', payload);
      return data;
    },
    onSuccess: () => {
      setPwdSaved(true);
      setPwdError('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSaved(false), 3000);
    },
    onError: (err: any) => setPwdError(err.response?.data?.error || 'Failed'),
  });

  const handleSave = () => {
    saveMut.mutate(form);
  };

  const handleChangePassword = () => {
    setPwdError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdError(locale === 'th' ? 'รหัสผ่านใหม่ไม่ตรงกัน' : 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPwdError(locale === 'th' ? 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 chars');
      return;
    }
    pwdMut.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <>
      <PageHeader
        icon="👤"
        title={locale === 'th' ? 'แก้ไขโปรไฟล์' : 'Edit Profile'}
        subtitle={locale === 'th' ? 'จัดการข้อมูลส่วนตัวและรหัสผ่าน' : 'Manage personal info and password'}
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {saved && (
          <Alert severity="success" sx={{ mb: 2, fontSize: 12 }}>
            {locale === 'th' ? 'บันทึกข้อมูลเรียบร้อย' : 'Profile saved successfully'}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 900 }}>
          {/* ข้อมูลส่วนตัว */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>person</span>
                {locale === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Information'}
              </Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{
                  width: 64, height: 64, fontSize: 24, fontWeight: 700,
                  background: 'linear-gradient(135deg, #d7a94b, #f5d080)',
                  color: '#163f6b',
                }}>
                  {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{user?.username}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#5a6d80' }}>
                    {user?.role || 'ADMIN'} · {user?.userId || 'USR-001'}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ mt: .5, fontSize: 10 }}>
                    {locale === 'th' ? 'เปลี่ยนรูปภาพ' : 'Change Photo'}
                  </Button>
                </Box>
              </Box>

              <TextField
                label={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
                size="small" fullWidth
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <TextField
                label="Email"
                size="small" fullWidth type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                label={locale === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
                size="small" fullWidth
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <TextField
                label={locale === 'th' ? 'แผนก/หน่วยงาน' : 'Department'}
                size="small" fullWidth
                value={form.departmentCode}
                onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
              />

              {error && <Alert severity="error" sx={{ fontSize: 11 }}>{error}</Alert>}
              {saved && <Alert severity="success" sx={{ fontSize: 11 }}>{locale === 'th' ? '✓ บันทึกเรียบร้อย' : '✓ Saved'}</Alert>}

              <Button variant="contained" onClick={handleSave} disabled={saveMut.isPending} sx={{ mt: 1, fontSize: 12 }}>
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>save</span>
                {saveMut.isPending
                  ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...')
                  : (locale === 'th' ? 'บันทึกข้อมูล' : 'Save Changes')}
              </Button>
            </Box>
          </Paper>

          {/* เปลี่ยนรหัสผ่าน */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
            <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>lock</span>
                {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
              </Typography>
            </Box>
            <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={locale === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}
                size="small" fullWidth type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
              <TextField
                label={locale === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                size="small" fullWidth type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <TextField
                label={locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}
                size="small" fullWidth type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />

              <Alert severity="info" sx={{ fontSize: 11 }}>
                {locale === 'th'
                  ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                  : 'Password must be at least 6 characters'}
              </Alert>
              {pwdError && <Alert severity="error" sx={{ fontSize: 11 }}>{pwdError}</Alert>}
              {pwdSaved && <Alert severity="success" sx={{ fontSize: 11 }}>{locale === 'th' ? '✓ เปลี่ยนรหัสผ่านสำเร็จ' : '✓ Password changed'}</Alert>}

              <Button
                variant="contained" color="warning"
                onClick={handleChangePassword}
                disabled={pwdMut.isPending}
                sx={{ mt: 1, fontSize: 12 }}
              >
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>vpn_key</span>
                {pwdMut.isPending
                  ? (locale === 'th' ? 'กำลังเปลี่ยน...' : 'Changing...')
                  : (locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password')}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
