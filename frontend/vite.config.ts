import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const api = env.API_PROXY_TARGET || 'http://127.0.0.1:3001';
  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy: { '/api': api, '/healthz': api, '/readyz': api },
    },
    preview: {
      host: 'localhost',
      port: 4173,
      strictPort: true,
      proxy: { '/api': api, '/healthz': api, '/readyz': api },
    },
  };
});
