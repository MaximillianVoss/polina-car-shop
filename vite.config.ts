import { defineConfig } from 'vitest/config';
import { loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import { backendBase, proxyPath } from './src/api-config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const target = backendBase(process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL);
  const proxy: Record<string, ProxyOptions> = {
    '^/api(?:/|\\?|$)': {
      target: new URL(target).origin,
      changeOrigin: true,
      proxyTimeout: 25000,
      timeout: 28000,
      rewrite: path => proxyPath(path, target),
      configure(instance) {
        // The original direct fetch did not send cross-origin cookies. Keep
        // local application cookies away from the shared course backend.
        instance.on('proxyReq', request => request.removeHeader('cookie'));
        instance.on('proxyRes', response => { delete response.headers['set-cookie']; });
        instance.on('error', (error, _request, response) => {
          if ('writeHead' in response && !response.headersSent && !response.writableEnded) {
            const reason = (error as NodeJS.ErrnoException).code || 'NETWORK_ERROR';
            response.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            response.end(JSON.stringify({ code: 'API_UNREACHABLE', reason }));
          }
        });
      },
    },
  };
  return { plugins: [react()], server: { proxy }, preview: { proxy }, test: { include: ['tests/unit/**/*.test.ts'] } };
});
