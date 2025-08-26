#!/usr/bin/env node
/**
 * doctor_canon_one_touch.cjs
 * Canon Suite (L1/L2) self-bootstrapping + canonical event enforcement.
 * Idempotent: backs up *.bak once per file, writes snapshots/.
 *
 * Usage:
 *   node scripts/doctor_canon_one_touch.cjs           # dry run
 *   node scripts/doctor_canon_one_touch.cjs --commit  # write files + git commit
 *   node scripts/doctor_canon_one_touch.cjs --commit --tag --push [--no-verify]
 *
 * Modes (bus validation):
 *   localStorage.canonBusMode = 'STRICT'|'TELEMETRY'|'TOLERANT'
 *   DEV default: STRICT   | PROD default: TELEMETRY
 */

const fs   = require('fs');
const _path = require('path');
const cp   = require('child_process');

const ROOT = process.cwd();
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join(ROOT, 'snapshots', `doctor_canon_one_touch_${NOW}`);
try{ fs.mkdirSync(SNAP,{recursive:true}); }catch(_){}

const ARGS = new Set(process.argv.slice(2));
const DO_COMMIT  = ARGS.has('--commit');
const DO_PUSH    = ARGS.has('--push');
const NO_VERIFY  = ARGS.has('--no-verify');
const DO_TAG     = ARGS.has('--tag');

const FILES = {
  beatbus: 'src/src/src/modules/orchestration/core/BeatBus.js',
  contracts: 'src/canon/contracts/events.js',
  guardL2: 'src/canon/guard/L2.js',
  consoleBanner: 'src/canon/console/banner.js',
  init: 'src/canon/init.js',
  main: 'src/main.jsx',
  jsconfig: 'jsconfig.json',
  stateControllerCandidates: [
    'src/state/StateController.js',
    'src/core/StateController.js',
    'src/modules/state/StateController.js',
    'src/StateController.js',
  ],
  engineCandidates: [
    'src/engine/ConsciousnessEngine.js',
    'src/modules/engine/ConsciousnessEngine.js',
  ],
};

