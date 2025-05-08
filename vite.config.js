// vite.config.js (Corrected for ESLint errors and Tailwind v4)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// NO import for @tailwindcss/vite
import glsl from 'vite-plugin-glsl'; // Keep GLSL plugin
import path from 'path';
import { fileURLToPath } from 'url';

// Calculate __dirname directly from import.meta.url (Fixes unused __filename)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // NO tailwindcss() v3 plugin here
    glsl(),
  ],
  resolve: {
    alias: {
      // Ensure there are no typos like a stray 'x' here (around line 22)
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@webgl': path.resolve(__dirname, './src/components/webgl'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  // Explicitly point to PostCSS config (added during CSS debug, generally safe)
  css: {
    postcss: './postcss.config.js',
  },
  // --- Keep your original Build/Server/Optimize/Test options ---
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'gsap-vendor': ['gsap'],
          'zustand-vendor': ['zustand'],
        },
      },
    },
    sourcemap: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
  server: {
    host: true,
    open: true,
    hmr: { overlay: true },
  },
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
  test: {
    passWithNoTests: true,
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}', 'src/**/*.spec.{js,jsx}'],
    coverage: { reporter: ['text', 'json', 'html'], exclude: ['node_modules/', 'src/assets/'] },
    setupFiles: [],
    deps: { optimizer: { web: { include: ['@react-three/fiber', '@react-three/drei'] } } },
  },
});
