// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import refreshPlugin from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 1. Base ESLint recommended rules
  js.configs.recommended,

  // 2. Configuration for React/JS/JSX files
  {
    files: ['**/*.{js,jsx}'], // Target JS and JSX files
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '.*.cjs',
      '*.config.js', // Ignore self, vite, postcss, tailwind configs
      '*.config.cjs',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Ensure JSX is enabled *within* the languageOptions for targeted files
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    // Apply plugins
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'react-refresh': refreshPlugin,
    },
    // Apply settings needed by plugins
    settings: {
      react: {
        version: 'detect',
      },
    },
    // Define rules, including those from plugins
    rules: {
      // --- Base Rule Adjustments ---
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error', // Keep this active to catch things like the __dirname error

      // --- React Rules (Manually specify key ones + potentially extend recommended) ---
      ...reactPlugin.configs.recommended.rules, // Apply recommended rules
      ...reactPlugin.configs['jsx-runtime'].rules, // Apply rules for new JSX transform
      'react/prop-types': 'off', // Disable prop-types if not used

      // --- React Hooks Rules ---
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- React Refresh Rules ---
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Add any other specific rule overrides here
    },
  },

  // 3. Prettier Configuration - MUST BE LAST in the array
  prettierConfig,
];
