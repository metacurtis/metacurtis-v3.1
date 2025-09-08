import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: { target: 'es2022' },
  build: { target: 'es2022' },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@config': path.resolve(__dirname, './src/config'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@theater': path.resolve(__dirname, './src/theater'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@modules': path.resolve(__dirname, './modules'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
