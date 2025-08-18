#!/usr/bin/env node
'use strict';
/**
 * state-core-sync.cjs
 * One-touch: installs StateController (sole writer), bridges it into TheaterDirector,
 * adds dev helpers, scripts, and a quick verify. Idempotent with .bak backups.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const P = (...x)=>path.join(root, ...x);
const read = (p)=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;
const ensureDir = (d)=>{ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backupOnce = (p)=>{ if(fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p,p+'.bak'); };
const write = (p, s)=>{ ensureDir(path.dirname(p)); if(fs.existsSync(p)) backupOnce(p); fs.writeFileSync(p,s,'utf8'); };

let changed = [];

/* 1) Create/refresh StateController (sole writer) */
const stateFile = P('src/state/StateController.js');
const stateCode = `// StateController — single source of truth (stage/quality/clock)
// Emits canonical events onto BeatBus; no React or WebGL imports here.
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';

export const EVENTS = {
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  STATE_CHANGED: 'STATE_CHANGED',
  BLUEPRINT_READY: 'BLUEPRINT_READY',   // pass-through convenience
  OPENING_COMPLETE: 'OPENING_COMPLETE', // for completeness
};

let _stage = 'opening';
let _quality = 'HIGH';
let _clockId = null;
let _t0 = (typeof performance!=='undefined'?performance.now():Date.now());

const _ring = [];
function _log(e,p){ _ring.push({ t: Date.now(), e, p }); if (_ring.length>120) _ring.shift(); }
function _emit(e,p){ _log(e,p); try { BeatBus.emit(e,p); } catch(err){ console.error('[StateController.emit]', err); } }

function setStage(name){
  if (!name || name===_stage) return;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { stage:_stage, quality:_quality });
}
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { stage:_stage, quality:_quality });
}
function startClock(){
  if (_clockId) return;
  _t0 = (typeof performance!=='undefined'?performance.now():Date.now());
  _clockId = setInterval(()=> {
    const now = (typeof performance!=='undefined'?performance.now():Date.now());
    _emit(EVENTS.STATE_CHANGED, { now, since: now-_t0, stage:_stage, quality:_quality });
  }, 500);
}
function stopClock(){ if (_clockId){ clearInterval(_clockId); _clockId=null; } }

const api = {
  getStage: ()=>_stage,
  getQuality: ()=>_quality,
  getClock: ()=>({ running: !!_clockId, startedAt:_t0 }),
  setStage, setQuality, startClock, stopClock,
  batch(fn){ try{ fn && fn(api); _emit(EVENTS.STATE_CHANGED, { stage:_stage, quality:_quality, batched:true }); }catch(e){ console.error('[StateController.batch]', e); } }
};

if (typeof window !== 'undefined') {
  window.stateControls = {
    ...api, EVENTS,
    debug:{ getLog(){ return _ring.slice(); } }
  };
}

export default api;
`;

(function ensureStateController(){
  const cur = read(stateFile);
  if (cur !== stateCode) {
    write(stateFile, stateCode);
    changed.push(`✍️  wrote ${path.relative(root, stateFile)}`);
  } else {
    changed.push(`✓ up-to-date ${path.relative(root, stateFile)}`);
  }
})();

