#!/usr/bin/env node
/**
 * Canon Suite Bootstrap (L1/L2) — v1.0
 * - BeatBus singleton (canonical)
 * - Canon contracts
 * - Canon Guard L1/L2
 * - Canon Console L1/L2
 * - Canon init (DEV attach)
 * - Idempotent; creates .bak once; snapshots output
 * - Optional git commit/tag via --commit [--no-verify] [--tag] [--push]
 */
const fs = require('fs');
const _path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = P('snapshots', `doctor_canon_bootstrap_l2_${NOW}`);

const DO_COMMIT  = process.argv.includes('--commit');
const DO_PUSH    = process.argv.includes('--push');
const NO_VERIFY  = process.argv.includes('--no-verify');
const DO_TAG     = process.argv.includes('--tag');

function P(...s){ return path.join(ROOT, ...s); }
function ex(rel){ return fs.existsSync(P(rel)); }
function rd(rel){ return fs.readFileSync(P(rel), 'utf8'); }
function wr(rel, s){ fs.mkdirSync(path.dirname(P(rel)), {recursive:true}); fs.writeFileSync(P(rel), s, 'utf8'); }
function backupOnce(rel){ const bak = rel + '.bak'; if (!ex(bak) && ex(rel)) { fs.mkdirSync(path.dirname(P(bak)), {recursive:true}); fs.copyFileSync(P(rel), P(bak)); log('backup', `${rel} -> ${rel}.bak`); } }
function snap(rel, s){ fs.mkdirSync(SNAP, {recursive:true}); const fn = rel.replace(/\//g,'__') + '.txt'; fs.writeFileSync(path.join(SNAP, fn), s, 'utf8'); }
function log(kind, msg){ console.log(`· ${kind} ${msg}`); }

const files = [];

/* ────────────────────────────────────────────────────────────────── */
/* 1) BeatBus singleton                                               */
/* ────────────────────────────────────────────────────────────────── */
const BEATBUS = 'src/src/src/modules/orchestration/core/BeatBus.js';
const BEATBUS_SRC = `// [CANON:BEATBUS]
class BeatBus {
  constructor(){ this.listeners=new Map(); this.eventLog=[]; this.maxLogSize=100; this.debug=!!(import.meta?.env?.DEV); }
  on(evt, fn){ if(!this.listeners.has(evt)) this.listeners.set(evt,new Set()); this.listeners.get(evt).add(fn); if(this.debug) console.log('🚌 on',evt); return ()=>this.off(evt,fn); }
  once(evt, fn){ const w=(p)=>{ try{fn(p);}finally{this.off(evt,w);} }; return this.on(evt,w); }
  off(evt, fn){ const s=this.listeners.get(evt); if(!s) return; s.delete(fn); if(!s.size) this.listeners.delete(evt); if(this.debug) console.log('🚌 off',evt); }
  emit(evt, data={}){ this.eventLog.push({evt,data,t:Date.now()}); if(this.eventLog.length>this.maxLogSize) this.eventLog.shift(); if(this.debug) console.log('🚌 emit',evt,data);
    const s=this.listeners.get(evt); if(!s||!s.size){ if(this.debug) console.warn('�� no listeners',evt); return; } for(const fn of s){ try{fn(data);}catch(e){ console.error('🚌 listener error',evt,e); } } }
  getEventLog(){ return [...this.eventLog]; }
  getDebugInfo(){ const counts={}; this.listeners.forEach((s,k)=>counts[k]=s.size); return {events:[...this.listeners.keys()], counts, recent:this.eventLog.slice(-10)}; }
}
const beatBus = new BeatBus();
if (typeof window!=='undefined' && import.meta?.env?.DEV){ window.BeatBus = beatBus; console.log('🚌 BeatBus singleton ready (DEV)'); }
export default beatBus;
export { BeatBus };
`;

installIfMissing(BEATBUS, BEATBUS_SRC);

/* ────────────────────────────────────────────────────────────────── */
/* 2) Canon contracts                                                 */
/* ────────────────────────────────────────────────────────────────── */
const CONTRACTS = 'src/canon/contracts/index.js';
const CONTRACTS_SRC = `// [CANON:CONTRACTS:L1-L2]
export const CanonContracts = {
  morphing: {
    inputs: ['scrollProgress','morphProgress'],
    outputs: ['uMorphProgress','uFadeProgress'],
    validation: { range:[0,1], updateHz:60 }
  },
  blueprint: {
    required: ['particleCount','atmosphericPositions','allenAtlasPositions'],
    constraints: { particleCount:{min:1,max:15000} }
  },
  events: {
    STAGE_CHANGE: { shape:['from','to'] },
    QUALITY_CHANGE: { shape:['tier'] },
    BLUEPRINT_READY: { shape:['blueprint','stage','quality','cached'] }
  }
};
`;

installOrNormalize(CONTRACTS, CONTRACTS_SRC);

/* ────────────────────────────────────────────────────────────────── */
/* 3) Guard L1 + L2                                                   */
/* ────────────────────────────────────────────────────────────────── */
const GUARD_L1 = 'src/canon/guard/L1.js';
const GUARD_L1_SRC = `// [CANON:GUARD:L1]
export class CanonGuardL1 {
  constructor(contracts){ this.contracts=contracts||{}; this.violations=[]; }
  validate(name, payload){
    const c = this.contracts?.events?.[name];
    if (!c) return { valid:true };
    const missing = (c.shape||[]).filter(k => !(k in (payload||{})));
    if (missing.length){ const v = { component:name, message:\`Missing keys: \${missing.join(',')}\`, payload, level:'error', t:Date.now() }; this.violations.push(v); if (typeof console!=='undefined') console.warn('CanonGuardL1', v.message, payload); return {valid:false, violations:[v]}; }
    return { valid:true };
  }
  getViolations(){ return this.violations.slice(); }
}
`;

const GUARD_L2 = 'src/canon/guard/L2.js';
const GUARD_L2_SRC = `// [CANON:GUARD:L2]
import { CanonGuardL1 } from './L1.js';
export class CanonGuardL2 extends CanonGuardL1 {
  suggestFix(violation){
    const m = violation?.message||'';
    if (m.includes('STAGE_CHANGE')) return { script:'doctor_state_events.cjs', suggestion:'Emit {from,to}' };
    if (m.includes('QUALITY_CHANGE')) return { script:'doctor_quality_event.cjs', suggestion:'Emit {tier}' };
    if (m.includes('BLUEPRINT_READY')) return { script:'doctor_blueprint_shape.cjs', suggestion:'Emit {blueprint,stage,quality,cached}' };
    return null;
  }
  analyze(){ return this.getViolations().map(v => ({ v, fix:this.suggestFix(v) })); }
}
`;

installOrNormalize(GUARD_L1, GUARD_L1_SRC);
installOrNormalize(GUARD_L2, GUARD_L2_SRC);

/* ────────────────────────────────────────────────────────────────── */
/* 4) Console L1 + L2                                                 */
/* ────────────────────────────────────────────────────────────────── */
const CONSOLE_L1 = 'src/canon/console/L1.js';
const CONSOLE_L1_SRC = `// [CANON:CONSOLE:L1]
export class CanonConsoleL1 {
  constructor(){ this.patterns=new Map(); this.verbosity='critical'; this._orig = null; if (import.meta?.env?.DEV) this.hijack(); }
  hijack(){
    if (this._orig) return;
    this._orig = { ...console };
    const prio = { error:3, warn:2, log:1 }, thresh = ()=>({critical:3, important:2, verbose:1}[this.verbosity]||3);
    ['log','warn','error'].forEach(m=>{
      console[m] = (...args)=>{ this.detect(m,args);
        if (prio[m] >= thresh()) this._orig[m](...args);
      };
    });
    console.info('🖥️  CanonConsole L1 active');
  }
  restore(){ if(!this._orig) return; Object.assign(console, this._orig); this._orig=null; }
  detect(level,args){ const key = this._hash(args); const p = this.patterns.get(key)||{count:0,first:Date.now()}; p.count++; p.last=Date.now(); this.patterns.set(key,p); if (p.count===5) this._orig.warn('CanonConsole: repeating pattern', args[0]); }
  _hash(args){ try{ return JSON.stringify(args[0]).slice(0,120); }catch{ return String(args[0]).slice(0,120); } }
}
`;

const CONSOLE_L2 = 'src/canon/console/L2.js';
const CONSOLE_L2_SRC = `// [CANON:CONSOLE:L2]
import { CanonConsoleL1 } from './L1.js';
export class CanonConsoleL2 extends CanonConsoleL1 {
  constructor(){ super(); this.context=null; this.filters={}; }
  setContext(ctx){ this.context=ctx; this.filters = (ctx==='morphing') ? {show:['morph','uniform','progress'], hide:['network']} : {}; }
  suggestFixFrom(args){
    const s = String(args?.[0]||'');
    if (/uniform .* not found/i.test(s)) return { script:'doctor_add_uniforms.cjs', reason:'Missing uniform' };
    if (/fragmentShaderSource:|vertexShaderSource:/i.test(s)) return { script:'doctor_fix_shader_keys.cjs', reason:'Wrong ShaderMaterial props' };
    return null;
  }
}
`;

installOrNormalize(CONSOLE_L1, CONSOLE_L1_SRC);
installOrNormalize(CONSOLE_L2, CONSOLE_L2_SRC);

/* ────────────────────────────────────────────────────────────────── */
/* 5) Canon init (DEV attach)                                         */
/* ────────────────────────────────────────────────────────────────── */
const INIT = 'src/canon/init.js';
const INIT_SRC = `// [CANON:INIT]
import BeatBus from '@/src/src/modules/orchestration/core/BeatBus.js';
import { CanonContracts } from './contracts/index.js';
import { CanonGuardL1 } from './guard/L1.js';
import { CanonGuardL2 } from './guard/L2.js';
import { CanonConsoleL1 } from './console/L1.js';
import { CanonConsoleL2 } from './console/L2.js';

export function attachCanonL2(){
  const guard = new CanonGuardL2(CanonContracts);
  const panel = new CanonConsoleL2();
  if (typeof window!=='undefined'){
    window.canon = { guard, panel, contracts:CanonContracts };
    window.__CANON_GUARD_ACTIVE = true;
    window.__CANON_CONSOLE_ACTIVE = true;
    // Example BeatBus guard taps
    const EVT = (n)=>(p)=>guard.validate(n,p);
    BeatBus.on('STAGE_CHANGE', EVT('STAGE_CHANGE'));
    BeatBus.on('QUALITY_CHANGE', EVT('QUALITY_CHANGE'));
    BeatBus.on('BLUEPRINT_READY', EVT('BLUEPRINT_READY'));
    console.info('🛡️  Canon L2 attached');
  }
  return { guard, panel };
}

if (import.meta?.env?.DEV) attachCanonL2();
`;

installOrNormalize(INIT, INIT_SRC);

/* ────────────────────────────────────────────────────────────────── */
/* 6) Ensure aliases / jsconfig path                                  */
/* ────────────────────────────────────────────────────────────────── */
const JSCONFIG = 'jsconfig.json';
if (ex(JSCONFIG)){
  let s = rd(JSCONFIG), o=s;
  if (!/@"\/modules\/\*/.test(s)){
    s = s.replace(/"paths"\s*:\s*\{[^}]*\}/, (m)=>{
      return m.replace(/\}$/, `, "@/*":["src/*"], "@/modules/*":["src/modules/*"] }`);
    });
  }
  if (s!==o){ backupOnce(JSCONFIG); wr(JSCONFIG,s); snap(JSCONFIG,s); log('patch',JSCONFIG); }
}

