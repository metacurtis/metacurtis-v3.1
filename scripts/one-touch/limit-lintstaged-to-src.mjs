#!/usr/bin/env node
import fs from 'node:fs';

const pjPath = 'package.json';
if (!fs.existsSync(pjPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}
const raw = fs.readFileSync(pjPath, 'utf8');
const pj = JSON.parse(raw);

// Only lint/format the app code in src/**
pj['lint-staged'] = {
  "src/**/*.{js,jsx,ts,tsx}": ["eslint --fix"],
  "src/**/*.{css,md,json}": ["prettier --write"]
};

fs.writeFileSync(pjPath, JSON.stringify(pj, null, 2) + '\n', 'utf8');
console.log('✓ lint-staged now only targets src/** (scripts/** skipped)');
