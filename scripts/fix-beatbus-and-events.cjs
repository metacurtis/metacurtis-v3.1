#!/usr/bin/env node
/* eslint-env node */
'use strict';
const fs = require('fs');
const _path = require('path');

const root = process.cwd();
const SRC = path.join(root, 'src');
const guardInject = path.join(SRC, 'canon-guard/runtime/GuardRuntimeInject.js');
const engineCand = path.join(SRC, 'engine/ConsciousnessEngine.js');

function exists(p){ return fs.existsSync(p); }
function ensureDir(d){ if(!exists(d)) fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const b=f+'.bak'; if(exists(f) && !exists(b)) fs.copyFileSync(f,b); }
function read(p){ return exists(p)?fs.readFileSync(p,'utf8'):null; }
function write(p,s){ ensureDir(path.dirname(p)); backupOnce(p); fs.writeFileSync(p,s,'utf8'); }
function posixRelFromSrc(abs){ return path.posix.join(...path.relative(SRC, abs).split(path.sep)); }
function toAlias(abs){ return '@/' + posixRelFromSrc(abs); }

const IGNORE_DIRS = new Set(['node_modules','.git','dist','build','snapshots','.next','.cache']);

function walk(dir, out=[]){
  if(!exists(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      if (!IGNORE_DIRS.has(name)) walk(p, out);
    } else out.push(p);
  }
  return out;
}

function findBeatBus(){
  const files = walk(SRC).filter(f => /BeatBus\.(js|ts|mjs)$/i.test(f));
  // Prefer canonical location if multiple
  const ranked = files.sort((a,b)=>{
    const pa = a.includes(path.join('modules','orchestration','core'))?0:1;
    const pb = b.includes(path.join('modules','orchestration','core'))?0:1;
    return pa-pb || a.length-b.length;
  });
  return ranked[0] || null;
}

function patchImports(file, newAlias){
  if(!exists(file)) return false;
  let src = read(file);
  const before = src;

  // Dynamic imports: await import("...BeatBus.*")
  src = src.replace(/import\((['"])[^'"]*BeatBus\.(?:js|ts|mjs)\1\)/g, `import("${newAlias}")`);

  // Static imports: from "...BeatBus.*"
  src = src.replace(/from\s+(['"])[^'"]*BeatBus\.(?:js|ts|mjs)\1/g, `from "${newAlias}"`);

  // Normalize theatre→theater for events
  src = src.replace(/@\/theatre\/events\.js/g, '@/theater/events.js');

  if (src !== before) { write(file, src); return true; }
  return false;
}

function ensureEvents(){
  const theater = path.join(SRC,'theater/events.js');
  const theatre = path.join(SRC,'theatre/events.js');

  if (exists(theater)) return 'ok:theater';
  if (exists(theatre)) {
    // Create a re-export shim at /theater/events.js
    const shim = `// Auto-generated shim to normalize "theatre"→"theater"
export * from '../theatre/events.js';
export { EVENTS } from '../theatre/events.js';
`;
    write(theater, shim);
    return 'shim';
  }
  // Create a minimal stub
  const stub = `// Auto-generated stub EVENTS (replace with real file when available)
export const EVENTS = {
  BLUEPRINT_READY: 'BLUEPRINT_READY',
  BLUEPRINT_GUARDED: 'BLUEPRINT_GUARDED',
  RENDER_TICK: 'RENDER_TICK',
  INCIDENT: 'INCIDENT'
};
`;
  write(theater, stub);
  return 'stub';
}

function ensureBeatBusAt(pathAbs){
  if (exists(pathAbs)) return false;
  const code = `// Auto-generated BeatBus stub (replace with real implementation)
export default class BeatBus {
  constructor(){ this._t = new Map(); }
  on(type, fn){ const a=this._t.get(type)||[]; a.push(fn); this._t.set(type,a); return ()=>this.off(type,fn); }
  off(type, fn){ const a=this._t.get(type)||[]; const i=a.indexOf(fn); if(i>-1){a.splice(i,1);} this._t.set(type,a); }
  emit(type, payload){ (this._t.get(type)||[]).forEach(fn=>{ try{ fn(payload);}catch(e){ console.error('[BeatBus stub]', e);} }); }
}
`;
  write(pathAbs, code);
  return true;
}

(function main(){
  const actions = [];
  const eventsState = ensureEvents();
  if (eventsState==='shim') actions.push('created theater/events.js shim → re-exports theatre/events.js');
  if (eventsState==='stub') actions.push('created theater/events.js stub');

  let beatBusPath = findBeatBus();
  if (!beatBusPath) {
    // Create canonical stub
    beatBusPath = path.join(SRC,'src/src/modules/orchestration/core/BeatBus.js');
    if (ensureBeatBusAt(beatBusPath)) actions.push('created BeatBus stub at src/src/src/modules/orchestration/core/BeatBus.js');
  }

  const alias = toAlias(beatBusPath);

  // Patch known consumers (and any file that references BeatBus)
  const candidateFiles = new Set([
    guardInject,
    engineCand,
    ...walk(SRC).filter(f=>/\.(jsx?|tsx?)$/.test(f) && /BeatBus\.(js|ts|mjs)|@\/.*BeatBus/.test(read(f)||'')),
  ]);

  let patchedCount = 0;
  for (const f of candidateFiles) {
    try { if (patchImports(f, alias)) { patchedCount++; actions.push('patched ' + path.relative(root,f)); } }
    catch { /* ignore */ }
  }

  console.log('▸ BeatBus & Events path doctor');
  console.log('   BeatBus file  :', path.relative(root, beatBusPath));
  console.log('   BeatBus alias :', alias);
  console.log('   Events status :', eventsState);
  console.log('   Files patched :', patchedCount);
  if (actions.length) actions.forEach(a=>console.log('   • ' + a));
  else console.log('   • no changes (already correct)');

  console.log('\nNext: npm run dev');
})();
