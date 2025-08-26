#!/usr/bin/env node
'use strict';
const fs = require('fs');
const _path = require('path');

const root = process.cwd();
const SRC = path.join(root, 'src');
const adapterPath = path.join(SRC, 'modules/orchestration/core/BeatBusAdapter.js');

function exists(p){ return fs.existsSync(p); }
function ensureDir(d){ if(!exists(d)) fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const b=f+'.bak'; if(exists(f) && !exists(b)) fs.copyFileSync(f,b); }
function read(p){ return exists(p)?fs.readFileSync(p,'utf8'):null; }
function write(p,s){ ensureDir(path.dirname(p)); if (exists(p)) backupOnce(p); fs.writeFileSync(p,s,'utf8'); }
function walk(dir, out=[]){
  if(!exists(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir,name);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      if (!['node_modules','.git','dist','build','snapshots','.next','.cache'].includes(name)) walk(p,out);
    } else if (/\.(m?js|tsx?)$/.test(name)) out.push(p);
  }
  return out;
}

// 1) Ensure the adapter file exists and always yields a singleton instance
const adapterCode = `// Auto-generated BeatBusAdapter: always export a singleton instance.
// - Default export: instance with .on/.off/.emit
// - Named: { bus } same instance, { BeatBusClass } original class if available
// Uses a global to avoid duplicate instances across dynamic imports.
import DefaultMaybeClass, * as All from './BeatBus.js';

function makeFallback(){
  class Fallback {
    constructor(){ this._t = new Map(); }
    on(t, fn){ const a=this._t.get(t)||[]; a.push(fn); this._t.set(t,a); return ()=>this.off(t,fn); }
    off(t, fn){ const a=this._t.get(t)||[]; const i=a.indexOf(fn); if(i>-1){a.splice(i,1);} this._t.set(t,a); }
    emit(t, payload){ (this._t.get(t)||[]).forEach(fn=>{ try{ fn(payload);}catch(e){ console.error('[BeatBus]', e);} }); }
  }
  return new Fallback();
}

let instance;
let BeatBusClass = null;

try {
  if (DefaultMaybeClass && typeof DefaultMaybeClass === 'function') {
    // default export is a class/constructor
    BeatBusClass = DefaultMaybeClass;
    instance = globalThis.__CANON_BEATBUS__ || new DefaultMaybeClass();
  } else if (DefaultMaybeClass && typeof DefaultMaybeClass.on === 'function') {
    // default export is already an instance
    instance = DefaultMaybeClass;
  } else if (All && All.default && typeof All.default.on === 'function') {
    instance = All.default;
  } else {
    instance = makeFallback();
  }
} catch {
  instance = makeFallback();
}

globalThis.__CANON_BEATBUS__ = instance;

export const bus = instance;
export const BeatBusClass = BeatBusClass;
export default instance;
`;
if (!exists(adapterPath) || read(adapterPath) !== adapterCode) {
  write(adapterPath, adapterCode);
  console.log('✍️  wrote', path.relative(root, adapterPath));
} else {
  console.log('✓ adapter already present:', path.relative(root, adapterPath));
}

// 2) Rewrite imports to use the adapter (static & dynamic)
const adapterAlias = '@/modules/orchestration/core/BeatBusAdapter.js';
const files = walk(SRC);
let patched = 0;

for (const f of files) {
  if (f === adapterPath) continue;
  let src = read(f);
  if (!src) continue;

  const before = src;

  // Static imports: from "...BeatBus[.js|.ts|.mjs]"
  src = src.replace(/from\s+(['"])[^'"]*BeatBus(?:\.(?:m?js|ts))?\1/g, `from "${adapterAlias}"`);

  // Dynamic imports: import("...BeatBus[.js|.ts|.mjs]")
  src = src.replace(/import\(\s*(['"])[^'"]*BeatBus(?:\.(?:m?js|ts))?\1\s*\)/g, `import("${adapterAlias}")`);

  if (src !== before) {
    write(f, src);
    patched++;
    console.log('🔧 patched', path.relative(root, f));
  }
}

console.log(`\nSummary:
  Files scanned : ${files.length}
  Files patched : ${patched}
  Adapter       : ${path.relative(root, adapterPath)}
`);

console.log('Next: npm run dev, then in DevTools run:');
console.log('  CANON_BEATBUS?.on && console.log("BeatBus OK");');
