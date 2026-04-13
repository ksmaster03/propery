import { Box, Typography, Paper } from '@mui/material';
import PageHeader from '../components/shared/PageHeader';

// หน้า Placeholder — สำหรับเมนูที่ยังไม่ได้พัฒนา
interface PlaceholderPageProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export default function PlaceholderPage({ icon, title, subtitle }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader icon={icon} title={title} subtitle={subtitle || 'อยู่ระหว่างพัฒนา'} />
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6, textAlign: 'center', maxWidth: 400,
            border: '2px dashed rgba(22,63,107,.15)',
            borderRadius: 3,
          }}
        >
          <Typography sx={{ fontSize: 48, mb: 2 }}>{icon}</Typography>
          <Typography variant="h3" sx={{ mb: 1 }}>{title}</Typography>
          <Typography sx={{ color: '#5a6d80' }}>
            โมดูลนี้อยู่ระหว่างพัฒนา จะเปิดใช้งานเร็วๆ นี้
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
