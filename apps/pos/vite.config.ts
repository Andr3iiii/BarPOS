import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3002,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            const code = (err as any)?.code;
            if (code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'EPIPE') {
              return;
            }
          });
        }
      }
    }
  }
});
