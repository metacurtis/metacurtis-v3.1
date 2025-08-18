#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/**
 * State Core Bootstrap (idempotent)
 * Creates: BeatBusAdapter, StateController, theater events, EventController,
 * and a safe TheaterDirector starter. Patches src/main.jsx with a dev-only loader.
 */

const fs = require('fs');
const path = require('path');
const root = process.cwd();
const P = (...x) => path.join(root, ...x);

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}
function writeOnce(p, s) {
  ensureDir(p);
  if (fs.existsSync(p)) {
    const cur = fs.readFileSync(p, 'utf8');
    if (cur === s) return { wrote: false, reason: 'up-to-date' };
    if (!fs.existsSync(p + '.bak')) fs.writeFileSync(p + '.bak', cur, 'utf8');
  }
  fs.writeFileSync(p, s, 'utf8');
  return { wrote: true };
}
function upsertPackageScripts(newScripts) {
  const pkgPath = P('package.json');
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  let changed = false;
  for (const [k, v] of Object.entries(newScripts)) {
    if (pkg.scripts[k] !== v) { pkg.scripts[k] = v; changed = true; }
  }
  if (changed) {
    if (!fs.existsSync(pkgPath + '.bak')) fs.writeFileSync(pkgPath + '.bak', JSON.stringify(pkg, null, 2), 'utf8');
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
  return changed;
}

/* ---------------- files ---------------- */

const beatBusAdapterPath = P('src/modules/orchestration/core/BeatBusAdapter.js');
const beatBusAdapterCode = `// Auto-generated BeatBusAdapter (singleton-safe)
import * as Beat from './BeatBus.js';

function createFallback(){
  const listeners = new Map();
  const ring = []; const RING_MAX = 100;
  function on(type, fn){ const arr=listeners.get(type)||[]; arr.push(fn); listeners.set(type, arr); return ()=>off(type,fn); }
  function off(type, fn){ const arr=listeners.get(type)||[]; const i=arr.indexOf(fn); if(i>-1) arr.splice(i,1); listeners.set(type, arr); }
  function emit(type, payload){ ring.push({ t: Date.now(), type, payload }); if(ring.length>RING_MAX) ring.shift(); (listeners.get(type)||[]).forEach(fn=>{ try{fn(payload);}catch(e){console.error('[BeatBus]', e);} }); }
  function once(type, fn){ const offOnce = on(type, p=>{ try{fn(p);} finally{ offOnce(); } }); return offOnce; }
  const dbg = { getEventLog: () => ring.slice(), getListenerMap: () => Object.fromEntries([...listeners.entries()].map(([k,v])=>[k, v.length])) };
  return { on, off, once, emit, __debug: dbg };
}

let instance = null; let Ctor = null;
if (Beat && typeof Beat.default === 'object' && typeof Beat.default.on === 'function') {
  instance = Beat.default;
} else {
  if (typeof Beat.default === 'function') Ctor = Beat.default;
  else if (typeof Beat.BeatBus === 'function') Ctor = Beat.BeatBus;
  else if (typeof Beat.BeatBusClass === 'function') Ctor = Beat.BeatBusClass;
  instance = globalThis.__CANON_BEATBUS__ || (Ctor ? new Ctor() : createFallback());
}
globalThis.__CANON_BEATBUS__ = instance;
if (typeof window !== 'undefined') window.CANON_BEATBUS = instance;
export default instance;
export const bus = instance;
`;

const stateControllerPath = P('src/state/StateController.js');
const stateControllerCode = `import BeatBus from '../modules/orchestration/core/BeatBusAdapter.js';
export const EVENTS = Object.freeze({
  STAGE_CHANGE:'STAGE_CHANGE', QUALITY_CHANGE:'QUALITY_CHANGE',
  BLUEPRINT_READY:'BLUEPRINT_READY', OPENING_COMPLETE:'OPENING_COMPLETE',
  STATE_CHANGED:'STATE_CHANGED',
});
let _stage='genesis', _quality='HIGH', _clock={running:false,start:0,elapsed:0};
const snapshot=()=>({ stage:_stage, quality:_quality, clock:{..._clock} });
function setStage(name){ if(!name||name===_stage) return; const prev=_stage; _stage=name; BeatBus.emit(EVENTS.STAGE_CHANGE,{stage:name,prev}); BeatBus.emit(EVENTS.STATE_CHANGED,snapshot()); }
function setQuality(tier){ if(!tier||tier===_quality) return; const prev=_quality; _quality=tier; BeatBus.emit(EVENTS.QUALITY_CHANGE,{tier,prev}); BeatBus.emit(EVENTS.STATE_CHANGED,snapshot()); }
function startClock(){ if(_clock.running) return; _clock.running=true; _clock.start=performance.now(); const tick=()=>{ if(!_clock.running) return; _clock.elapsed=performance.now()-_clock.start; requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
function stopClock(){ _clock.running=false; }
function batch(fn){ fn?.(); BeatBus.emit(EVENTS.STATE_CHANGED, snapshot()); }
const StateController={ EVENTS, getStage:()=>_stage, getQuality:()=>_quality, getClock:()=>({..._clock}), setStage, setQuality, startClock, stopClock, batch };
if(typeof window!=='undefined') window.StateController = StateController;
export default StateController;
`;

const theaterEventsPath = P('src/theater/events.js');
const theaterEventsCode = `export const EVENTS = Object.freeze({
  CURSOR_SHOW:'CURSOR_SHOW', CURSOR_BLINK:'CURSOR_BLINK', TERMINAL_TYPE:'TERMINAL_TYPE', SCREEN_FILL:'SCREEN_FILL',
  AUDIO_COMPUTER_HUM:'AUDIO_COMPUTER_HUM', AUDIO_KEY_CLICK:'AUDIO_KEY_CLICK',
  PREWARM_GENESIS_BLUEPRINT:'PREWARM_GENESIS_BLUEPRINT', PREWARM_COMPLETE:'PREWARM_COMPLETE',
  BUILD_EMERGENCE_BLUEPRINT:'BUILD_EMERGENCE_BLUEPRINT', PARTICLES_START_EMERGING:'PARTICLES_START_EMERGING', PARTICLES_EMERGED:'PARTICLES_EMERGED',
  AUDIO_START_STAGE:'AUDIO_START_STAGE', START_NARRATIVE:'START_NARRATIVE', ENABLE_SCROLL:'ENABLE_SCROLL',
  DIRECTOR_CANCEL:'DIRECTOR_CANCEL',
});
`;

const eventControllerPath = P('src/theater/EventController.js');
const eventControllerCode = `import BeatBus from '../modules/orchestration/core/BeatBusAdapter.js';
import StateController from '../state/StateController.js';
import { EVENTS as THEATER } from './events.js';

let installed=false; const cleanup=[];
function onKeyDown(e){
  const k=e.key;
  if(/^[1-7]$/.test(k)){ const idx=Number(k)-1; const stages=['genesis','discipline','neural','velocity','architecture','harmony','transcendence']; StateController.setStage(stages[idx]||'genesis'); return; }
  if(k==='q') StateController.setQuality('LOW');
  if(k==='w') StateController.setQuality('MEDIUM');
  if(k==='e') StateController.setQuality('HIGH');
  if(k==='r') StateController.setQuality('ULTRA');
  if(k==='Escape') BeatBus.emit(THEATER.DIRECTOR_CANCEL);
}
export function install(){
  if(installed) return ()=>{};
  installed=true;
  const down=(ev)=>onKeyDown(ev); window.addEventListener('keydown', down); cleanup.push(()=>window.removeEventListener('keydown', down));
  const unlock=()=>{ BeatBus.emit(THEATER.AUDIO_KEY_CLICK); window.removeEventListener('pointerdown', unlock); }; window.addEventListener('pointerdown', unlock); cleanup.push(()=>window.removeEventListener('pointerdown', unlock));
  console.log('🎮 EventController installed'); return ()=>{ cleanup.splice(0).forEach(fn=>fn()); installed=false; };
}
export default { install };
`;

const theaterDirectorPath = P('src/theater/TheaterDirector.js');
const theaterDirectorCode = `import BeatBus from '../modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as THEATER } from './events.js';
let _running=false, _hasRun=false, _cancelled=false;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
export async function start(){
  if(_running){ console.log('🎬 Director: already running'); return; }
  _running=true; _cancelled=false; console.log('🎬 Director: Starting SST opening');
  try{
    BeatBus.emit(THEATER.PREWARM_GENESIS_BLUEPRINT);
    await sleep(300);
    BeatBus.emit(THEATER.CURSOR_SHOW); await sleep(500);
    BeatBus.emit(THEATER.CURSOR_BLINK,{count:2,interval:500}); await sleep(2500);
    BeatBus.emit(THEATER.TERMINAL_TYPE,{lines:['READY.','10 PRINT "HELLO CURTIS"','20 GOTO 10','RUN'],typeSpeed:100,lineDelay:500});
    for(let i=0;i<4;i++){ await sleep(400); BeatBus.emit(THEATER.AUDIO_KEY_CLICK); }
    await sleep(2000);
    BeatBus.emit(THEATER.SCREEN_FILL,{text:'HELLO CURTIS ',scrollSpeed:50}); await sleep(1200);
    BeatBus.emit(THEATER.BUILD_EMERGENCE_BLUEPRINT,{sourceText:'HELLO CURTIS',count:2000});
    await sleep(400); BeatBus.emit(THEATER.PARTICLES_START_EMERGING); await sleep(2500);
    BeatBus.emit(THEATER.AUDIO_START_STAGE,{stage:'genesis'}); BeatBus.emit(THEATER.START_NARRATIVE,{stage:'genesis'}); BeatBus.emit(THEATER.ENABLE_SCROLL);
    _hasRun=true; console.log('🎬 Director: Opening complete → user-driven');
  }catch(e){ console.error('Director error', e); } finally{ _running=false; }
}
export function cancel(){ if(_running){ _cancelled=true; BeatBus.emit(THEATER.DIRECTOR_CANCEL); } }
export function status(){ return { running:_running, cancelled:_cancelled, hasRun:_hasRun }; }
if(typeof window!=='undefined') window.theaterDirector = { start, cancel, status };
export default { start, cancel, status };
`;

const mainPath = P('src/main.jsx');
const devInject = `
// --- State Core dev bootstrap (idempotent) ---
if (import.meta?.env?.DEV && !window.__STATE_CORE_BOOTSTRAPPED__) {
  window.__STATE_CORE_BOOTSTRAPPED__ = true;
  import('./modules/orchestration/core/BeatBusAdapter.js');
  import('./state/StateController.js');
  import('./theater/events.js');
  import('./theater/EventController.js').then(m => m?.install && m.install());
  import('./theater/TheaterDirector.js').then(m => m?.start && m.start());
  console.log('🧩 State Core dev bootstrap loaded');
}
`;

/* --------------- write files --------------- */

const results = [];
results.push({ file: path.relative(root, beatBusAdapterPath), ...writeOnce(beatBusAdapterPath, beatBusAdapterCode) });
results.push({ file: path.relative(root, stateControllerPath), ...writeOnce(stateControllerPath, stateControllerCode) });
results.push({ file: path.relative(root, theaterEventsPath), ...writeOnce(theaterEventsPath, theaterEventsCode) });
results.push({ file: path.relative(root, eventControllerPath), ...writeOnce(eventControllerPath, eventControllerCode) });
if (!fs.existsSync(theaterDirectorPath)) {
  results.push({ file: path.relative(root, theaterDirectorPath), ...writeOnce(theaterDirectorPath, theaterDirectorCode) });
} else {
  results.push({ file: path.relative(root, theaterDirectorPath), wrote:false, reason:'kept existing TheaterDirector.js' });
}

/* --------------- patch main.jsx --------------- */

let patchedMain = false;
if (fs.existsSync(mainPath)) {
  const cur = fs.readFileSync(mainPath, 'utf8');
  if (!/__STATE_CORE_BOOTSTRAPPED__/.test(cur)) {
    if (!fs.existsSync(mainPath + '.bak')) fs.writeFileSync(mainPath + '.bak', cur, 'utf8');
    fs.writeFileSync(mainPath, cur.trimEnd() + '\n\n' + devInject + '\n', 'utf8');
    patchedMain = true;
  }
}

/* --------------- package scripts --------------- */

const scriptsChanged = upsertPackageScripts({
  'state:bootstrap': 'node scripts/state-core-bootstrap.cjs',
  'state:verify': 'node -e "[' +
    ['src/modules/orchestration/core/BeatBusAdapter.js','src/state/StateController.js','src/theater/events.js','src/theater/EventController.js']
      .map(s=>`'${s}'`).join(',') +
  '].forEach(f=>console.log((require(\'fs\').existsSync(f)?\'✓\':\'✗\'), f))"',
});

/* --------------- output --------------- */

console.log('▸ State Core Bootstrap');
for (const r of results) {
  if (r.wrote) console.log('  ✍️  wrote', r.file);
  else console.log('  ✓  ', r.file, r.reason ? `(${r.reason})` : '(up-to-date)');
}
if (patchedMain) console.log('  ✍️  patched src/main.jsx (dev bootstrap)');
else console.log('  ✓   src/main.jsx (dev bootstrap already present or file missing)');

if (scriptsChanged) console.log('  ✍️  package.json (scripts updated)');
else console.log('  ✓   package.json scripts (up-to-date)');

console.log('\n✅ Done.\nNext:');
console.log('  • npm run dev');
console.log('  • Open the BROWSER DevTools console (not bash) and try:');
console.log('      typeof CANON_BEATBUS?.on === "function"');
console.log('      StateController.getStage(), StateController.setStage(\\"neural\\")');
console.log('      theaterDirector?.status()');
