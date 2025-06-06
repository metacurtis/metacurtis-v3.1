// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl'; // Your existing plugin
import tailwindcss from '@tailwindcss/vite'; // Import Tailwind Vite plugin
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    glsl(), // Your existing plugin
    tailwindcss(), // Add Tailwind Vite plugin, relies on auto-detection for CSS-based config.
  ],
  resolve: {
    // Your existing resolve aliases
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
  // Remove or comment out the explicit css.postcss configuration
  // if your postcss.config.js was mainly for Tailwind.
  // The @tailwindcss/vite plugin handles PostCSS for Tailwind internally.
  // css: {
  //   postcss: './postcss.config.js',
  // },
  build: {
    // Your existing build configurations
    target: 'esnext',
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three-vendor';
            if (id.includes('gsap')) return 'gsap-vendor';
            if (id.includes('@react-three')) return 'drei-vendor';
            if (id.includes('zustand')) return 'zustand-vendor';
            if (id.includes('react')) return 'react-vendor';
            return 'vendor';
          }
        },
      },
    },
    sourcemap: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
  server: {
    // Your existing server configurations
    host: true,
    open: true,
    hmr: { overlay: true },
  },
  optimizeDeps: {
    // Your existing optimizeDeps
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
    // Your existing test configurations
    passWithNoTests: true,
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}', 'src/**/*.spec.{js,jsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/assets/'],
    },
    deps: { optimizer: { web: { include: ['@react-three/fiber', '@react-three/drei'] } } },
  },
});
