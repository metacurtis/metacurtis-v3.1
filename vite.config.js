// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import tailwind from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  /* ─────────────────────────────── plugins */
  plugins: [
    react(), // React 19 / Fast-Refresh
    glsl(), // .glsl -> JavaScript strings
    tailwind(), // Tailwind v4 plug-in – zero extra PostCSS config needed
  ],

  /* ─────────────────────────────── resolver */
  resolve: {
    alias: {
      /* src/  */
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@webgl': path.resolve(__dirname, 'src/components/webgl'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@atoms': path.resolve(__dirname, 'src/stores/atoms'), // Added for atomic stores
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@shaders': path.resolve(__dirname, 'src/shaders'),
      '@core': path.resolve(__dirname, 'src/core'),

      /* modules/  (external to src/) */
      '@modules': path.resolve(__dirname, 'modules'),
      '@state': path.resolve(__dirname, 'modules/state'),
      '@orchestration': path.resolve(__dirname, 'modules/orchestration/core'),

      /* Event System - Direct file aliases for clean imports */
      '@events': path.resolve(__dirname, 'modules/orchestration/core/EventCatalog.js'),
      '@beatbus': path.resolve(__dirname, 'modules/orchestration/core/BeatBus.js'),

      /* Theater & other module systems */
      '@theater': path.resolve(__dirname, 'modules/theater'),
      '@memory': path.resolve(__dirname, 'modules/memory'),
      '@narrative': path.resolve(__dirname, 'modules/narrative'),
      '@audio': path.resolve(__dirname, 'modules/audio'),
      '@camera': path.resolve(__dirname, 'modules/camera'),
      '@effects': path.resolve(__dirname, 'modules/effects'),
      '@integration': path.resolve(__dirname, 'modules/integration'),
      '@optimization': path.resolve(__dirname, 'modules/optimization'),
    },
    // If you rely on extra extensions (e.g. .glsl) list them here
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.glsl'],
  },

  /* ─────────────────────────────── dev server */
  server: {
    host: true,
    open: true,
    strictPort: true, // fail instead of auto-bump
    hmr: { overlay: true },
  },

  /* ─────────────────────────────── build */
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4 * 1024,
    terserOptions: {
      compress: { drop_console: false, drop_debugger: true },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('three')) return 'three';
          if (id.includes('gsap')) return 'gsap';
          if (id.includes('@react-three')) return 'react-three';
          if (id.includes('zustand')) return 'zustand';
          if (id.includes('react')) return 'react';
          return 'vendor';
        },
      },
    },
  },

  /* ─────────────────────────────── optimise deps */
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
      'zustand',
    ],
  },

  /* ─────────────────────────────── vitest */
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    include: ['src/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/assets/'],
    },
    deps: {
      optimizer: {
        web: { include: ['@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
});
