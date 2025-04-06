// eslint.config.js
import js from '@eslint/js'; // ESLint's recommended rules
import globals from 'globals'; // Global variable definitions
import reactPlugin from 'eslint-plugin-react'; // React plugin
import hooksPlugin from 'eslint-plugin-react-hooks'; // React Hooks plugin
import refreshPlugin from 'eslint-plugin-react-refresh'; // React Refresh plugin
import prettierConfig from 'eslint-config-prettier'; // Prettier config to disable conflicting rules

export default [
  // 1. Base ESLint recommended rules
  js.configs.recommended,

  // 2. Configuration for React/JS/JSX files
  {
    files: ['**/*.{js,jsx}'], // Apply this config to JS and JSX files
    ignores: [
      'dist/**',          // Ignore build output
      'node_modules/**',  // Ignore dependencies
      'build/**',         // Ignore potential build folders
      'coverage/**',       // Ignore coverage reports
      '.*.cjs',            // Ignore config files like .eslintrc.cjs if lingering
      '*.config.js',       // Ignore JS config files (like this one, vite, postcss, tailwind)
    ],
    languageOptions: {
      ecmaVersion: 'latest', // Use modern ECMAScript
      sourceType: 'module',  // Use ES modules
      parserOptions: {
        ecmaFeatures: {
          jsx: true,       // Enable JSX parsing
        },
      },
      globals: {
        ...globals.browser, // Add browser global variables
        ...globals.node,    // Add Node.js global variables
      },
    },
    plugins: {
      // Define plugins used in this config block
      'react': reactPlugin,
      'react-hooks': hooksPlugin,
      'react-refresh': refreshPlugin,
    },
    settings: {
      // React version detection
      react: {
        version: 'detect',
      },
    },
    rules: {
      // --- Base Rule Adjustments ---
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // --- React Rules ---
      // Rules included in reactPlugin.configs.recommended (applied below)
      // 'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/prop-types': 'off', // Disable if not using prop-types

      // --- React Hooks Rules --- (Provided by plugin)
      'react-hooks/rules-of-hooks': 'error', // Enforce Rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // Check effect dependencies

      // --- React Refresh Rules --- (Provided by plugin)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Add any other specific rule overrides here
    },
  },

  // 3. Apply recommended rules from the React plugin itself
   // This is often cleaner than listing all React rules manually
  // Ensure you apply settings/plugins *before* rules typically
   {
     // Apply recommended React rules specifically
     // This structure assumes eslint-plugin-react exports configs like this in flat config era
     // Check plugin documentation if this specific export doesn't exist.
     // Alternative might be manually adding rules above.
     ...reactPlugin.configs.flat.recommended, // Or .configs.recommended depending on export
     // Turn off rules handled by the new JSX transform again if needed
     rules: {
       ...reactPlugin.configs.flat.recommended.rules, // Or .configs.recommended.rules
       'react/react-in-jsx-scope': 'off',
       'react/jsx-uses-react': 'off' // Also often off with new transform
     }
   },

  // 4. Prettier Configuration - MUST BE LAST
  // This disables ESLint rules that conflict with Prettier formatting
  prettierConfig,
];