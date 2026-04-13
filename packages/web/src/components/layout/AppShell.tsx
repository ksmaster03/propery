import { useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

// Layout หลักของแอป — Topbar + Sidebar (responsive) + เนื้อหา
// Desktop: Sidebar แสดงข้างๆ ตลอด | Mobile/Tablet: เปิดผ่าน hamburger button
export default function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // breakpoint < 900px
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => setMobileOpen((o) => !o);
  const handleCloseSidebar = () => setMobileOpen(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar onMenuClick={handleToggleSidebar} showMenuButton={isMobile} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop sidebar — แสดงตลอด */}
        {!isMobile && <Sidebar onNavigate={handleCloseSidebar} />}

        {/* Mobile drawer — slide-in จากซ้าย */}
        {isMobile && (
          <Drawer
            open={mobileOpen}
            onClose={handleCloseSidebar}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: 260,
                boxSizing: 'border-box',
                top: 56, // อยู่ใต้ Topbar
                height: 'calc(100% - 56px)',
              },
            }}
          >
            <Sidebar onNavigate={handleCloseSidebar} />
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', bgcolor: '#f0f4fa',
            minWidth: 0, // กัน flex item overflow บน mobile
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
