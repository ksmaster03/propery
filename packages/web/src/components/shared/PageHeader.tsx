import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';

// ส่วนหัวของแต่ละหน้า — ไอคอน + ชื่อหน้า + ปุ่มแอคชัน
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
        flexShrink: 0, px: 2.75, py: 1.5,
        bgcolor: '#fff',
        borderBottom: '1px solid rgba(22,63,107,.12)',
        display: 'flex', alignItems: 'center', gap: 1.5,
        boxShadow: '0 1px 4px rgba(10,22,40,.04)',
      }}
    >
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
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#17324a' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 11, color: '#6c7f92', mt: .1 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1 }} />
      {actions}
    </Box>
  );
}
