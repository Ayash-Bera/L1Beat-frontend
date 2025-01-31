import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
});