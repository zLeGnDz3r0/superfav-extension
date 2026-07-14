import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  define: {
    __API_BASE__: JSON.stringify(
      process.env.VITE_API_BASE ?? 'https://superfavtwitch.onrender.com',
    ),
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      // crxjs resuelve los entrypoints desde el manifest e index.html
    },
  },
});
