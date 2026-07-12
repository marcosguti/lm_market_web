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
    test: {
      globals: false,
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: [
              'src/api/test/**/*.{test,spec}.{ts,tsx}',
              'src/utils/test/**/*.{test,spec}.{ts,tsx}',
              'src/constants/test/**/*.{test,spec}.{ts,tsx}',
              'src/types/test/**/*.{test,spec}.{ts,tsx}',
            ],
            exclude: ['src/api/test/client.test.ts'],
            testTimeout: 10_000,
            hookTimeout: 10_000,
          },
        },
        {
          extends: true,
          test: {
            name: 'ui',
            environment: 'jsdom',
            setupFiles: ['./src/test/setupAntd.ts', './src/test/setup.ts'],
            include: [
              'src/App/test/**/*.{test,spec}.{ts,tsx}',
              'src/components/**/test/**/*.{test,spec}.{ts,tsx}',
              'src/pages/**/test/**/*.{test,spec}.{ts,tsx}',
              'src/hooks/test/**/*.{test,spec}.{ts,tsx}',
              'src/api/test/client.test.ts',
            ],
            testTimeout: 10_000,
            hookTimeout: 10_000,
            fileParallelism: false,
            pool: 'threads',
            poolOptions: {
              threads: {
                maxThreads: 1,
                minThreads: 1,
              },
            },
            teardownTimeout: 5_000,
          },
        },
      ],
    },
  };
});
