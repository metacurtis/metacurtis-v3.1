// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html", // Scan the main HTML file
      "./src/**/*.{js,jsx,ts,tsx}", // Scan all JavaScript/JSX files in the src directory
      // Add other file types or directories if needed (e.g., './public/**/*.html')
    ],
    // --- Tailwind v4 CSS-based Config ---
    // Theme extensions and plugins are primarily managed in your main CSS file for v4.
    // This JS config focuses on defining where Tailwind classes are used (the 'content' paths).
    // You can still use 'theme.extend' or 'plugins' here if absolutely necessary,
    // but the recommended v4 approach is within CSS.
    theme: {
      extend: {
        // Example: If you had a very specific JS-driven theme extension
        // colors: {
        //   'brand-js': '#ff0000',
        // }
      },
    },
    plugins: [
      // Example: If you needed a JS-based plugin
      // require('@tailwindcss/forms'),
    ],
  }