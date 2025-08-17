#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const SRC_DIRS = ['src', 'canon-console']; // scan both
const exts = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs']);

function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(e))) out.push(p);
  }
  return out;
}
function backupOnce(p){ const b=p+'.bak'; if(!fs.existsSync(b)) fs.copyFileSync(p,b); }
function write(p, s){ const d=path.dirname(p); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); fs.writeFileSync(p,s,'utf8'); }

// 1) Ensure adapter exists and is singleton-safe
const adapterPath = path.join(root,'src/modules/orchestration/core/BeatBusAdapter.js');
const adapterCode = `// Auto-generated BeatBusAdapter (singleton-safe)
import * as Beat from './BeatBus.js';

function createFallback(){
  class Fallback {
    constructor(){ this._t=new Map(); }
    on(t,fn){ const a=this._t.get(t)||[]; a.push(fn); this._t.set(t,a); return ()=>this.off(t,fn); }
    off(t,fn){ const a=this._t.get(t)||[]; const i=a.indexOf(fn); if(i>-1)a.splice(i,1); this._t.set(t,a); }
    emit(t,p){ (this._t.get(t)||[]).forEach(f=>{ try{f(p);}catch(e){console.error('[BeatBus]',e);} }); }
  }
  return new Fallback();
}

let BeatBusCtor = null;
if (Beat && typeof Beat.default === 'function') BeatBusCtor = Beat.default;
else if (typeof Beat.BeatBus === 'function') BeatBusCtor = Beat.BeatBus;
else if (typeof Beat.BeatBusClass === 'function') BeatBusCtor = Beat.BeatBusClass;

let instance = null;
if (Beat && Beat.default && typeof Beat.default.on === 'function') {
  instance = Beat.default;
}
if (!instance) {
  instance = globalThis.__CANON_BEATBUS__ || (BeatBusCtor ? new BeatBusCtor() : createFallback());
}
globalThis.__CANON_BEATBUS__ = instance;
globalThis.CANON_BEATBUS = instance;

export default instance;
export const bus = instance;
export { BeatBusCtor as BeatBusClass };
`;
if (fs.existsSync(adapterPath)) backupOnce(adapterPath);
write(adapterPath, adapterCode);

// 2) Codemod: point all imports to the adapter + ensure default (instance) import
const files = SRC_DIRS.flatMap(d=>walk(path.join(root,d)));
let changed=0, converted=0, dyn=0;

for (const f of files) {
  let txt = fs.readFileSync(f,'utf8');
  const before = txt;

  // (a) Replace any ".../BeatBus.js" path (static or dynamic) with ".../BeatBusAdapter.js"
  txt = txt.replace(/(['"])([^'"]*\/BeatBus\.js)\1/g, (_m,q,p) => {
    return q + p.replace(/BeatBus\.js$/, 'BeatBusAdapter.js') + q;
  });

  // (b) Ensure default import (instance), not namespace/named
  // import * as BeatBus from '...BeatBusAdapter.js'
  txt = txt.replace(/import\s*\*\s*as\s*BeatBus\s*from\s*(['"])([^'"]*BeatBusAdapter\.js)\1/g,
                    'import BeatBus from $1$2$1');

  // import { BeatBus } from '...BeatBusAdapter.js'
  txt = txt.replace(/import\s*\{\s*BeatBus\s*\}\s*from\s*(['"])([^'"]*BeatBusAdapter\.js)\1/g,
                    'import BeatBus from $1$2$1');

  // (c) Dynamic import destructure → default instance
  // const { BeatBus } = await import('...BeatBusAdapter.js')
  txt = txt.replace(/const\s*\{\s*BeatBus\s*\}\s*=\s*await\s*import\((['"])([^'"]*BeatBusAdapter\.js)\1\)/g,
                    'const BeatBus = (await import($1$2$1)).default');

  // const BeatBus = await import('...BeatBusAdapter.js')  → .default
  txt = txt.replace(/const\s+BeatBus\s*=\s*await\s*import\((['"])([^'"]*BeatBusAdapter\.js)\1\)/g,
                    'const BeatBus = (await import($1$2$1)).default');

  if (txt !== before) {
    backupOnce(f);
    fs.writeFileSync(f, txt, 'utf8');
    changed++;
    if (/BeatBusAdapter\.js/.test(txt)) converted++;
    if (/await\s*import\(/.test(txt)) dyn++;
  }
}

// 3) Friendly summary
console.log('▸ BeatBus fix applied.');
console.log('  Adapter        :', path.relative(root, adapterPath));
console.log('  Files changed  :', changed);
console.log('  With adapter   :', converted);
console.log('  Dynamic imports:', dyn);
console.log('\nNext: restart dev server, then in DevTools run:');
console.log("  typeof CANON_BEATBUS?.on === 'function'  // should be true");
