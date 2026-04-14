import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // ปิด modulepreload polyfill — ลดขนาด initial HTML
    modulePreload: {
      // ไม่ preload chunks ที่ใหญ่/หนัก (pdf, chart) ตั้งแต่แรก
      // เก็บเฉพาะ core vendor chunks ที่ต้องการแน่ๆ
      resolveDependencies: (_filename, deps) => {
        return deps.filter((dep) => {
          // ไม่ preload chunks หนัก ๆ ที่ไม่ใช้ตอน Login
          if (dep.includes('pdf-vendor')) return false;
          if (dep.includes('chart-vendor')) return false;
          return true;
        });
      },
    },
    rollupOptions: {
      output: {
        // แยก vendor chunks — รวม MUI เป็น chunk เดียวเพื่อเลี่ยง circular deps
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          'state-vendor': ['zustand', '@tanstack/react-query', 'react-hook-form', 'zod', '@hookform/resolvers', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
