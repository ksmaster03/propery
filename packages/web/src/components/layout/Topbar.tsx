import { Box, Typography, Chip, Button, Avatar, Divider, IconButton, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth-store';
import { useTranslation } from '../../lib/i18n';

// แถบด้านบน — ชื่อระบบ, สลับโหมด, สลับภาษา, โปรไฟล์
export default function Topbar() {
  const { user, mode, setMode, logout } = useAuthStore();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Box
      sx={{
        height: 56, flexShrink: 0,
        background: 'linear-gradient(90deg, #163f6b 0%, #0f73b8 52%, #0d6099 100%)',
        borderBottom: '2px solid #d7a94b',
        display: 'flex', alignItems: 'center', px: 2.5, gap: 1.5,
        boxShadow: '0 4px 16px rgba(0,91,159,.20)', zIndex: 100,
      }}
    >
      {/* โลโก้ */}
      <Box sx={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,.95)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      }}>
        <span className="material-icons-round" style={{ fontSize: 20, color: '#163f6b' }}>flight</span>
      </Box>

      <Divider orientation="vertical" sx={{ height: 28, borderColor: 'rgba(255,255,255,.2)' }} />

      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: .2 }}>
          {t('app.title')}
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,.6)', mt: .1 }}>
          {t('app.subtitle')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* ปุ่มสลับภาษา */}
      <Box sx={{ display: 'flex', gap: .5, background: 'rgba(255,255,255,.1)', borderRadius: 999, p: .3 }}>
        <Button
          size="small"
          onClick={() => setLocale('th')}
          sx={{
            minWidth: 32, px: 1, py: .3, borderRadius: 999, fontSize: 11, fontWeight: 700,
            color: locale === 'th' ? '#163f6b' : 'rgba(255,255,255,.7)',
            background: locale === 'th' ? '#fff' : 'transparent',
            '&:hover': { background: locale === 'th' ? '#fff' : 'rgba(255,255,255,.15)' },
          }}
        >
          TH
        </Button>
        <Button
          size="small"
          onClick={() => setLocale('en')}
          sx={{
            minWidth: 32, px: 1, py: .3, borderRadius: 999, fontSize: 11, fontWeight: 700,
            color: locale === 'en' ? '#163f6b' : 'rgba(255,255,255,.7)',
            background: locale === 'en' ? '#fff' : 'transparent',
            '&:hover': { background: locale === 'en' ? '#fff' : 'rgba(255,255,255,.15)' },
          }}
        >
          EN
        </Button>
      </Box>

      {/* ปุ่มสลับโหมด */}
      <Button
        size="small"
        onClick={() => { setMode('admin'); navigate('/'); }}
        sx={{
          fontSize: 11, fontWeight: 600, borderRadius: 999,
          border: '1px solid rgba(255,255,255,.3)',
          color: mode === 'admin' ? '#163f6b' : 'rgba(255,255,255,.85)',
          background: mode === 'admin' ? '#d7a94b' : 'rgba(255,255,255,.1)',
          '&:hover': { background: '#d7a94b', color: '#163f6b' },
        }}
      >
        {t('topbar.officer')}
      </Button>
      <Button
        size="small"
        onClick={() => { setMode('tenant'); navigate('/portal'); }}
        sx={{
          fontSize: 11, fontWeight: 600, borderRadius: 999,
          border: '1px solid rgba(255,255,255,.3)',
          color: mode === 'tenant' ? '#163f6b' : 'rgba(255,255,255,.85)',
          background: mode === 'tenant' ? '#d7a94b' : 'rgba(255,255,255,.1)',
          '&:hover': { background: '#d7a94b', color: '#163f6b' },
        }}
      >
        {t('topbar.tenant')}
      </Button>

      <Divider orientation="vertical" sx={{ height: 28, borderColor: 'rgba(255,255,255,.2)' }} />

      {/* โปรไฟล์ + เมนู */}
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          background: 'rgba(255,255,255,.1)',
          border: '1px solid rgba(255,255,255,.2)',
          borderRadius: 999, px: 1.5, py: .5,
          cursor: 'pointer', fontSize: 12,
          color: 'rgba(255,255,255,.85)',
          '&:hover': { background: 'rgba(255,255,255,.18)' },
        }}
      >
        <Avatar sx={{
          width: 26, height: 26, fontSize: 10, fontWeight: 700,
          background: 'linear-gradient(135deg, #d7a94b, #f5d080)', color: '#163f6b',
        }}>
          {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
        </Avatar>
        {user?.username || 'Admin'}
        <span className="material-icons-round" style={{ fontSize: 16, opacity: .7 }}>expand_more</span>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
          <span className="material-icons-outlined" style={{ fontSize: 18, marginRight: 8 }}>person</span>
          {locale === 'th' ? 'แก้ไขโปรไฟล์' : 'Edit Profile'}
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
          <span className="material-icons-outlined" style={{ fontSize: 18, marginRight: 8 }}>logout</span>
          {locale === 'th' ? 'ออกจากระบบ' : 'Logout'}
        </MenuItem>
      </Menu>
    </Box>
  );
}
