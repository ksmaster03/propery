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
          // ไม่ preload pdf-vendor และ chart-vendor ตอน initial load
          // ให้โหลดตอนที่ component ที่ใช้ถูก import เข้าสู่หน้าจอ
          if (dep.includes('pdf-vendor')) return false;
          if (dep.includes('chart-vendor')) return false;
          return true;
        });
      },
    },
    rollupOptions: {
      output: {
        // แยก vendor chunks เพื่อลดขนาด main bundle
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // MUI (ใหญ่สุด ~300KB)
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Chart.js
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          // PDF libs (ขนาดใหญ่) — lazy โดย dynamic import
          'pdf-vendor': ['jspdf', 'html2canvas'],
          // State + query + forms
          'state-vendor': ['zustand', '@tanstack/react-query', 'react-hook-form', 'zod', '@hookform/resolvers', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
