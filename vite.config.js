// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Update aliases to use the ES Module __dirname equivalent
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@webgl': path.resolve(__dirname, './src/components/webgl'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
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
    hmr: {
      overlay: true,
    },
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
  // Add test configuration to fix CI/CD pipeline
  test: {
    passWithNoTests: true, // Allow CI to pass when no tests are found
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}', 'src/**/*.spec.{js,jsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/assets/'],
    },
    setupFiles: [], // Will contain test setup files once created
    deps: {
      optimizer: {
        web: {
          include: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
