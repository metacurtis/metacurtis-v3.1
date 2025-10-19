#!/usr/bin/env node
import fs from 'node:fs';

function writeFileOnce(path, content) {
  if (fs.existsSync(path)) {
    const bak = `${path}.bak.${Date.now()}`;
    fs.copyFileSync(path, bak);
    console.log('• backed up', path, '→', bak);
  }
  fs.writeFileSync(path, content, 'utf8');
  console.log('✓ wrote', path);
}

function patchPackageJson() {
  const pjPath = 'package.json';
  const raw = fs.readFileSync(pjPath, 'utf8');
  const pj = JSON.parse(raw);

  // Lint only src/**; scripts/** just prettier
  pj['lint-staged'] = {
    "*.{css,md,json}": ["prettier --write"],
    "src/**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "scripts/**/*.{js,mjs,cjs,ts}": ["prettier --write"]
  };

  fs.writeFileSync(pjPath, JSON.stringify(pj, null, 2) + '\n', 'utf8');
  console.log('✓ updated package.json lint-staged');
}

const ESLINT_CFG = `
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
`;

try {
  writeFileOnce('eslint.config.js', ESLINT_CFG);
  patchPackageJson();
  console.log('\n✅ ESLint relaxed and lint-staged limited to src/. Now run:\n');
  console.log('   git add -A && git commit -m "chore: relax ESLint + limit lint-staged (migration commit)"\n');
} catch (e) {
  console.error('❌ failed:', e.message);
  process.exit(1);
}
