import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_DEV_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
