import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3795,
      host: 'localhost',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res) => {
              if ('writeHead' in res) {
                (res as any).writeHead(503, { 'Content-Type': 'application/json' });
                (res as any).end(JSON.stringify({
                  error: 'Backend unavailable. Run `npm run dev:full` for API support.',
                }));
              }
            });
          },
        }
      }
    },
    plugins: [
      react(),
      istanbul({
        include: '**/*',
        exclude: ['node_modules', 'tests/'],
        extension: ['.js', '.ts', '.tsx'],
        requireEnv: true,
      }),
    ],
    define: {
      // 🚨 SECURITY WARNING 🚨
      // This explicitly exposes the API Key to the client-side bundle.
      // This is REQUIRED for the Gemini Live API (WebSockets) to work from the browser.
      // YOU MUST RESTRICT THIS KEY BY DOMAIN (REFERRER) IN GOOGLE CLOUD CONSOLE.
      // DO NOT REMOVE THIS UNLESS YOU MIGRATE LIVE API TO A BACKEND PROXY.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
