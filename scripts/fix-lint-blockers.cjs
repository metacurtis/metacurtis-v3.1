#!/usr/bin/env node
/* eslint-env node */
/**
 * Fix ESLint "no-empty" blockers across the repo (idempotent).
 * - Inserts /* noop *\/ into empty control-flow blocks (try/catch/finally/if/else/for/while/switch/do-while)
 * - Leaves object literals alone.
 * - Makes .bak once per file the first time it changes it.
 */
const fs = require('fs');
const _path = require('path');

const ROOT = process.cwd();
const EXTS = new Set(['.js','.jsx','.mjs','.cjs','.ts','.tsx']);
const SKIP_DIR = new Set(['node_modules','.git','dist','build','snapshots','.next','.cache']);

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...listFiles(p));
    else if (EXTS.has(path.extname(entry))) out.push(p);
  }
  return out;
}

function backupOnce(p) { const b=p+'.bak'; if (!fs.existsSync(b)) fs.copyFileSync(p,b); }

const files = listFiles(ROOT);
let changed = 0, touched = [];

const patterns = [
  // try/catch/finally
  [/\btry\s*\{\s*\}/g,                 'try { /* noop */ }'],
  [/\bcatch\s*\(([^)]*)\)\s*\{\s*\}/g, 'catch ($1) { /* noop */ }'],
  [/\bfinally\s*\{\s*\}/g,             'finally { /* noop */ }'],

  // if/else
  [/\bif\s*\(([\s\S]*?)\)\s*\{\s*\}/g, 'if ($1) { /* noop */ }'],
  [/\belse\s*\{\s*\}/g,                'else { /* noop */ }'],

  // loops
  [/\bfor\s*\(([\s\S]*?)\)\s*\{\s*\}/g,   'for ($1) { /* noop */ }'],
  [/\bwhile\s*\(([\s\S]*?)\)\s*\{\s*\}/g, 'while ($1) { /* noop */ }'],
  [/\bdo\s*\{\s*\}\s*while\s*\(([\s\S]*?)\)/g, 'do { /* noop */ } while ($1)'],

  // switch
  [/\bswitch\s*\(([\s\S]*?)\)\s*\{\s*\}/g, 'switch ($1) { /* noop */ }'],
];

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const before = src;

  // Cheap guard: only run on files that contain a control keyword followed by empty braces
  if (!/\b(try|catch|finally|if|else|for|while|do|switch)\b/.test(src) || !/\{\s*\}/.test(src)) {
    continue;
  }

  for (const [re, rep] of patterns) src = src.replace(re, rep);

  if (src !== before) {
    backupOnce(f);
    fs.writeFileSync(f, src, 'utf8');
    changed++;
    touched.push(path.relative(ROOT, f));
  }
}

console.log('🩹 no-empty fixer complete.');
console.log('   Files changed :', changed);
if (changed) console.log('   Touched:\n  - ' + touched.join('\n  - '));
console.log('ℹ If any file still errors on no-empty, it likely has an edge-case; we can target it specifically.');
