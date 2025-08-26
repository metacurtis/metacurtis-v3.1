#!/usr/bin/env node
'use strict';
const fs = require('fs');
const _path = require('path');

const root = process.cwd();
const P = (...x) => path.join(root, ...x);
const rel = p => path.relative(root, p);
const CANON = P('src/canon-guard/runtime/GuardRuntimeInject.js');
const MAIN_CANDIDATES = [P('src/main.jsx'), P('src/main.tsx')];

function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const b=f+'.bak'; if(fs.existsSync(f)&&!fs.existsSync(b)) fs.copyFileSync(f,b); }
function writeFile(f,s){ ensureDir(path.dirname(f)); backupOnce(f); fs.writeFileSync(f,s,'utf8'); }

function findExisting(){
  const cands = [
    P('src/canon-guard/runtime/GuardRuntimeInject.js'),
    P('canon-guard/runtime/GuardRuntimeInject.js'),
    P('src/canon-guard/runtime/GuardRuntimeInject.ts'),
    P('src/canon-guard/runtime/GuardRuntimeInject.mjs'),
  ];
  return cands.find(f=>fs.existsSync(f)) || null;
}

function moveIfTopLevel(top, dest){
  if(fs.existsSync(top) && !fs.existsSync(dest)){
    ensureDir(path.dirname(dest));
    fs.renameSync(top, dest);
    return true;
  }
  return false;
}

function createStub(file){
  if(fs.existsSync(file)) return false;
  const stub = `/* Auto-generated stub to satisfy dev import.
     Replace with real GuardRuntimeInject when available. */
(function(){
  if (typeof window!=="undefined") {
    console.warn("⚠️ GuardRuntimeInject stub loaded — runtime guard NOT active");
    window.dispatchEvent(new CustomEvent("canon:guard:stub"));
  }
})();`;
  writeFile(file, stub);
  return true;
}

function patchMain(mainPath, canonicalImport){
  if(!fs.existsSync(mainPath)) return {patched:false, reason:'main not found'};
  let src = fs.readFileSync(mainPath,'utf8');
  const before = src;

  // Dynamic imports -> alias
  const dynPatterns = [
    /import\((['"])\.\.\/canon-guard\/runtime\/GuardRuntimeInject\.js\1\)/g,
    /import\((['"])\.\/canon-guard\/runtime\/GuardRuntimeInject\.js\1\)/g,
    /import\((['"])canon-guard\/runtime\/GuardRuntimeInject\.js\1\)/g
  ];
  dynPatterns.forEach(re => { src = src.replace(re, `import("${canonicalImport}")`); });

  // Static imports -> alias (just in case)
  const staticPatterns = [
    /from\s+(['"])\.\.\/canon-guard\/runtime\/GuardRuntimeInject\.js\1/g,
    /from\s+(['"])\.\/canon-guard\/runtime\/GuardRuntimeInject\.js\1/g,
    /from\s+(['"])canon-guard\/runtime\/GuardRuntimeInject\.js\1/g
  ];
  staticPatterns.forEach(re => { src = src.replace(re, `from "${canonicalImport}"`); });

  if(src !== before){
    writeFile(mainPath, src);
    return {patched:true};
  }
  return {patched:false, reason:'already correct'};
}

(function main(){
  const actions = [];

  const existing = findExisting();
  if(existing && existing !== CANON){
    if(moveIfTopLevel(existing, CANON)){
      actions.push(`moved ${rel(existing)} → ${rel(CANON)}`);
    }
  }

  if(!fs.existsSync(CANON)){
    if(createStub(CANON)){
      actions.push(`created stub ${rel(CANON)}`);
    }
  }

  let patchedAny = false;
  MAIN_CANDIDATES.forEach(m => {
    const res = patchMain(m, '@/canon-guard/runtime/GuardRuntimeInject.js');
    if(res.patched){ actions.push(`patched ${rel(m)}`); patchedAny = true; }
  });

  console.log('▸ Guard injector path doctor');
  console.log(`   injector: ${fs.existsSync(CANON) ? 'OK' : 'MISSING'} → ${rel(CANON)}`);
  if(actions.length) actions.forEach(a => console.log('   • ' + a));
  else console.log('   • no file changes (already correct)');

  console.log('\nNext: npm run dev');
})();
