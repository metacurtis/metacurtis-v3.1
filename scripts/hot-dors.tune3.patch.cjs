#!/usr/bin/env node
/**
 * HOT-DORS Tune #3 — replace checkInvariants() wholesale, and fix callsite.
 * - Single Bus: only BeatBus impl files reachable from src entrypoints
 * - StateCore: only real globals (window.SC) or React class this.setState outside UI
 * - Morph Driver: ignore UI/atoms; require reachable non-UI rAF or global morph writer
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

function replaceFunction(name, body){
  const start = s.indexOf(`function ${name}(`);
  if(start < 0) die(`function ${name}() not found`);
  let i = s.indexOf('{', start);
  if(i < 0) die('opening brace not found');
  let depth = 0, j = i;
  for(; j < s.length; j++){
    const ch = s[j];
    if(ch === '{') depth++;
    else if(ch === '}'){
      depth--;
      if(depth === 0){ j++; break; }
    }
  }
  if(depth !== 0) die(`brace match failed for ${name}()`);
  s = s.slice(0, start) + body + s.slice(j);
}

const NEW_CHECK = `
function checkInvariants(files, importGraph, specialEntrypoints){
  const results = {
    singleBus:        { pass: false, violations: [] },
    stateCoreOnly:    { pass: false, violations: [] },
    singleMorphDriver:{ pass: false, violations: [] }
  };

  // Build reachability from src/* entrypoints
  const roots = Array.from(new Set((specialEntrypoints||[]).filter(p=>p.startsWith('src/'))));
  const keys  = Array.from(importGraph.keys());
  const reachable = new Set();
  const stack = roots.slice();
  while(stack.length){
    const A = stack.pop();
    if(reachable.has(A)) continue;
    reachable.add(A);
    for(const B of keys){
      const node = importGraph.get(B);
      if(node && Array.isArray(node.importedBy) && node.importedBy.includes(A) && !reachable.has(B)){
        stack.push(B);
      }
    }
  }

  // === 1) Single BeatBus: only count real BeatBus impls (by path or class name), and only if reachable
  const busFiles = files
    .filter(f =>
      /(?:^|\\/)BeatBus\\.(?:js|jsx|ts|tsx)$/.test(f.path) ||
      /\\bclass\\s+BeatBus\\b/.test(f.content)
    )
    .map(f => f.path)
    .filter(p => reachable.has(p));

  results.singleBus.pass = busFiles.length <= 1;
  results.singleBus.violations = busFiles;

  // === 2) StateCore-only: real globals or React class setState outside UI; ignore atom internals
  const scOffenders = [];
  for (const f of files){
    if (/StateCore/.test(f.path)) continue;
    const p = f.path;
    const c = f.content;

    const isUI      = /\\/components\\/|\\/sections\\//.test(p) || /\\.jsx$/.test(p);
    const isAtom    = /stores\\/atoms\\//.test(p) || /createAtom|atomStore|zustand/.test(c);

    const hasGlobalSC       = /(?:window|globalThis)\\.SC\\s*=/.test(c);
    const hasReactSetState  = /(^|[^\\w$])this\\.setState\\(/.test(c); // typical React class

    if ((hasGlobalSC || (hasReactSetState && !isUI)) && !isAtom){
      scOffenders.push(p);
    }
  }
  results.stateCoreOnly.pass = scOffenders.length === 0;
  results.stateCoreOnly.violations = scOffenders;

  // === 3) Single Morph Driver: reachable non-UI rAF morph loop or global morph writer (not atoms)
  const morphDrivers = [];
  for (const f of files){
    const p = f.path;
    const c = f.content;
    const isUI   = /\\/components\\/|\\/sections\\//.test(p) || /\\.jsx$/.test(p);
    const isAtom = /stores\\/atoms\\//.test(p) || /createAtom|atomStore|zustand/.test(c);
    if(isUI) continue;

    const drivesRAF = /requestAnimationFrame\\s*\\([^)]*morph/i.test(c);
    const writesGlobalMorph = /(narrativeAtom\\.)?setMorphProgress\\s*\\(/.test(c) && !isAtom;

    if((drivesRAF || writesGlobalMorph) && reachable.has(p)){
      morphDrivers.push(p);
    }
  }
  results.singleMorphDriver.pass = morphDrivers.length <= 1;
  results.singleMorphDriver.violations = morphDrivers;

  return results;
}
`;

replaceFunction('checkInvariants', NEW_CHECK);

// Ensure callsite passes specialEntrypoints
s = s.replace(
  /checkInvariants\s*\(\s*files\s*,\s*aliases\.importGraph\s*\)/,
  'checkInvariants(files, aliases.importGraph, aliases.specialEntrypoints)'
);

backup(hot);
fs.writeFileSync(hot, s);
ok('Replaced checkInvariants() and fixed callsite');
