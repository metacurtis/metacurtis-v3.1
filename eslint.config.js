// eslint.config.js (Revised Structure)
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import refreshPlugin from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 1. Base ESLint recommended rules
  js.configs.recommended,

  // 2. Main configuration for React/JS/JSX files
  {
    files: ['**/*.{js,jsx}'],
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '.*.cjs',
      '*.config.js', // Ignore self and other JS configs
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
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
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'react-refresh': refreshPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Start with recommended React rules (use optional chaining '?' and nullish coalescing '??' for safety)
      ...(reactPlugin.configs.flat?.recommended?.rules ?? {}),

      // Apply overrides and additions
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rule
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // General rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // 3. Prettier Configuration - MUST BE LAST
  prettierConfig,
];
