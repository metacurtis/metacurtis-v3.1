// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Added from your version
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Integrate Tailwind plugin
  ],
  resolve: {
    // Aliases from the initial proposal (matches your version too)
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@webgl': path.resolve(__dirname, './src/components/webgl'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },
  // Adding your build optimizations - good for production
  build: {
    target: 'esnext', // Target modern browsers
    minify: 'terser', // Using Terser as you specified
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs in build (can change later if needed)
        drop_debugger: true // Remove debugger statements
      }
    },
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'gsap-vendor': ['gsap'],
          'zustand-vendor': ['zustand'], // Added zustand chunk
        }
      }
    },
    sourcemap: true, // Enable sourcemaps for easier debugging of builds
    cssCodeSplit: true, // Default, good practice
    assetsInlineLimit: 4096, // Default limit for inlining assets
  },
  // Adding your server options for convenience
  server: {
    host: true, // Allow access from network
    open: true, // Open browser on start
    hmr: {
      overlay: true // Show errors clearly
    }
  },
  // Adding your optimizeDeps includes
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'gsap', 'zustand']
  }
});