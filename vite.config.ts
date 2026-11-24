import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import streamHandler from './api/stream.ts';

function streamApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-stream-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/stream')) {
          try {
            await streamHandler(req, res);
          } catch (e: any) {
            console.error('Vite dev stream error:', e.message);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), streamApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});

