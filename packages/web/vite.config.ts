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
          // State + query + forms
          'state-vendor': ['zustand', '@tanstack/react-query', 'react-hook-form', 'zod', '@hookform/resolvers', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
