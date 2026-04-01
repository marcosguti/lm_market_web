import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_PROXY_API_TARGET?.trim() || 'http://127.0.0.1:3000';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          changeOrigin: true,
          secure: false,
          target: apiTarget,
        },
      },
    },
  };
});
