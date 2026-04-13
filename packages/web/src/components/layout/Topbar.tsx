import { Box, Typography, Button, Avatar, Divider, IconButton, Menu, MenuItem, Select, useMediaQuery, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth-store';
import { useTranslation } from '../../lib/i18n';
import { useMaster, Organization } from '../../api/master-hooks';

// แถบด้านบน — ชื่อระบบ, สลับโหมด, สลับภาษา, โปรไฟล์
interface TopbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Topbar({ onMenuClick, showMenuButton }: TopbarProps) {
  const { user, mode, setMode, activeOrgId, setActiveOrg, logout } = useAuthStore();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // โหลด organizations เพื่อแสดงใน dropdown
  const { data: orgs = [] } = useMaster<Organization>('organizations');
  const activeOrgs = orgs.filter((o) => o.isActive);

  // ตั้ง default org ครั้งแรก — เลือกที่ isDefault หรือตัวแรก
  useEffect(() => {
    if (!activeOrgId && activeOrgs.length > 0) {
      const defaultOrg = activeOrgs.find((o) => o.isDefault) || activeOrgs[0];
      setActiveOrg(defaultOrg.id);
    }
  }, [activeOrgs, activeOrgId, setActiveOrg]);

  const activeOrg = activeOrgs.find((o) => o.id === activeOrgId);

  return (
    <Box
      sx={{
        height: 56, flexShrink: 0,
        background: 'linear-gradient(90deg, #163f6b 0%, #0f73b8 52%, #0d6099 100%)',
        borderBottom: '2px solid #d7a94b',
        display: 'flex', alignItems: 'center', px: { xs: 1.5, md: 2.5 }, gap: { xs: 1, md: 1.5 },
        boxShadow: '0 4px 16px rgba(0,91,159,.20)', zIndex: 100,
      }}
    >
      {/* Hamburger menu — เฉพาะ mobile */}
      {showMenuButton && (
        <IconButton onClick={onMenuClick} sx={{ color: '#fff', p: 1 }}>
          <span className="material-icons-outlined" style={{ fontSize: 24 }}>menu</span>
        </IconButton>
      )}

      {/* โลโก้ */}
      <Box sx={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,.95)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,.15)', flexShrink: 0,
      }}>
        <span className="material-icons-round" style={{ fontSize: 20, color: '#163f6b' }}>flight</span>
      </Box>

      <Divider orientation="vertical" sx={{ height: 28, borderColor: 'rgba(255,255,255,.2)', display: { xs: 'none', sm: 'block' } }} />

      <Box sx={{ minWidth: 0, display: { xs: isSmall ? 'none' : 'block', sm: 'block' } }}>
        <Typography sx={{ fontSize: { xs: 12, md: 14 }, fontWeight: 700, color: '#fff', letterSpacing: .2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('app.title')}
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,.6)', mt: .1, display: { xs: 'none', md: 'block' } }}>
          {activeOrg ? (locale === 'th' ? activeOrg.nameTh : activeOrg.nameEn || activeOrg.nameTh) : t('app.subtitle')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Org switcher — เฉพาะเมื่อมี > 1 หน่วยงาน */}
      {activeOrgs.length > 1 && (
        <Select
          size="small"
          value={activeOrgId || ''}
          onChange={(e) => setActiveOrg(Number(e.target.value))}
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            fontSize: 11, minWidth: 140, height: 32,
            color: '#fff',
            bgcolor: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.25)',
            '& .MuiSvgIcon-root': { color: '#fff' },
            '& fieldset': { border: 'none' },
            '& .MuiSelect-select': { py: .5 },
          }}
          renderValue={(v) => {
            const o = activeOrgs.find((x) => x.id === v);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: .75 }}>
                <span className="material-icons-outlined" style={{ fontSize: 15 }}>business</span>
                {o ? (o.shortNameEn || o.shortNameTh || o.orgCode) : '—'}
              </Box>
            );
          }}
        >
          {activeOrgs.map((o) => (
            <MenuItem key={o.id} value={o.id} sx={{ fontSize: 11.5 }}>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{locale === 'th' ? o.nameTh : o.nameEn || o.nameTh}</Typography>
                <Typography sx={{ fontSize: 10, color: '#6c7f92' }}>{o.orgCode} · {o.taxId || '-'}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      )}

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

      {/* ปุ่มสลับโหมด — ซ่อนบน mobile */}
      <Button
        size="small"
        onClick={() => { setMode('admin'); navigate('/'); }}
        sx={{
          fontSize: 11, fontWeight: 600, borderRadius: 999,
          border: '1px solid rgba(255,255,255,.3)',
          color: mode === 'admin' ? '#163f6b' : 'rgba(255,255,255,.85)',
          background: mode === 'admin' ? '#d7a94b' : 'rgba(255,255,255,.1)',
          '&:hover': { background: '#d7a94b', color: '#163f6b' },
          display: { xs: 'none', md: 'inline-flex' },
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
          display: { xs: 'none', md: 'inline-flex' },
        }}
      >
        {t('topbar.tenant')}
      </Button>

      <Divider orientation="vertical" sx={{ height: 28, borderColor: 'rgba(255,255,255,.2)', display: { xs: 'none', md: 'block' } }} />

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
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {user?.username || 'Admin'}
        </Box>
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
