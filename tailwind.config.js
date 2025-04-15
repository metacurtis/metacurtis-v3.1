import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // safelist: [],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#64748b',
        background: '#0f172a',
        'text-base': '#cbd5e1',
        'bg-base': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      zIndex: {
        background: '-10',
        default: '1',
        overlay: '10',
        modal: '100',
        tooltip: '1000',
      },
      // --- Add Custom Font Sizes ---
      fontSize: {
        // Define sizes corresponding to the defaults we tried to use
        // Naming them slightly differently (e.g., hero-*) avoids potential conflicts
        'hero-8xl': ['6rem', { lineHeight: '1' }], // Equivalent to text-8xl
        'hero-9xl': ['8rem', { lineHeight: '1' }], // Equivalent to text-9xl
        'hero-10r': ['10rem', { lineHeight: '1' }], // Equivalent to text-[10rem]
        'hero-12r': ['12rem', { lineHeight: '1' }], // Equivalent to text-[12rem]
        // Add other custom sizes if needed
      },
      // --- End Custom Font Sizes ---
    },
  },
  plugins: [],
});
