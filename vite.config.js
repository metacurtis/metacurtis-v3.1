// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function for ESM __dirname

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Aliases using the ES Module __dirname equivalent
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
        drop_console: false, // Keep console logs in production builds
        drop_debugger: true, // Remove debugger statements
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
    host: true, // Expose server on network
    open: true, // Open browser automatically
    hmr: {
      overlay: true, // Show errors clearly in browser
    },
  },
  optimizeDeps: {
    include: [
      // Help Vite pre-bundle these dependencies
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
      'zustand',
    ],
  },
  // Vitest configuration block
  test: {
    passWithNoTests: true, // *** THIS FIXES THE CI ERROR *** Allows Vitest to pass even if no test files are found
    environment: 'jsdom', // Use jsdom environment for browser-like testing
    globals: true, // Enable global test APIs (describe, it, expect, etc.)
    include: ['src/**/*.test.{js,jsx}', 'src/**/*.spec.{js,jsx}'], // Pattern for test files
    coverage: {
      // Basic coverage configuration (optional for now)
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/assets/'], // Exclude certain folders from coverage
    },
    setupFiles: [], // Array for test setup files (e.g., './src/setupTests.js') - Add later if needed
    deps: {
      // Dependency optimization for tests
      optimizer: {
        web: {
          include: ['@react-three/fiber', '@react-three/drei'], // Pre-bundle these for tests using them
        },
      },
    },
  }, // Ensure comma if another top-level key follows (none in this case)
});
