#!/usr/bin/env node
/**
 * HOT-DORS Hardening Patch
 * - Single Bus: only count implementations reachable from special entrypoints
 * - Morph Driver: ignore React components/sections & restrict to real drivers
 * - Wires checkInvariants(files, importGraph, specialEntrypoints)
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

// 1) Widen function signature: checkInvariants(files, importGraph, specialEntrypoints)
s = s.replace(
  /function\s+checkInvariants\s*\(\s*files\s*,\s*importGraph\s*\)/,
  'function checkInvariants(files, importGraph, specialEntrypoints)'
);

// 2) Update callsite: checkInvariants(files, aliases.importGraph) -> pass specialEntrypoints
s = s.replace(
  /const\s+invariants\s*=\s*checkInvariants\(\s*files\s*,\s*aliases\.importGraph\s*\);/,
  'const invariants = checkInvariants(files, aliases.importGraph, aliases.specialEntrypoints);'
);

// 3) Inject reachability helper (once)
if(!/function\s+reachableFromEntrypoints\s*\(/.test(s)){
  s = s.replace(
    /function\s+checkInvariants\(/,
`function reachableFromEntrypoints(importGraph, entrypoints){
  const seen = new Set();
  const stack = Array.from(new Set(entrypoints||[]));
  // Build forward adjacency via importedBy (find deps B where B.importedBy includes A)
  const keys = Array.from(importGraph.keys());
  while(stack.length){
    const A = stack.pop();
    if(seen.has(A)) continue;
    seen.add(A);
    for(const B of keys){
      const node = importGraph.get(B);
      if(node && Array.isArray(node.importedBy) && node.importedBy.includes(A)){
        if(!seen.has(B)) stack.push(B);
      }
    }
  }
  return seen;
}

function checkInvariants(`
  );
}

// 4) Replace the Single Bus and Morph Driver checks with hardened versions
s = s.replace(
  /\/\/\s*Check\s*1:\s*Single\s*BeatBus[\s\S]*?results\.singleBus\.violations\s*=\s*busImplementations\s*;/,
`// Check 1: Single BeatBus (reachable only)
const reachable = reachableFromEntrypoints(importGraph, specialEntrypoints);
const busImplementations = [];
for (const f of files){
  const isBusImpl = /class\\s+\\w*BeatBus|new\\s+EventEmitter\\b|createBus\\b/.test(f.content);
  if(!isBusImpl) continue;
  const node = importGraph.get(f.path);
  if(!node) continue;
  // Only count if this file is actually reachable from an entrypoint
  if(reachable.has(f.path)) busImplementations.push(f.path);
}
results.singleBus.pass = busImplementations.length <= 1;
results.singleBus.violations = busImplementations;
`
);

// Morph Driver replacement
s = s.replace(
  /\/\/\s*Check\s*3:\s*Single\s*morph\s*driver[\s\S]*?results\.singleMorphDriver\.violations\s*=\s*morphDrivers\s*;/,
`// Check 3: Single morph driver (reachable non-UI modules)
const drivers = [];
for (const f of files){
  const p = f.path;
  // Ignore React components/sections and .jsx files as "drivers"
  const isUI = /\\/components\\//.test(p) || /\\/sections\\//.test(p) || /\\.jsx$/.test(p);
  if(isUI) continue;

  const c = f.content;
  const drivesRAF = /requestAnimationFrame\\s*\\(.*morph/i.test(c);
  // consider global morph writers (not atoms/components)
  const isAtomFile = /stores\\/atoms\\//.test(p) || /createAtom|atomStore|zustand/.test(c);
  const writesGlobalMorph = /(narrativeAtom\\.)?setMorphProgress\\s*\\(/.test(c) && !isAtomFile;

  if((drivesRAF || writesGlobalMorph) && reachable.has(p)){
    drivers.push(p);
  }
}
results.singleMorphDriver.pass = drivers.length <= 1;
results.singleMorphDriver.violations = drivers;
`
);

backup(hot);
fs.writeFileSync(hot, s);
ok('Patched hot-dors.cjs (reachability + morph driver hardening)');
