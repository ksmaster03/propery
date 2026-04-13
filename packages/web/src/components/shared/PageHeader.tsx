import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

// ส่วนหัวของแต่ละหน้า — ไอคอน + ชื่อหน้า + ปุ่มแอคชัน
// Mobile: stack vertical, action อยู่แถวล่าง
interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        px: { xs: 1.5, md: 2.75 },
        py: { xs: 1.25, md: 1.5 },
        bgcolor: '#fff',
        borderBottom: '1px solid rgba(22,63,107,.12)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 1.5,
        boxShadow: '0 1px 4px rgba(10,22,40,.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 1,
            background: 'rgba(0,91,159,.1)',
            border: '1px solid rgba(0,91,159,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0, color: '#005b9f',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: 14, md: 15 }, fontWeight: 700, color: '#17324a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: { xs: 10.5, md: 11 }, color: '#6c7f92', mt: .1, display: { xs: '-webkit-box', sm: 'block' }, WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ flex: 1 }} />
      {actions && (
        <Box sx={{
          display: 'flex', gap: 1, flexWrap: 'wrap',
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
