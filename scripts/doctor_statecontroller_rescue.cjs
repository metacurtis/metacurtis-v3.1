#!/usr/bin/env node
/**
 * doctor_statecontroller_rescue.cjs
 * Hard-restore src/state/StateController.js to a canonical, brace-balanced version.
 * - Idempotent (writes only if different)
 * - Creates .bak once
 * - Snapshots to snapshots/doctor_statecontroller_rescue_<ISO>/
 * - Supports --commit and --no-verify
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const FILE = 'src/state/StateController.js';
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_statecontroller_rescue_${NOW}`);

const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = (()=> {
  const i = process.argv.indexOf('--message');
  return (i>0 && process.argv[i+1]) ? process.argv[i+1]
    : 'chore(dev): restore StateController — canonical events + balanced syntax';
})();

function ex(f){ return fs.existsSync(f); }
function rd(f){ return fs.readFileSync(f, 'utf8'); }
function wr(f,s){ fs.writeFileSync(f, s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(d, {recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if (!ex(bak)) { fs.copyFileSync(f, bak); console.log('· backup', bak); } }

if (!ex(FILE)) {
  console.error('! missing', FILE, '— update path in doctor if necessary');
  process.exit(1);
}

const CANON = `// StateController — single source of truth (stage/quality/clock)
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
let _t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

const _ring = [];
function _log(e, p) {
  _ring.push({ t: Date.now(), e, p });
  if (_ring.length > 120) _ring.shift();
}
function _emit(e, p) {
  _log(e, p);
  try {
    BeatBus.emit(e, p);
  } catch (err) {
    console.error('[StateController.emit]', err);
  }
}

function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });
}
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier });
}
function startClock(){
  if (_clockId) return;
  _t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  _clockId = setInterval(() => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
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

const orig = rd(FILE);
if (orig.trim() === CANON.trim()){
  console.log('· no-op (already canonical)');
  process.exit(0);
}

// backup once and write
backupOnce(FILE);
wr(FILE, CANON);

// snapshot
ensureDir(SNAP);
fs.writeFileSync(path.join(SNAP, 'StateController.js.txt'), CANON, 'utf8');
console.log('· restored', FILE);

// optional git commit (allow husky bypass with --no-verify)
if (DO_COMMIT){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_statecontroller_rescue_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  } catch (e) {
    console.warn('! git failed:', e?.message || e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}
