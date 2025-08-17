#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const file = path.join(root, 'src/modules/orchestration/core/BeatBusAdapter.js');

const code = `// Auto-generated BeatBusAdapter (singleton-safe)
// - default export: a single bus instance with .on/.off/.emit
// - named exports: { bus } same instance, { BeatBusClass } constructor if available
// - guarantees one global instance even with dynamic imports
import * as Beat from './BeatBus.js';

function createFallback(){
  class Fallback {
    constructor(){ this._t = new Map(); }
    on(type, fn){ const arr=this._t.get(type)||[]; arr.push(fn); this._t.set(type, arr); return ()=>this.off(type,fn); }
    off(type, fn){ const arr=this._t.get(type)||[]; const i=arr.indexOf(fn); if(i>-1){arr.splice(i,1);} this._t.set(type, arr); }
    emit(type, payload){ (this._t.get(type)||[]).forEach(fn=>{ try{ fn(payload); } catch(e){ console.error('[BeatBus]', e); } }); }
  }
  return new Fallback();
}

// Resolve constructor if module exports a class somewhere
let BeatBusCtor = null;
if (Beat && typeof Beat.default === 'function')         BeatBusCtor = Beat.default;
else if (typeof Beat.BeatBus === 'function')            BeatBusCtor = Beat.BeatBus;
else if (typeof Beat.BeatBusClass === 'function')       BeatBusCtor = Beat.BeatBusClass;

let instance = null;

// Prefer a module-exported instance if present
if (Beat && Beat.default && typeof Beat.default.on === 'function') {
  instance = Beat.default;
}

// Otherwise reuse/create a singleton
if (!instance) {
  instance = globalThis.__CANON_BEATBUS__ || (BeatBusCtor ? new BeatBusCtor() : createFallback());
}

globalThis.__CANON_BEATBUS__ = instance;
// Handy alias for quick DevTools checks
globalThis.CANON_BEATBUS = instance;

export default instance;
export const bus = instance;
export { BeatBusCtor as BeatBusClass };
`;

function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive:true }); }
ensureDir(path.dirname(file));
if (fs.existsSync(file) && !fs.existsSync(file + '.bak')) fs.copyFileSync(file, file + '.bak');
fs.writeFileSync(file, code, 'utf8');

console.log('✍️  wrote', path.relative(root, file));
console.log('✅ Fixed duplicate identifier and ensured singleton export.');
console.log('Next: npm run dev, then in DevTools run: CANON_BEATBUS && typeof CANON_BEATBUS.on === "function"');
