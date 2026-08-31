import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://corretorfacil.onrender.com',
        changeOrigin: true,
        rewrite: (path) => {
          if (!path.startsWith('/api/Apolice')) return path;
          const suffix = path.slice('/api/Apolice'.length);
          return suffix || '/getAll';
        },
      },
    },
  },
});
