#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/components/theater/OpeningSequence.jsx');
if (!fs.existsSync(file)) {
  console.error('✖ Cannot find OpeningSequence.jsx at', file);
  process.exit(1);
}

let src = fs.readFileSync(file, 'utf8');
const before = src;

// 1) Remove the stray token sequence injected by the doctor
//    … turning `});=> {});` (and nearby variants) back into `});`
src = src.replace(/(\}\);)\s*=>\s*\{\}\);/g, '$1');
src = src.replace(/(\})\s*=>\s*\{\}\);/g, '$1);');

// 2) Safety: collapse any accidental double closers like `});});`
src = src.replace(/\}\);\s*\}\);/g, '});');

// 3) Optional: normalize BeatBus import to the Adapter (harmless if already correct)
src = src.replace(
  /from\s+['"]@?\/?modules\/orchestration\/core\/BeatBus(\.js)?['"]/g,
  "from '@/modules/orchestration/core/BeatBusAdapter.js'"
);

if (src === before) {
  console.log('✓ OpeningSequence.jsx already clean. No changes.');
  process.exit(0);
}

const bak = file + '.bak';
if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
fs.writeFileSync(file, src, 'utf8');

console.log('✍️  Patched', path.relative(process.cwd(), file));
console.log('   • Removed stray `=> {}` token after `});`');
console.log('   • Normalized BeatBus import (if needed)');
console.log('   • Backup saved at', path.relative(process.cwd(), bak));
