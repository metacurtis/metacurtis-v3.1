import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/sections/**/*.{js,jsx}',
  ],
  safelist: [
    'text-hero-base',
    'text-hero-md',
    'text-hero-lg',
    'text-hero-xl',
    'sm:text-hero-base',
    'md:text-hero-base',
    'lg:text-hero-base',
    'xl:text-hero-base',
    'sm:text-hero-md',
    'md:text-hero-md',
    'lg:text-hero-md',
    'xl:text-hero-md',
    'sm:text-hero-lg',
    'md:text-hero-lg',
    'lg:text-hero-lg',
    'xl:text-hero-lg',
    'sm:text-hero-xl',
    'md:text-hero-xl',
    'lg:text-hero-xl',
    'xl:text-hero-xl',
  ],
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
      fontSize: {
        'hero-base': ['6rem', { lineHeight: '1' }],
        'hero-md': ['8rem', { lineHeight: '1' }],
        'hero-lg': ['10rem', { lineHeight: '1' }],
        'hero-xl': ['12rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
});
