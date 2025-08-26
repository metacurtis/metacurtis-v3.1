#!/usr/bin/env node
/**
 * HOT-DORS Tune #2
 * - Single Bus: only count real BeatBus impls (file path or class BeatBus)
 * - Alias resolver: stop prepending 'src/' (fixes '@/...' -> 'src/...', not 'src/src/...')
 * - Entrypoints: only treat src/** files as entrypoints
 */
const fs = require('fs');
const _path = require('path');
const CWD = process.cwd();
function die(m){ console.error('✖', m); process.exit(1); }
function ok(m){ console.log('✔', m); }
function backup(p){ const b=p+'.bak.'+new Date().toISOString().replace(/[:.]/g,'-'); fs.copyFileSync(p,b); return b; }

const hot = path.join(CWD,'scripts','hot-dors.cjs');
if(!fs.existsSync(hot)) die('scripts/hot-dors.cjs not found');
let s = fs.readFileSync(hot,'utf8');

/* 1) Single Bus: refine isBusImpl to only the BeatBus impl file or a class named BeatBus */
s = s.replace(
  /const\s+isBusImpl\s*=\s*\/class\\\\s\+\\\\w\*BeatBus\|new\\\\s\+EventEmitter\\\\b\|createBus\\\\b\/\.test\(f\.content\);/,
  'const isBusImpl = /(?:^|\\/ )?BeatBus\\.(?:js|jsx|ts|tsx)$/.test(f.path) || /\\bclass\\s+BeatBus\\b/.test(f.content);'
).replace(
  /const\s+isBusImpl\s*=\s*\/class\s+\w\*BeatBus\|new\s+EventEmitter\b\|createBus\b\/\.test\(f\.content\);/,
  'const isBusImpl = /(?:^|\\/)?BeatBus\\.(?:js|jsx|ts|tsx)$/.test(f.path) || /\\bclass\\s+BeatBus\\b/.test(f.content);'
);

/* 2) Alias resolver: replace the 'src/${replacement}' prefixing */
s = s.replace(
  /if\s*\(\s*imp\.startsWith\(alias\)\s*\)\s*\{\s*imp\s*=\s*imp\.replace\(alias,\s*`src\/\$\{replacement\}`\);\s*\}/g,
  'if (imp.startsWith(alias)) { imp = imp.replace(alias, replacement); }'
);

/* 3) Entrypoints: only keep src/** */
s = s.replace(
  /return\s*\{\s*aliases,\s*specialEntrypoints,\s*trueOrphans,\s*importGraph\s*\};/,
  'return { aliases, specialEntrypoints: specialEntrypoints.filter(p=>p.startsWith("src/")), trueOrphans, importGraph };'
);

backup(hot);
fs.writeFileSync(hot, s);
ok('Patched hot-dors.cjs (Single Bus, alias resolver, entrypoints filter)');
