import { Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';

// โครงสร้างเมนู
interface NavItem {
  icon: string;        // Material Icons name
  labelKey: string;    // i18n key
  path: string;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

// เมนูทั้งหมด — ใช้ i18n key แทน text ตรงๆ
const navGroups: NavGroup[] = [
  {
    titleKey: 'nav.overview',
    items: [
      { icon: 'dashboard', labelKey: 'nav.dashboard', path: '/' },
    ],
  },
  {
    titleKey: 'nav.commercial',
    items: [
      { icon: 'map', labelKey: 'nav.floorplan', path: '/floor-plan' },
      { icon: 'space_dashboard', labelKey: 'nav.units', path: '/units', badge: '48', badgeColor: 'blue' },
    ],
  },
  {
    titleKey: 'nav.contracts',
    items: [
      { icon: 'description', labelKey: 'nav.contractList', path: '/contracts', badge: '34', badgeColor: 'blue' },
      { icon: 'add_circle', labelKey: 'nav.contractCreate', path: '/contracts/create' },
      { icon: 'autorenew', labelKey: 'nav.contractRenew', path: '/contracts/renew', badge: '7', badgeColor: 'amber' },
    ],
  },
  {
    titleKey: 'nav.tenants',
    items: [
      { icon: 'storefront', labelKey: 'nav.partnerMaster', path: '/partners', badge: '56', badgeColor: 'blue' },
    ],
  },
  {
    titleKey: 'nav.finance',
    items: [
      { icon: 'credit_card', labelKey: 'nav.billing', path: '/billing', badge: '12', badgeColor: 'red' },
      { icon: 'receipt_long', labelKey: 'nav.receipt', path: '/receipts' },
    ],
  },
  {
    titleKey: 'nav.reports',
    items: [
      { icon: 'trending_up', labelKey: 'nav.reportRevenue', path: '/reports/revenue' },
      { icon: 'analytics', labelKey: 'nav.reportArea', path: '/reports/area' },
    ],
  },
  {
    titleKey: 'nav.data',
    items: [
      { icon: 'cloud_download', labelKey: 'nav.importExport', path: '/import-export' },
      { icon: 'cleaning_services', labelKey: 'nav.dataCleansing', path: '/data-cleansing' },
    ],
  },
  {
    titleKey: 'nav.system',
    items: [
      { icon: 'storage', labelKey: 'nav.masterData', path: '/master-data' },
      { icon: 'people', labelKey: 'nav.users', path: '/users' },
      { icon: 'history', labelKey: 'nav.audit', path: '/audit' },
      { icon: 'article', labelKey: 'nav.template', path: '/templates' },
      { icon: 'settings', labelKey: 'nav.settings', path: '/settings' },
    ],
  },
];

const badgeStyles: Record<string, { bg: string; color: string; border: string }> = {
  blue: { bg: 'rgba(0,91,159,.1)', color: '#005b9f', border: 'rgba(0,91,159,.25)' },
  amber: { bg: 'rgba(217,119,6,.1)', color: '#a45a00', border: 'rgba(217,119,6,.25)' },
  red: { bg: 'rgba(217,83,79,.1)', color: '#b52822', border: 'rgba(217,83,79,.25)' },
  green: { bg: 'rgba(26,158,92,.1)', color: '#0f7a43', border: 'rgba(26,158,92,.25)' },
};

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box
      sx={{
        width: 230, flexShrink: 0, bgcolor: '#fff',
        borderRight: '1px solid rgba(22,63,107,.12)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', py: 1,
        boxShadow: '2px 0 8px rgba(10,22,40,.04)',
        '&::-webkit-scrollbar': { width: 0 },
      }}
    >
      {navGroups.map((group) => (
        <Box key={group.titleKey} sx={{ px: 1.25, mt: 1.75 }}>
          <Typography
            sx={{
              fontSize: 9, fontWeight: 700, color: '#5a6d80',
              textTransform: 'uppercase', letterSpacing: 1.2,
              px: 1, pb: .75, mb: .5,
              borderBottom: '1px solid rgba(22,63,107,.08)',
            }}
          >
            {t(group.titleKey)}
          </Typography>

          {group.items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Box
                key={item.path}
                onClick={() => handleClick(item.path)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  py: .875, px: 1.25, borderRadius: 1,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#005b9f' : '#5a6d80',
                  background: isActive ? 'rgba(0,91,159,.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,91,159,.25)' : '1px solid transparent',
                  mb: .125, transition: 'all .12s',
                  '&:hover': {
                    background: isActive ? 'rgba(0,91,159,.1)' : '#f4f8fc',
                    color: '#17324a',
                  },
                }}
              >
                <span
                  className="material-icons-outlined"
                  style={{ fontSize: 18, width: 20, textAlign: 'center', opacity: isActive ? 1 : .65 }}
                >
                  {item.icon}
                </span>
                <Box sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t(item.labelKey)}
                </Box>
                {item.badge && (
                  <Box
                    sx={{
                      ml: 'auto', fontSize: 9, fontWeight: 700,
                      fontFamily: "'IBM Plex Mono', monospace",
                      py: .25, px: .875, borderRadius: 999,
                      bgcolor: badgeStyles[item.badgeColor || 'blue'].bg,
                      color: badgeStyles[item.badgeColor || 'blue'].color,
                      border: `1px solid ${badgeStyles[item.badgeColor || 'blue'].border}`,
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
