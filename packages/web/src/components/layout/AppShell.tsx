import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

// Layout หลักของแอป — Topbar + Sidebar + เนื้อหา
export default function AppShell() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', bgcolor: '#f0f4fa',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
