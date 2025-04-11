import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        background: 'var(--color-background)',
        'text-base': 'rgb(var(--color-text-base-rgb) / <alpha-value>)',
        'bg-base': 'rgb(var(--color-bg-base-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
        md: 'var(--border-radius-md)',
        lg: 'var(--border-radius-lg)',
        xl: 'var(--border-radius-xl)',
        full: 'var(--border-radius-full)',
      },
      zIndex: {
        background: 'var(--z-background)',
        default: 'var(--z-default)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
  plugins: [],
});