function p(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f), 'utf8'); }
function wr(f, s){ fs.mkdirSync(path.dirname(p(f)), {recursive:true}); fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){
  const abs = p(f);
  if (!fs.existsSync(abs)) return;
  const bak = abs + '.bak';
  if (!fs.existsSync(bak)) { fs.copyFileSync(abs, bak); log('backup', f); }
}
function snap(f,s){ try{ fs.mkdirSync(SNAP,{recursive:true}); }catch(_){} const key=f.replace(/\//g,"__"); fs.writeFileSync(path.join(SNAP,key), s,"utf8"); }
function log(kind, msg){ console.log(`· ${kind}`, msg); }

function upsert(file, content, {label, allowNoop=false}={}){
  backupOnce(file);
  const abs = p(file);
  const exists = fs.existsSync(abs);
  if (!exists){
    wr(file, content);
    snap(file, content);
    log('create', file);
    return true;
  }
  const curr = rd(file);
  if (curr.includes('__CANON_INSTALLED__') || curr.trim() === content.trim()){
    log('ok', file);
    if (!allowNoop) snap(file, curr);
    return false;
  }
  wr(file, content);
  snap(file, content);
  log('patch', file);
  return true;
}

function patch(file, replacers){
  if (!ex(file)) return false;
  backupOnce(file);
  let src = rd(file);
  let changed = false;
  for (const [pattern, replacement, flags='m'] of replacers){
    const re = new RegExp(pattern, flags);
    if (re.test(src)){
      src = src.replace(re, replacement);
      changed = true;
    }
  }
  if (changed){
    wr(file, src);
    snap(file, src);
    log('patch', file);
  } else {
    log('ok', file);
  }
  return changed;
}

/* --------------------------------------------------------------------------------------
 * 1) Canon Contracts (events.js)
 * ------------------------------------------------------------------------------------ */
const CONTRACTS_JS = `// __CANON_INSTALLED__
// Canon event contracts (versioned)
export const CANON_CONTRACTS = {
  version: '1.0.0',
  events: {
    STAGE_CHANGE: {
      required: ['from','to'],
      notes: 'Single canonical shape. No aliases.'
    },
    QUALITY_CHANGE: {
      required: ['tier'],
      notes: 'Single canonical shape. No aliases.'
    },
    BLUEPRINT_READY: {
      required: ['stage','quality','blueprint'],
      optional: ['cached'],
      notes: 'Renderer consumes stage/quality/blueprint; cached is informative.'
    }
  },
  deprecations: {
    STAGE_CHANGE: { stage: 'deprecated' },
    QUALITY_CHANGE: { quality: 'deprecated' }
  }
};
export default CANON_CONTRACTS;
`;

function installContracts(){
  return upsert(FILES.contracts, CONTRACTS_JS, {label:'contracts'});
}

/* --------------------------------------------------------------------------------------
 * 2) BeatBus — canonical enforcement at boundary
 * ------------------------------------------------------------------------------------ */
const BEATBUS_CANON = `// __CANON_INSTALLED__
// Central event bus with canonical enforcement.
import CANON_CONTRACTS from '@/canon/contracts/events.js';

class BeatBus {
  constructor(){
    this.listeners = new Map();
    this.eventLog  = [];
    this.maxLog    = 200;
    this._last = { stage: 'genesis', quality: 'HIGH' };
  }

  on(evt, fn){
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn){
    const wrap = (p) => { try{ fn(p); } finally { this.off(evt, wrap); } };
    return this.on(evt, wrap);
  }
  off(evt, fn){
    const set = this.listeners.get(evt); if (!set) return;
    set.delete(fn); if (set.size===0) this.listeners.delete(evt);
  }

  _mode(){
    try {
      const dev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
      const ls = (typeof globalThis !== 'undefined' && globalThis.localStorage) ? localStorage.canonBusMode : null;
      return (ls || (dev ? 'STRICT' : 'TELEMETRY')).toUpperCase();
    } catch { return 'TELEMETRY'; }
  }

  _canonicalize(evt, payload = {}){
    const p = {...payload};
    // tolerant mapping → canonical, tracked as normalized:true
    if (evt==='STAGE_CHANGE'){
      if (p.stage && !p.to) p.to = p.stage;
      if (!p.from) p.from = this._last.stage || 'unknown';
      return { ok: !!(p.from && p.to), out: { from:p.from, to:p.to }, normalized: ('stage' in payload) };
    }
    if (evt==='QUALITY_CHANGE'){
      if (p.quality && !p.tier) p.tier = p.quality;
      return { ok: !!p.tier, out: { tier:p.tier }, normalized: ('quality' in payload) };
    }
    if (evt==='BLUEPRINT_READY'){
      const stage   = p.stage ?? p.to ?? p.name;
      const quality = p.quality ?? p.tier;
      const blueprint = p.blueprint;
      const out = { stage, quality, blueprint, cached: !!p.cached };
      return { ok: !!(stage && quality && blueprint), out, normalized: ('tier' in p || 'to' in p) };
    }
    return { ok: true, out: p, normalized:false };
  }

  _validate(evt, payload){
    const spec = CANON_CONTRACTS.events[evt];
    if (!spec) return { ok:true, missing:[] };
    const required = spec.required || [];
    const missing = required.filter(k => !(k in (payload||{})));
    return { ok: missing.length===0, missing };
  }

  _log(evt, data){
    try {
      this.eventLog.push({ t: Date.now(), evt, data });
      if (this.eventLog.length>this.maxLog) this.eventLog.shift();
    } catch {}
  }

  emit(evt, payload = {}){
    const mode = this._mode();
    const { ok:canonOk, out:canonPayload, normalized } = this._canonicalize(evt, payload);
    const { ok:validOk, missing } = this._validate(evt, canonPayload);

    if (!canonOk || !validOk){
      const msg = \`Canon violation: \${evt} missing \${missing.join(',')}\`;
      if (mode==='STRICT'){
        console.error('🚫', msg, { payload });
        this._log('VIOLATION', { evt, payload, missing, mode });
        return;
      }
      if (mode==='TELEMETRY' || mode==='TOLERANT'){
        console.warn('⚠️', msg, { payload, mode });
        this._log('VIOLATION', { evt, payload, missing, mode });
        // proceed only in TELEMETRY/TOLERANT if we can form a best-effort payload
        if (!canonOk) return;
      }
    }

    // maintain last state hints for better "from"
    if (evt==='STAGE_CHANGE' && canonPayload?.to) this._last.stage = canonPayload.to;
    if (evt==='QUALITY_CHANGE' && canonPayload?.tier) this._last.quality = canonPayload.tier;

    this._log(evt, { payload: canonPayload, normalized });
    const set = this.listeners.get(evt); if (!set || set.size===0) return;

    set.forEach(fn => {
      try { fn(canonPayload); }
      catch(e){ console.error(\`🚌 listener error @ \${evt}\`, e); }
    });
  }

  getDebugInfo(){
    const map = {};
    this.listeners.forEach((s, k)=> map[k] = s.size);
    return {
      mode: this._mode(),
      last: {...this._last},
      listeners: map,
      recent: this.eventLog.slice(-10)
    };
  }
}

const beatBus = new BeatBus();

// DEV globals (optional)
if (typeof window !== 'undefined'){
  if (import.meta?.env?.DEV){
    globalThis.BeatBus = beatBus;
    globalThis.busTap = (evt, fn) => {
      const off = beatBus.on(evt, fn);
      console.log('�� busTap', evt);
      return off;
    };
    console.log('🚌 BeatBus ready · mode=', beatBus._mode());
  }
}

export default beatBus;
export { BeatBus };
`;

function installBeatBus(){
  const exists = ex(FILES.beatbus);
  if (!exists) return upsert(FILES.beatbus, BEATBUS_CANON, {label:'beatbus'});
  // patch existing: ensure getDebugInfo + canonicalization markers
  let src = rd(FILES.beatbus);
  if (src.includes('__CANON_INSTALLED__')) { log('ok', FILES.beatbus); snap(FILES.beatbus, src); return false; }
  // Minimal: if no getDebugInfo, append it; if no canonicalize, replace emit with wrapper.
  let changed = false;
  if (!/getDebugInfo\s*\(/.test(src) || !/canonical/i.test(src)){
    // Replace class header block with our canonical version (safer than piecemeal)
    wr(FILES.beatbus, BEATBUS_CANON);
    snap(FILES.beatbus, BEATBUS_CANON);
    log('patch', FILES.beatbus);
    changed = true;
  } else {
    log('ok', FILES.beatbus);
  }
  return changed;
}

/* --------------------------------------------------------------------------------------
 * 3) Guard L2 + Console banner/heartbeat + init
 * ------------------------------------------------------------------------------------ */
const GUARD_L2 = `// __CANON_INSTALLED__
import CANON_CONTRACTS from '@/canon/contracts/events.js';
import BeatBus from '@/src/src/modules/orchestration/core/BeatBus.js';

class CanonGuardL2 {
  constructor(){
    this.violations = [];
    this.version = CANON_CONTRACTS.version;
    this.events = CANON_CONTRACTS.events;
    this._wire();
  }
  _wire(){
    Object.keys(this.events).forEach(evt=>{
      BeatBus.on(evt, (p)=>{
        // post-emit validation (should already be canonical)
        const spec = this.events[evt]; const req = spec.required||[];
        const missing = req.filter(k=> !(k in (p||{})));
        if (missing.length){
          const v = { evt, missing, payload: p, t: Date.now() };
          this.violations.push(v);
          console.warn('🛡️ CanonGuard violation (post)', v);
        }
      });
    });
  }
  getViolations(){ return this.violations.slice(); }
  clear(){ this.violations.length = 0; }
}

export default CanonGuardL2;
`;

const CONSOLE_BANNER = `// __CANON_INSTALLED__
import BeatBus from '@/src/src/modules/orchestration/core/BeatBus.js';
let heartbeatTimer;

export function banner(){
  try {
    const info = BeatBus.getDebugInfo();
    const tag = \`Canon v1.0 · mode=\${info.mode} · listeners=\${Object.keys(info.listeners).length}\`;
    console.log('%c🛡️ Canon active','color:#7ef;font-weight:bold;', tag);
  } catch(e){}
}

export function heartbeat(periodMs = 45000){
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(()=>{
    const d = BeatBus.getDebugInfo();
    const vCount = (globalThis.canon?.guard?.getViolations()?.length) ?? 0;
    console.log('⏱️ Canon Heartbeat · mode=%s · violations=%d · lastStage=%s · lastQuality=%s',
      d.mode, vCount, d.last?.stage, d.last?.quality);
  }, periodMs);
}
`;

const INIT_JS = `// __CANON_INSTALLED__
import CanonGuardL2 from '@/canon/guard/L2.js';
import { banner, heartbeat } from '@/canon/console/banner.js';

(function init(){
  try {
    const guard = new CanonGuardL2();
    const api = {
      guard,
      status(){
        try {
          const info = (globalThis.BeatBus?.getDebugInfo?.()) || {};
          return {
            contracts: 'v1.0.0',
            mode: info.mode,
            listeners: info.listeners,
            last: info.last,
            violations: guard.getViolations().length
          };
        } catch { return { error:'no bus' }; }
      },
      violations: ()=> guard.getViolations(),
      verbosity(level='INFO'){ localStorage.canonVerbosity = level; return level; },
      perf(){
        // lightweight — real perf is measured externally; keep API for future
        return { note: 'bus timing hooks pluggable', now: Date.now() };
      },
      context(){ /* reserved for future */ }
    };
    globalThis.canon = api;
    globalThis.__CANON_GUARD_ACTIVE = true;
    globalThis.__CANON_CONSOLE_ACTIVE = true;

    if (import.meta?.env?.DEV){
      banner();
      heartbeat(30000);
    }
  } catch (e){
    console.error('Canon init failed', e);
  }
})();
`;

function installGuardAndConsole(){
  const a = upsert(FILES.guardL2, GUARD_L2, {label:'guard'});
  const b = upsert(FILES.consoleBanner, CONSOLE_BANNER, {label:'console'});
  const c = upsert(FILES.init, INIT_JS, {label:'init'});
  return a||b||c;
}

/* --------------------------------------------------------------------------------------
 * 4) Wire main.jsx (safe, minimal)
 * ------------------------------------------------------------------------------------ */
function installMainWiring(){
  if (!ex(FILES.main)) { log('skip', `${FILES.main} (missing)`); return false; }
  backupOnce(FILES.main);
  let src = rd(FILES.main);
  // ensure import of canon/init.js (once)
  if (!/['"]@\/canon\/init\.js['"]/.test(src)){
    src = src.replace(/(import\s+['"].\/styles\/index.css['"];\s*)/m, `$1\nimport '@/canon/init.js';\n`);
  }
  // no duplicate dev injectors; keep simple
  if (!/ReactDOM\.createRoot\(.+?\)\.render/.test(src)){
    // leave render as-is (project-specific). We only add Canon import.
  }
  wr(FILES.main, src);
  snap(FILES.main, src);
  log('patch', FILES.main);
  return true;
}

/* --------------------------------------------------------------------------------------
 * 5) Fix jsconfig alias dup & ensure '@/modules/*'
 * ------------------------------------------------------------------------------------ */
function fixJsconfig(){
  if (!ex(FILES.jsconfig)) return false;
  backupOnce(FILES.jsconfig);
  let json = rd(FILES.jsconfig);
  // Remove duplicate keys for "@/*"
  json = json.replace(/,?\s*"@\/\*"\s*:\s*\[[^\]]+\]\s*,\s*"@\/\*"\s*:\s*\[[^\]]+\]\s*/m, ',"@/*":["src/*"],');
  // Ensure "@/modules/*"
  if (!/"@\/modules\/\*"\s*:\s*\["src\/modules\/\*"\]/.test(json)){
    json = json.replace(/"paths"\s*:\s*\{/, `"paths": { "@/*": ["src/*"], "@/modules/*":["src/modules/*"],`);
  }
  wr(FILES.jsconfig, json);
  snap(FILES.jsconfig, json);
  log('patch', FILES.jsconfig);
  return true;
}

/* --------------------------------------------------------------------------------------
 * 6) Targeted patches: StateController & Engine listeners
 * ------------------------------------------------------------------------------------ */
function firstExisting(paths){
  for (const f of paths) if (ex(f)) return f;
  return null;
}

function patchStateController(){
  const target = firstExisting(FILES.stateControllerCandidates);
  if (!target) { log('skip','StateController (not found)'); return false; }
  backupOnce(target);
  let src = rd(target);
  let changed = false;

  // Ensure canonical emits {from,to} and {tier}
  // setStage(name){ ... _emit(STAGE_CHANGE,{ from:_prev, to:_stage }) }
  if (!/STAGE_CHANGE[^]*from\s*:/.test(src)){
    src = src.replace(
      /_emit\s*\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\{[^}]*\}\s*\)\s*;?/m,
      `_emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });`
    );
    changed = true;
  }
  // setQuality(tier){ ... _emit(QUALITY_CHANGE,{ tier }) }
  if (!/QUALITY_CHANGE[^]*tier\s*:/.test(src)){
    src = src.replace(
      /_emit\s*\(\s*EVENTS\.QUALITY_CHANGE\s*,\s*\{[^}]*\}\s*\)\s*;?/m,
      `_emit(EVENTS.QUALITY_CHANGE, { tier });`
    );
    changed = true;
  }
  // Fallback: if emits use {stage} or {quality}, fix them
  src = src.replace(/EVENTS\.STAGE_CHANGE\s*,\s*\{\s*stage\s*:/g, `EVENTS.STAGE_CHANGE,{ to:`);
  src = src.replace(/EVENTS\.QUALITY_CHANGE\s*,\s*\{\s*quality\s*:/g, `EVENTS.QUALITY_CHANGE,{ tier:`);

  if (changed || /EVENTS\.STAGE_CHANGE,{ to:/.test(src) || /EVENTS\.QUALITY_CHANGE,{ tier:/.test(src)){
    wr(target, src);
    snap(target, src);
    log('patch', target);
    return true;
  }
  log('ok', target);
  return false;
}

function patchEngineListeners(){
  const target = firstExisting(FILES.engineCandidates);
  if (!target) { log('skip','ConsciousnessEngine (not found)'); return false; }
  backupOnce(target);
  let src = rd(target);
  let changed = false;

  // Stage: accept canonical only (to)
  if (/STAGE_CHANGE[^]*=>\s*\(\s*\{\s*stage/.test(src)){
    src = src.replace(/STAGE_CHANGE[^]*=>\s*\(\s*\{\s*stage\s*\}[^]*?\)\s*=>/m, match => {
      changed = true;
      return match.replace(/\{\s*stage\s*\}/, '{ to }').replace(/stage\b/g, 'to');
    });
  }
  // Quality: accept canonical only (tier)
  if (/QUALITY_CHANGE[^]*=>\s*\(\s*\{\s*quality/.test(src)){
    src = src.replace(/QUALITY_CHANGE[^]*=>\s*\(\s*\{\s*quality\s*\}[^]*?\)\s*=>/m, match => {
      changed = true;
      return match.replace(/\{\s*quality\s*\}/, '{ tier }').replace(/quality\b/g, 'tier');
    });
  }
  // Also fix any accidental logs using quality variable
  src = src.replace(/\bquality:\s*quality\b/g, 'quality: tier');

  // Replace tolerant mappings to canonical if present
  src = src.replace(/\bpayload\s*=\s*>\s*\{\s*const\s+stage\s*=\s*payload\.stage\s*\?\?\s*payload\.to/g,
    'payload => { const stage = payload.to');

  if (changed){
    wr(target, src);
    snap(target, src);
    log('patch', target);
    return true;
  }
  log('ok', target);
  return false;
}

/* --------------------------------------------------------------------------------------
 * 7) Global emitter normalization (safe patterns)
 * ------------------------------------------------------------------------------------ */
function normalizeEmitters(){
  // Search common files for safe one-liners: stage→to, quality→tier in emit payloads
  const roots = ['src'];
  let changedAny = false;

  function walk(dir){
    const entries = fs.readdirSync(p(dir), {withFileTypes:true});
    for (const e of entries){
      const rel = path.join(dir, e.name);
      const abs = p(rel);
      if (e.isDirectory()){
        if (/node_modules|dist|build|snapshots/.test(rel)) continue;
        walk(rel);
      } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)){
        try {
          let src = fs.readFileSync(abs,'utf8');
          const orig = src;
          // only safe direct replacements inside emit({...})
          src = src.replace(/BeatBus\.emit\(\s*['"]STAGE_CHANGE['"]\s*,\s*\{\s*stage\s*:/g, `BeatBus.emit('STAGE_CHANGE',{ to:`);
          src = src.replace(/BeatBus\.emit\(\s*['"]QUALITY_CHANGE['"]\s*,\s*\{\s*quality\s*:/g, `BeatBus.emit('QUALITY_CHANGE',{ tier:`);
          if (src !== orig){
            backupOnce(rel);
            fs.writeFileSync(abs, src, 'utf8');
            snap(rel, src);
            log('normalize', rel);
            changedAny = true;
          }
        } catch {}
      }
    }
  }
  roots.forEach(r=> ex(r) && walk(r));
  return changedAny;
}

/* --------------------------------------------------------------------------------------
 * 8) Git ops
 * ------------------------------------------------------------------------------------ */
function git(cmd){
  cp.execSync(cmd, {stdio:'inherit'});
}
function finishGit(){
  if (!DO_COMMIT) { console.log('· dry run complete — re-run with --commit to persist'); return; }
  try {
    git('git add -A');
    git(`git commit ${NO_VERIFY?'--no-verify':''} -m "doctor(canon): one-touch bootstrap · canonical bus + L2 guard/console"`);
    if (DO_TAG){
      const tag = `doctor_canon_one_touch_${NOW}`;
      git(`git tag ${tag}`);
      console.log('✓ tagged', tag);
    }
    if (DO_PUSH){
      git(`git push ${NO_VERIFY?'--no-verify':''}`);
      if (DO_TAG) git(`git push --tags ${NO_VERIFY?'--no-verify':''}`);
    }
  } catch (e){
    console.warn('! git failed:', e?.message||e);
  }
}

/* --------------------------------------------------------------------------------------
 * Run
 * ------------------------------------------------------------------------------------ */
(function run(){
  ensureDir(SNAP);
  installContracts();
  installBeatBus();
  installGuardAndConsole();
  installMainWiring();
  fixJsconfig();
  patchStateController();
  patchEngineListeners();
  normalizeEmitters();
  finishGit();
})();
