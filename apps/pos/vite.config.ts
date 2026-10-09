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
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            const code = (err as any)?.code;
            if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'EPIPE') {
              if (res && 'writeHead' in res && !(res as any).headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Backend server is initializing...' }));
              }
              return;
            }
          });
        }
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
