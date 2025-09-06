
// eslint.config.js — temporary relaxed config for migration commits
// Tighten back once the opening pipeline stabilizes.

export default [
  {
    ignores: [
      'scripts/**',
      'modules/**',
      'node_modules/**',
      'dist/**',
      'build/**'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly'
      }
    },
    rules: {
      // TEMPORARY migration relaxations:
      'no-empty': ['warn', { 'allowEmptyCatch': true }],
      'no-undef': 'off',
      // Let prettier handle formatting; avoid noisy style rules here.
    }
  }
];
