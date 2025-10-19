#!/usr/bin/env node
/* eslint-env node */
'use strict';
const fs = require('fs'); const _path = require('path');

const root = process.cwd();
const SRC_DIRS = ['src','canon-console'];
const exts = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs']);

const walk = (dir, out=[]) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(e))) out.push(p);
  }
  return out;
};

const files = SRC_DIRS.flatMap(d => walk(path.join(root, d)));
let changed = 0, staticFix = 0, dynFix = 0;

// patterns we normalize to the single canonical path:
const CANON = '@/modules/orchestration/core/BeatBusAdapter.js';

// helper
const backupOnce = p => { const b = p+'.bak'; if(!fs.existsSync(b)) fs.copyFileSync(p,b); };

for (const f of files) {
  let txt = fs.readFileSync(f, 'utf8');
  const before = txt;

  // 1) Point any BeatBus* import to the adapter, handling many variants.
  //    - '@/modules/.../BeatBus' or '.../BeatBus.js' or '@modules/.../BeatBus'
  //    - already-adapter but without .js
  txt = txt
    // alias variants → canonical
    .replace(/(['"])(@\/modules\/orchestration\/core\/)BeatBus(\.js)?\1/g,    `$1${CANON}$1`)
    .replace(/(['"])(@modules\/orchestration\/core\/)BeatBus(\.js)?\1/g,      `$1${CANON}$1`)
    // already adapter but missing .js
    .replace(/(['"])(@\/modules\/orchestration\/core\/BeatBusAdapter)(?=["'])/g, `$1${CANON.slice(0,-3)}$1`) // keep quotes, then we'll normalize below
    // normalize any lingering adapter path without .js to the .js version
    .replace(/(['"])(@\/modules\/orchestration\/core\/BeatBusAdapter)(['"])/g, `$1${CANON}$3`);

  // 2) Ensure default imports for the singleton instance
  // import * as BeatBus from '...BeatBusAdapter.js' → import BeatBus from '...BeatBusAdapter.js'
  txt = txt.replace(
    /import\s*\*\s*as\s*BeatBus\s*from\s*(['"])(@\/modules\/orchestration\/core\/BeatBusAdapter\.js)\1/g,
    'import BeatBus from $1$2$1'
  );
  // import { BeatBus } from '...BeatBusAdapter.js' → import BeatBus from ...
  txt = txt.replace(
    /import\s*\{\s*BeatBus\s*\}\s*from\s*(['"])(@\/modules\/orchestration\/core\/BeatBusAdapter\.js)\1/g,
    'import BeatBus from $1$2$1'
  );

  // 3) Dynamic imports → default instance
  // const { BeatBus } = await import('...BeatBusAdapter.js')
  txt = txt.replace(
    /const\s*\{\s*BeatBus\s*\}\s*=\s*await\s*import\((['"])(@\/modules\/orchestration\/core\/BeatBusAdapter\.js)\1\)/g,
    'const BeatBus = (await import($1$2$1)).default'
  );
  // const BeatBus = await import('...BeatBusAdapter.js')
  txt = txt.replace(
    /const\s+BeatBus\s*=\s*await\s*import\((['"])(@\/modules\/orchestration\/core\/BeatBusAdapter\.js)\1\)/g,
    'const BeatBus = (await import($1$2$1)).default'
  );

  if (txt !== before) {
    backupOnce(f);
    fs.writeFileSync(f, txt, 'utf8');
    changed++;
    if (before.includes('import') || txt.includes('import')) staticFix++;
    if (/await\s*import\(/.test(before) || /await\s*import\(/.test(txt)) dynFix++;
  }
}

console.log('▸ BeatBus unification complete.');
console.log('  Files changed  :', changed);
console.log('  Static imports :', staticFix);
console.log('  Dynamic imports:', dynFix);
console.log('\nNext steps:');
console.log('  1) rm -rf node_modules/.vite  # clear Vite cache (optional)');
console.log('  2) npm run dev');
console.log('  3) In DevTools, run quick checks below.');
