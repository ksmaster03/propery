import { Box, Typography, Paper } from '@mui/material';

// การ์ด KPI — แสดงตัวเลขสำคัญบน Dashboard
interface KpiCardProps {
  value: string | number;
  label: string;
  subtitle?: string;
  subtitleType?: 'up' | 'down' | 'neutral' | 'warn';
  accentColor: string; // สีแถบด้านบน
}

const subtitleStyles = {
  up: { bg: 'rgba(26,158,92,.1)', color: '#1a9e5c', border: 'rgba(26,158,92,.25)' },
  down: { bg: 'rgba(217,83,79,.1)', color: '#d9534f', border: 'rgba(217,83,79,.25)' },
  neutral: { bg: 'rgba(0,91,159,.1)', color: '#005b9f', border: 'rgba(0,91,159,.25)' },
  warn: { bg: 'rgba(217,119,6,.1)', color: '#d97706', border: 'rgba(217,119,6,.25)' },
};

export default function KpiCard({ value, label, subtitle, subtitleType = 'neutral', accentColor }: KpiCardProps) {
  const st = subtitleStyles[subtitleType];

  return (
    <Paper
      elevation={0}
      sx={{
        p: '14px 16px', position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(22,63,107,.12)',
        boxShadow: '0 2px 12px rgba(10,22,40,.08)',
        cursor: 'pointer',
        transition: 'box-shadow .2s, transform .2s',
        '&:hover': { boxShadow: '0 8px 28px rgba(10,22,40,.12)', transform: 'translateY(-1px)' },
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: accentColor,
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 24, fontWeight: 700,
          fontFamily: "'IBM Plex Mono', monospace",
          color: '#17324a', lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#6c7f92', mt: .6 }}>
        {label}
      </Typography>
      {subtitle && (
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: .4,
            mt: .875, py: .25, px: 1, borderRadius: 999,
            fontSize: 10, fontWeight: 700,
            fontFamily: "'IBM Plex Mono', monospace",
            background: st.bg, color: st.color,
            border: `1px solid ${st.border}`,
          }}
        >
          {subtitle}
        </Box>
      )}
    </Paper>
  );
}
