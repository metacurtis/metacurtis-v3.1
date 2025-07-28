// eslint.config.js (R3F Unknown Property Fix)
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
      'lighthouserc.js', // Explicitly ignore lighthouserc if it exists
      // Add other specific files/dirs to ignore here if needed
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
      // React rules - directly specify instead of trying to merge configs
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'warn',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'warn',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rule
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // General rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // 3. Configuration override specifically for R3F/WebGL components
  {
    files: ['src/components/webgl/**/*.{js,jsx}'], // Target files in the webgl directory
    rules: {
      // Disable the rule complaining about R3F props like 'args', 'attach', 'position' etc.
      'react/no-unknown-property': 'off',
    },
  },

  // 4. Prettier Configuration - MUST BE LAST
  prettierConfig,
];