/* 2) Patch TheaterDirector to use StateController for stages */
const dirFile = P('src/theater/TheaterDirector.js');
(function patchDirector(){
  const src = read(dirFile);
  if (!src) { changed.push(`⚠️  missing ${path.relative(root, dirFile)} (skip patch)`); return; }

  let txt = src;
  let mutated = false;

  // (a) Ensure import
  if (!/from\s+['"]@\/state\/StateController\.js['"]/.test(txt)) {
    txt = txt.replace(/(\n\s*import\s+[^;]+;\s*)+/, m => 
      `${m}import StateController, { EVENTS as STATE_EVENTS } from '@/state/StateController.js';\n`
    );
    mutated = true;
  }

  // (b) On start(): set opening + start clock
  if (/this\.phase\s*=\s*'starting';/.test(txt) && !/StateController\.setStage\('opening'\)/.test(txt)) {
    txt = txt.replace(/this\.phase\s*=\s*'starting';/, 
      "this.phase = 'starting';\n    // State core: declare opening + start clock\n    try { StateController.setStage('opening'); StateController.startClock(); } catch {}"
    );
    mutated = true;
  }

  // (c) When entering genesis, set stage
  if (/this\.phase\s*=\s*'genesis';/.test(txt) && !/StateController\.setStage\('genesis'\)/.test(txt)) {
    txt = txt.replace(/this\.phase\s*=\s*'genesis';/, 
      "this.phase = 'genesis';\n      try { StateController.setStage('genesis'); } catch {}"
    );
    mutated = true;
  }

  if (mutated && txt !== src) {
    write(dirFile, txt);
    changed.push(`✍️  patched ${path.relative(root, dirFile)} (StateController stage hooks)`);
  } else {
    changed.push(`✓ ${path.relative(root, dirFile)} already has StateController hooks`);
  }
})();

/* 3) Add NPM scripts + tiny verify */
(function patchPackageJson(){
  const pkgFile = P('package.json');
  const pkg = JSON.parse(read(pkgFile) || '{}');
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts['state:sync'])  pkg.scripts['state:sync']  = 'node scripts/state-core-sync.cjs';
  if (!pkg.scripts['state:verify']) pkg.scripts['state:verify']= 'node scripts/state-core-sync.cjs --verify';
  write(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
  changed.push('✍️  updated package.json (scripts: state:sync, state:verify)');
})();

/* 4) Optional snapshot (helps diff) */
(function snapshot(){
  const snapDir = P('snapshots', `state-core_${new Date().toISOString().replace(/[:.]/g,'-')}`);
  ensureDir(snapDir);
  const keep = [
    'src/state/StateController.js',
    'src/theater/TheaterDirector.js',
    'src/engine/ConsciousnessEngine.js',
    'src/components/webgl/WebGLBackground.jsx',
    'src/main.jsx',
    'package.json'
  ];
  keep.forEach(f=>{
    const p = P(f);
    if (fs.existsSync(p)) {
      const out = P(snapDir, f.replace(/\//g,'__') + '.txt');
      ensureDir(path.dirname(out));
      fs.writeFileSync(out, fs.readFileSync(p,'utf8'));
    }
  });
  changed.push(`📄 snapshot → ${path.relative(root, snapDir)}`);
})();

/* 5) Verify mode */
function verify(){
  let ok = true;
  try {
    const sc = require(P('src/state/StateController.js'));
    if (!('default' in sc) || !('EVENTS' in sc)) { ok=false; console.error('✖ StateController exports missing'); }
  } catch(e) { ok=false; console.error('✖ StateController load error:', e.message); }

  try {
    const td = fs.readFileSync(P('src/theater/TheaterDirector.js'),'utf8');
    if (!/StateController\.setStage\('opening'\)/.test(td)) { ok=false; console.error('✖ Director missing opening setStage'); }
    if (!/StateController\.setStage\('genesis'\)/.test(td)) { ok=false; console.error('✖ Director missing genesis setStage'); }
  } catch(e){ ok=false; console.error('✖ TheaterDirector read error:', e.message); }

  if (ok) console.log('✅ state-core verify passed.');
  else process.exitCode = 1;
}

/* 6) Commit/tag (opt-in) */
function maybeCommit(){
  const msg = 'feat(state-core): single writer + Director hooks (SST v3.0)';
  try {
    cp.execSync('git add -A', {stdio:'pipe'});
    cp.execSync(`git commit -m "${msg}"`, {stdio:'pipe'});
  } catch { /* ignore (clean tree or hooks) */ }
  const tag = `state-core_sync_${new Date().toISOString().replace(/[:.]/g,'-')}`;
  try { cp.execSync(`git tag ${tag}`, {stdio:'pipe'}); } catch {}
  console.log(`✅ committed and tagged: ${tag}`);
}

/* CLI */
const argv = new Set(process.argv.slice(2));
changed.forEach(l=>console.log(l));
if (argv.has('--verify')) verify();
if (argv.has('--commit')) maybeCommit();

console.log('\nNext:\n  • npm run dev\n  • In DevTools:');
console.log("    stateControls.getStage(), stateControls.setStage('genesis'), stateControls.setQuality('HIGH')");
console.log("    beatBusDebug?.getEventLog?.()");
