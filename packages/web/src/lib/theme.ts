import { createTheme } from '@mui/material/styles';

// MUI Theme ที่ตรงกับ Design System ของ DOA
export const theme = createTheme({
  palette: {
    primary: {
      main: '#005b9f',
      dark: '#163f6b',
      light: '#0f73b8',
    },
    secondary: {
      main: '#d7a94b',
    },
    success: {
      main: '#0f7a43',
    },
    warning: {
      main: '#a45a00',
    },
    error: {
      main: '#b52822',
    },
    background: {
      default: '#f0f4fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#17324a',
      secondary: '#3a5068',
    },
  },
  typography: {
    // ใช้ Noto Sans Thai เป็นหลัก (Google แนะนำสำหรับ Thai, มี glyphs ครบทุก weight)
    fontFamily: "'Noto Sans Thai', 'IBM Plex Sans Thai', 'Sarabun', 'Prompt', sans-serif",
    fontSize: 13,
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 700 },
    h3: { fontSize: '1.1rem', fontWeight: 700 },
    h4: { fontSize: '1rem', fontWeight: 700 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          color: '#5a6d80',
        },
      },
    },
    // Default aria-label สำหรับ Select ที่ไม่ได้อยู่ใน FormControl — ผ่าน axe aria-input-field-name
    MuiSelect: {
      defaultProps: {
        inputProps: { 'aria-label': 'เลือก' },
      },
    },
  },
});
