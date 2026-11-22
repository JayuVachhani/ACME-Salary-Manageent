import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const api = `http://127.0.0.1:${process.env.QA_API_PORT || '3001'}`;
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { '/api': api, '/healthz': api, '/readyz': api } },
});