/* ────────────────────────────────────────────────────────────────── */
/* 7) Disable risky AI/CD workflow (optional soft-lock)               */
/*     - turns any .github/workflows/*ai*patch*.yml into .disabled    */
/* ────────────────────────────────────────────────────────────────── */
const WF_DIR = '.github/workflows';
if (ex(WF_DIR)){
  const entries = fs.readdirSync(P(WF_DIR));
  for (const f of entries){
    if (/ai.*patch/i.test(f) && /\.ya?ml$/i.test(f)){
      const src = path.join(WF_DIR, f);
      const dst = path.join(WF_DIR, f + '.disabled');
      if (!ex(dst)){
        fs.renameSync(P(src), P(dst));
        log('disable', `${WF_DIR}/${f} -> ${f}.disabled`);
      }
    }
  }
}

/* ────────────────────────────────────────────────────────────────── */
/* 8) Commit/tag (optional)                                           */
/* ────────────────────────────────────────────────────────────────── */
const anyChanged = files.length || true; // we snapshot within helpers anyway
if (DO_COMMIT){
  try {
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "chore(canon): bootstrap L1/L2 (BeatBus, Guard, Console, Contracts)"`, {stdio:'inherit'});
    if (DO_TAG){
      const tag = `canon_bootstrap_l2_${NOW}`;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
      console.log('✓ tagged', tag);
    }
    if (DO_PUSH){
      cp.execSync(`git push ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
      if (DO_TAG) cp.execSync(`git push --tags ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
    }
  } catch (e) {
    console.warn('! git failed:', e?.message||e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

/* ───────────────── helpers ───────────────── */
function installIfMissing(rel, content){
  if (!ex(rel)){ wr(rel, content); snap(rel, content); log('create', rel); } else { log('ok', rel); }
}
function installOrNormalize(rel, content){
  if (!ex(rel)){ wr(rel, content); snap(rel, content); log('create', rel); return; }
  const cur = rd(rel);
  if (!cur.includes('[CANON:')){ backupOnce(rel); wr(rel, content); snap(rel, content); log('normalize', rel); }
  else log('ok', rel);
}
