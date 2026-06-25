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
    },
    server: {
      // Force Vite to use standard polling/port options if WebSockets drop
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
        clientPort: 5173,
      },
      // Alternative for cloud IDE environments:
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        usePolling: true,
      },
    },
  };
});
