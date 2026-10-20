import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts'],
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('fabric')) {
                return 'vendor-fabric';
              }
              if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
                return 'vendor-firestore';
              }
              if (id.includes('firebase/storage') || id.includes('@firebase/storage')) {
                return 'vendor-firestorage';
              }
              if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
                return 'vendor-fireauth';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase-core';
              }
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'vendor-react';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react') || id.includes('react-social-icons')) {
                return 'vendor-icons';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
                return 'vendor-forms';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
