#!/usr/bin/env node
/**
 * Canon Suite Amplification Doctor (Fixed)
 * Closes gaps 1–7 with real, working code.
 * Idempotent (backs up once with .bak if file existed).
 *
 * Usage:
 *   node scripts/doctor_canon_amplification.cjs         # writes files (default)
 *   node scripts/doctor_canon_amplification.cjs --dry   # preview only
 */

'use strict';

const fs = require('fs');
const _path = require('path');

const ROOT = process.cwd();
const NOW_ISO = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const DRY = process.argv.includes('--dry');

const P = (...s) => path.join(ROOT, ...s);
const ex = (f) => fs.existsSync(P(f));
const rd = (f) => fs.readFileSync(P(f), 'utf8');
const ensureDir = (f) => fs.mkdirSync(path.dirname(P(f)), { recursive: true });

function backupOnce(file) {
  const abs = P(file);
  if (!fs.existsSync(abs)) return;
  const bak = abs + '.bak';
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(abs, bak);
    log(`backup ${file} -> ${path.basename(bak)}`);
  }
}

function writeFile(file, content) {
  if (DRY) {
    log(`would write ${file}`);
    return;
  }
  ensureDir(file);
  backupOnce(file);
  fs.writeFileSync(P(file), content, 'utf8');
  log(`ok ${file}`);
}

function patchFile(file, patcher) {
  const abs = P(file);
  if (!fs.existsSync(abs)) return false;
  const orig = fs.readFileSync(abs, 'utf8');
  const next = patcher(orig);
  if (next !== orig) {
    if (!DRY) {
      backupOnce(file);
      fs.writeFileSync(abs, next, 'utf8');
    }
    log(`patched ${file}`);
    return true;
  }
  return false;
}

function log(msg) {
  console.log('· ' + msg);
}

/* --------------------------
   CONTENTS (no backticks inside)
   -------------------------- */

// 1) src/canon/contracts/registry.js
const REGISTRY_JS = [
"/**",
" * Canon Contract Registry v1.0.0",
" * Single source of truth for event/data contracts (versioned).",
" */",
"export const CONTRACT_VERSION = '1.0.0';",
"",
"export const ContractRegistry = {",
"  version: CONTRACT_VERSION,",
"  lastUpdated: '" + NOW_ISO + "',",
"",
"  events: {",
"    STAGE_CHANGE: {",
"      version: '1.0.0',",
"      required: ['from','to'],",
"      optional: ['duration','trigger']",
"    },",
"    QUALITY_CHANGE: {",
"      version: '1.0.0',",
"      required: ['tier'],",
"      valid: { tier: ['LOW','MEDIUM','HIGH','ULTRA'] },",
"      deprecated: { quality: { since: '0.9.0', use: 'tier', removal: '2.0.0' } },",
"      migration: (payload) => {",
"        if (payload && 'quality' in payload && !('tier' in payload)) {",
"          payload = { ...payload, tier: payload.quality };",
"          delete payload.quality;",
"        }",
"        return payload;",
"      }",
"    },",
"    BLUEPRINT_READY: {",
"      version: '1.0.0',",
"      required: ['stage','quality','blueprint'],",
"      optional: ['cached','buildTime']",
"    }",
"  },",
"",
"  blueprints: {",
"    version: '1.0.0',",
"    required: ['particleCount','atmosphericPositions','allenAtlasPositions'],",
"    optional: ['tierDistribution','behaviorData'],",
"    constraints: {",
"      particleCount: { min: 100, max: 15000 }",
"    }",
"  },",
"",
"  deprecations: {",
"    active: [",
"      { type: 'field', path: 'QUALITY_CHANGE.quality', since: '0.9.0', removal: '2.0.0', migration: 'Use tier instead' }",
"    ],",
"    getActive() {",
"      return this.active;",
"    },",
"    check(type, payload) {",
"      const out = [];",
"      this.active.forEach(d => {",
"        if (d.path.split('.')[0] === type) {",
"          const field = d.path.split('.').pop();",
"          if (payload && (field in payload)) {",
"            out.push({ field, message: d.migration, removal: d.removal });",
"          }",
"        }",
"      });",
"      return out;",
"    }",
"  },",
"",
"  validate(type, payload) {",
"    const contract = this.events[type];",
"    if (!contract) return { valid: true, type: 'unknown', payload };",
"",
"    const result = {",
"      valid: true,",
"      violations: [],",
"      deprecations: this.deprecations.check(type, payload || {}),",
"      migrated: false,",
"      payload: payload || {}",
"    };",
"",
"    if (typeof contract.migration === 'function') {",
"      result.payload = contract.migration({ ...(payload || {}) }) || {};",
"      if (JSON.stringify(result.payload) !== JSON.stringify(payload || {})) {",
"        result.migrated = true;",
"      }",
"    }",
"",
"    const missing = (contract.required || []).filter(f => !(f in (result.payload || {})));",
"    if (missing.length) {",
"      result.valid = false;",
"      result.violations.push({ type: 'missing_required', fields: missing });",
"    }",
"",
"    if (contract.valid) {",
"      Object.keys(contract.valid).forEach(field => {",
"        const allowed = contract.valid[field];",
"        if (field in (result.payload || {}) && !allowed.includes(result.payload[field])) {",
"          result.valid = false;",
"          result.violations.push({ type: 'invalid_value', field, value: result.payload[field], valid: allowed });",
"        }",
"      });",
"    }",
"",
"    return result;",
"  },",
"",
"  getDriftReport() {",
"    return { version: this.version, deprecations: this.deprecations.getActive(), coverage: this.getCoverage() };",
"  },",
"  getCoverage() {",
"    const total = Object.keys(this.events).length;",
"    const tested = 0;",
"    return { total, tested, percentage: total ? ((tested / total) * 100).toFixed(1) + '%' : '0%' };",
"  }",
"};",
"",
"export default ContractRegistry;",
""].join('\n');

// 2) src/canon/boundary.js
const BOUNDARY_JS = [
"/**",
" * Canon Bus Boundary Enforcement",
" * Validates all BeatBus.emit payloads against ContractRegistry.",
" */",
"import ContractRegistry from './contracts/registry.js';",
"",
"export const BoundaryModes = { TELEMETRY: 'TELEMETRY', WARN: 'WARN', STRICT: 'STRICT' };",
"",
"export class BusBoundary {",
"  constructor(mode = BoundaryModes.WARN) {",
"    this.mode = mode;",
"    this.violations = [];",
"    this.telemetry = { total: 0, valid: 0, invalid: 0, rejected: 0 };",
"  }",
"  enforce(BeatBus) {",
"    if (!BeatBus || BeatBus.__boundaryEnforced) return;",
"    const original = BeatBus.emit.bind(BeatBus);",
"    const boundary = this;",
"    BeatBus.emit = function(event, payload) {",
"      boundary.telemetry.total++;",
"      const validation = ContractRegistry.validate(event, payload || {});",
"      if (validation.valid) {",
"        boundary.telemetry.valid++;",
"      } else {",
"        boundary.telemetry.invalid++;",
"        boundary.violations.push({ event, payload: validation.payload, violations: validation.violations, ts: Date.now() });",
"        if (boundary.mode === BoundaryModes.WARN) {",
"          console.warn('Canon Boundary: contract violation', event, validation.violations);",
"        }",
"        if (boundary.mode === BoundaryModes.STRICT) {",
"          console.error('Canon Boundary: REJECTED', event, validation.violations);",
"          boundary.telemetry.rejected++;",
"          const inCI = (typeof process !== 'undefined') && process && process.env && process.env.CI;",
"          if (inCI) {",
"            throw new Error('Contract violation in CI: ' + event);",
"          }",
"          return;",
"        }",
"      }",
"      if (validation.deprecations && validation.deprecations.length) {",
"        console.warn('Canon Boundary: deprecated fields in ' + event, validation.deprecations);",
"      }",
"      return original(event, validation.payload || payload || {});",
"    };",
"    BeatBus.__boundaryEnforced = true;",
"    console.log('Canon Boundary enforcing in mode', this.mode);",
"  }",
"  setMode(mode) {",
"    if (!Object.values(BoundaryModes).includes(mode)) throw new Error('Invalid mode: ' + mode);",
"    this.mode = mode;",
"    console.log('Canon Boundary mode ->', mode);",
"  }",
"  getReport() {",
"    const t = this.telemetry;",
"    return {",
"      mode: this.mode,",
"      telemetry: t,",
"      violations: this.violations.slice(-10),",
"      violationRate: t.total ? ((t.invalid / t.total) * 100).toFixed(1) + '%' : '0%'",
"    };",
"  }",
"}",
"",
"export default BusBoundary;",
""].join('\n');

// 3) src/canon/hud.js
const HUD_JS = [
"/**",
" * Canon HUD - minimal trust signals (DEV only).",
" */",
"export class CanonHUD {",
"  constructor() {",
"    this.element = null;",
"    this.stats = { fps: 0 };",
"    this._last = 0;",
"    this._frames = 0;",
"  }",
"  init() {",
"    if (typeof window === 'undefined' || !import.meta.env || !import.meta.env.DEV) return;",
"    if (this.element) return;",
"    this.element = document.createElement('div');",
"    this.element.id = 'canon-hud';",
"    this.element.style.position = 'fixed';",
"    this.element.style.top = '10px';",
"    this.element.style.right = '10px';",
"    this.element.style.background = 'rgba(0,0,0,0.8)';",
"    this.element.style.color = '#0f0';",
"    this.element.style.padding = '10px';",
"    this.element.style.fontFamily = 'monospace';",
"    this.element.style.fontSize = '12px';",
"    this.element.style.border = '1px solid #0f0';",
"    this.element.style.borderRadius = '4px';",
"    this.element.style.zIndex = '999999';",
"    this.element.style.pointerEvents = 'none';",
"    document.body.appendChild(this.element);",
"    this._last = performance.now();",
"    const tick = () => {",
"      const now = performance.now();",
"      this._frames++;",
"      if (now - this._last >= 1000) {",
"        this.stats.fps = Math.round((this._frames * 1000) / (now - this._last));",
"        this._frames = 0;",
"        this._last = now;",
"        this.update();",
"      }",
"      requestAnimationFrame(tick);",
"    };",
"    requestAnimationFrame(tick);",
"    this.update();",
"    console.log('CANON HUD active');",
"  }",
"  update() {",
"    if (!this.element || !window.canon) return;",
"    const b = window.canon.boundary && window.canon.boundary.getReport ? window.canon.boundary.getReport() : {};",
"    const t = (b.telemetry || {});",
"    const vio = (b.violations || []).length;",
"    const fpsColor = this.stats.fps < 30 ? '#f00' : '#0f0';",
"    this.element.innerHTML = '' +",
"      '<div style=\"margin-bottom:5px;border-bottom:1px solid #0f0;padding-bottom:5px;\"><b>CANON HUD</b></div>' +",
"      '<div>FPS: <span style=\"color:' + fpsColor + '\">' + this.stats.fps + '</span></div>' +",
"      '<div>Mode: ' + (b.mode || 'WARN') + '</div>' +",
"      '<div>Events: ' + (t.total || 0) + '</div>' +",
"      '<div>Valid: ' + (t.valid || 0) + '</div>' +",
"      '<div>Violations (last 10): ' + (vio || 0) + '</div>';",
"  }",
"}",
"",
"export default CanonHUD;",
""].join('\n');

// 4) src/canon/tests/contracts.test.js
const TESTS_JS = [
"/**",
" * Contract Tester - emitter + blueprint + morph helpers.",
" */",
"import ContractRegistry from '../contracts/registry.js';",
"",
"export class ContractTester {",
"  constructor(){",
"    this.results = [];",
"    this.covered = new Set();",
"  }",
"  testEmitter(name, emitFn){",
"    const emitted = [];",
"    const mock = { emit: (e,p) => emitted.push({event:e,payload:p}) };",
"    const result = { emitter: name, passed: true, violations: [] };",
"    try { emitFn(mock); } catch(e){ result.passed = false; result.error = e.message; }",
"    emitted.forEach(({event,payload}) => {",
"      const v = ContractRegistry.validate(event, payload);",
"      if (!v.valid){ result.passed = false; result.violations.push({event, violations: v.violations}); }",
"      this.covered.add(event);",
"    });",
"    this.results.push(result);",
"    return result;",
"  }",
"  testBlueprint(bp){",
"    const c = ContractRegistry.blueprints;",
"    const res = { type:'blueprint', passed:true, violations:[] };",
"    (c.required || []).forEach(f => { if (!(f in (bp||{}))) { res.passed=false; res.violations.push({type:'missing_field', field:f}); } });",
"    if ('particleCount' in (bp||{})){",
"      const mm = c.constraints.particleCount;",
"      if (bp.particleCount < mm.min || bp.particleCount > mm.max){ res.passed=false; res.violations.push({type:'constraint_violation', field:'particleCount'}); }",
"    }",
"    this.results.push(res);",
"    return res;",
"  }",
"  getCoverage(){",
"    const total = Object.keys(ContractRegistry.events).length;",
"    const tested = this.covered.size;",
"    return { total, tested, percentage: total ? ((tested/total)*100).toFixed(1)+'%' : '0%', missing: Object.keys(ContractRegistry.events).filter(e => !this.covered.has(e)) };",
"  }",
"  getReport(){",
"    const failures = this.results.filter(r => !r.passed);",
"    return { total: this.results.length, passed: this.results.length - failures.length, failed: failures.length, coverage: this.getCoverage(), failures: failures.slice(0,5) };",
"  }",
"}",
"",
"export default ContractTester;",
""].join('\n');

// 5) scripts/canon-verify.js (Node)
const VERIFY_JS = [
"#!/usr/bin/env node",
"/* Canon CI Verification */",
"const fs = require('fs');",
"const _path = require('path');",
"",
"function checkFile(p){ const ok = fs.existsSync(path.join(process.cwd(), p)); console.log('  ' + (ok?'✅':'❌') + ' ' + p); return ok; }",
"",
"async function main(){",
"  console.log('🔍 Canon CI Verification\\n');",
"  let ok = true;",
"  ok &= checkFile('src/canon/contracts/registry.js');",
"  ok &= checkFile('src/canon/boundary.js');",
"  ok &= checkFile('src/canon/hud.js');",
"  ok &= checkFile('src/canon/tests/contracts.test.js');",
"  ok &= checkFile('src/canon/doctor/base.js');",
"  ok &= checkFile('src/canon/deprecation.js');",
"  ok &= checkFile('src/canon/init-amplified.js');",
"  console.log('\\n' + (ok? '✅ Canon verification PASSED':'❌ Canon verification FAILED'));",
"  process.exit(ok ? 0 : 1);",
"}",
"main().catch(e => { console.error(e); process.exit(1); });",
""].join('\n');

// 6) src/canon/doctor/base.js
const DOCTOR_BASE_JS = [
"/** Canon Doctor Base (governance scaffold) */",
"export class CanonDoctor {",
"  constructor(cfg){",
"    this.name = cfg.name; this.description = cfg.description || '';",
"    this.riskScore = cfg.riskScore || 'LOW';",
"    this.blastRadius = cfg.blastRadius || [];",
"    this.verifications = cfg.verifications || [];",
"    this.dryRun = false; this.changes = [];",
"  }",
"  async preflight(){",
"    console.log('CANON DOCTOR:', this.name, '| Risk:', this.riskScore);",
"    return true;",
"  }",
"  async preview(){ this.dryRun = true; return []; }",
"  async operate(){ throw new Error('override operate()'); }",
"  async verify(){ return { passed: true, results: [] }; }",
"  async rollback(){ console.log('rollback (noop)'); }",
"  async execute(){",
"    await this.preflight();",
"    await this.preview();",
"    this.dryRun = false;",
"    const changes = await this.operate();",
"    const v = await this.verify();",
"    return { success: v.passed, changes, verification: v };",
"  }",
"}",
"export default CanonDoctor;",
""].join('\n');

// 7) src/canon/deprecation.js
const DEPRECATION_JS = [
"/** Canon Deprecation Protocol (phased) */",
"export class DeprecationManager {",
"  constructor(){",
"    this.schedule = new Map();",
"    this.telemetry = new Map();",
"    this.phases = { TELEMETRY:'TELEMETRY', WARN:'WARN', STRICT:'STRICT' };",
"  }",
"  register(d){",
"    this.schedule.set(d.id, { ...d, currentPhase:this.phases.TELEMETRY, violators:new Set() });",
"    console.log('Deprecation registered:', d.id);",
"  }",
"  check(id, source){",
"    const dep = this.schedule.get(id); if (!dep) return null;",
"    dep.violators.add(source);",
"    const c = (this.telemetry.get(id) || 0) + 1; this.telemetry.set(id, c);",
"    if (dep.currentPhase === this.phases.WARN) console.warn('Deprecated:', dep.old, '->', dep.new);",
"    if (dep.currentPhase === this.phases.STRICT) throw new Error('Deprecated API used: ' + dep.old);",
"    return { phase: dep.currentPhase };",
"  }",
"  advancePhase(id){",
"    const dep = this.schedule.get(id); if (!dep) return;",
"    const order = [this.phases.TELEMETRY, this.phases.WARN, this.phases.STRICT];",
"    const idx = order.indexOf(dep.currentPhase);",
"    if (idx < order.length-1){",
"      if (order[idx+1] === this.phases.STRICT && dep.violators.size){",
"        console.warn('Cannot move to STRICT — violators remain:', dep.violators.size);",
"        dep.currentPhase = this.phases.WARN;",
"      } else {",
"        dep.currentPhase = order[idx+1];",
"      }",
"      console.log('Deprecation phase ->', dep.currentPhase);",
"    }",
"  }",
"  getReport(){",
"    const active = []; const blockers = []; const ready = []; const tel = {};",
"    this.schedule.forEach((dep, id) => {",
"      active.push({ id, phase: dep.currentPhase, violators: dep.violators.size });",
"      tel[id] = this.telemetry.get(id) || 0;",
"      if (dep.violators.size) blockers.push({ id, violators: Array.from(dep.violators) }); else ready.push(id);",
"    });",
"    return { active, telemetry: tel, readyForNextPhase: ready, blockers };",
"  }",
"}",
"export default DeprecationManager;",
""].join('\n');

// 8) src/canon-guard/L2.js (only if missing)
const GUARD_L2_JS = [
"/** Canon Guard L2 - active validator (minimal, working) */",
"import ContractRegistry from '../canon/contracts/registry.js';",
"export class CanonGuardL2 {",
"  constructor(){ this.violations=[]; this.validations=0; }",
"  validate(type, data){",
"    this.validations++;",
"    const v = ContractRegistry.validate(type, data||{});",
"    if (!v.valid){",
"      const entry = { type, data: v.payload, violations: v.violations, ts: Date.now() };",
"      this.violations.push(entry);",
"      console.warn('CanonGuard L2 violation', entry);",
"    }",
"    return v;",
"  }",
"  autoProtect(BeatBus){",
"    if (!BeatBus || BeatBus.__guarded) return;",
"    const original = BeatBus.emit.bind(BeatBus);",
"    const self = this;",
"    BeatBus.emit = function(evt, payload){ self.validate(evt, payload); return original(evt, payload); };",
"    BeatBus.__guarded = true; console.log('CanonGuard L2 protecting BeatBus');",
"  }",
"  getStats(){ return { validations:this.validations, violations:this.violations.length }; }",
"  getViolations(){ return this.violations; }",
"}",
"export default CanonGuardL2;",
""].join('\n');

// 9) src/canon-console/L2.js (only if missing)
const CONSOLE_L2_JS = [
"/** Canon Console L2 - context-aware filtering (minimal, working) */",
"export class CanonConsoleL2 {",
"  constructor(){ this.context=null; this.verbosity='important'; this.patterns=new Map(); this.count=0; }",
"  setContext(ctx){ this.context=ctx; console.log('CanonConsole context ->', ctx); }",
"  setVerbosity(v){ this.verbosity = v; console.log('CanonConsole verbosity ->', v); }",
"  detect(msg){",
"    const key = String(msg).slice(0,50);",
"    const p = this.patterns.get(key)||{count:0}; p.count++; this.patterns.set(key,p);",
"  }",
"  analyze(){",
"    const top = Array.from(this.patterns.entries()).sort((a,b)=>b[1].count-a[1].count).slice(0,5).map(([m,d])=>({message:m,count:d.count}));",
"    return { topPatterns: top, verbosity: this.verbosity, context: this.context };",
"  }",
"  getStats(){ return { messagesTotal: this.count, verbosity: this.verbosity }; }",
"}",
"export default CanonConsoleL2;",
""].join('\n');

// 10) src/canon/init-amplified.js
const INIT_AMP_JS = [
"/** Canon Suite Amplified Initialization */",
"import ContractRegistry from './contracts/registry.js';",
"import BusBoundary, { BoundaryModes } from './boundary.js';",
"import CanonHUD from './hud.js';",
"import ContractTester from './tests/contracts.test.js';",
"import DeprecationManager from './deprecation.js';",
"",
"import CanonGuardL2 from '../canon-guard/L2.js';",
"import CanonConsoleL2 from '../canon-console/L2.js';",
"",
"export function initCanonAmplified(){",
"  if (typeof window === 'undefined') return;",
"  if (window.__CANON_AMPLIFIED) return;",
"  window.__CANON_AMPLIFIED = Date.now();",
"  console.log('Canon Suite: Initializing AMPLIFIED...');",
"  const contracts = ContractRegistry;",
"  const boundary = new BusBoundary((import.meta.env && import.meta.env.DEV) ? BoundaryModes.WARN : BoundaryModes.TELEMETRY);",
"  const hud = new CanonHUD();",
"  const tester = new ContractTester();",
"  const deprecation = new DeprecationManager();",
"  deprecation.register({ id:'quality-to-tier', type:'field', old:'quality', new:'tier', since:'0.9.0', phases:{ telemetry:'t1', warn:'t2', strict:'t3' } });",
"  const guard = new CanonGuardL2();",
"  const consoleTool = new CanonConsoleL2();",
"  const BB = window.BeatBus;",
"  if (BB){",
"    boundary.enforce(BB);",
"    guard.autoProtect(BB);",
"  } else {",
"    console.warn('Canon: BeatBus not found at init (will retry)');",
"    setTimeout(()=>{ if (window.BeatBus){ boundary.enforce(window.BeatBus); guard.autoProtect(window.BeatBus); console.log('Canon: Late enforcement applied'); }}, 100);",
"  }",
"  if (import.meta.env && import.meta.env.DEV) hud.init();",
"  window.canon = {",
"    contracts, boundary, hud, tester, deprecation, guard, console: consoleTool,",
"    status: () => ({",
"      version: contracts.version,",
"      mode: boundary.mode,",
"      initialized: window.__CANON_AMPLIFIED,",
"      components: { boundary: boundary.getReport(), guard: guard.getStats(), console: consoleTool.getStats(), deprecations: deprecation.getReport() }",
"    }),",
"    setMode: (m)=>boundary.setMode(m),",
"    getDriftReport: ()=>contracts.getDriftReport(),",
"  };",
"  window.__CANON_GUARD_ACTIVE = true;",
"  window.__CANON_CONSOLE_ACTIVE = true;",
"  window.__CANON_CONTRACTS_ACTIVE = true;",
"  window.__CANON_BOUNDARY_ACTIVE = true;",
"  console.log('Canon Suite AMPLIFIED ready');",
"}",
"",
"if (typeof window !== 'undefined'){",
"  if (!window.__CANON_AMPLIFIED) initCanonAmplified();",
"}",
"",
"export default initCanonAmplified;",
""].join('\n');

/* --------------------------
   EXECUTION
   -------------------------- */

console.log('\n🚀 Canon Suite Amplification (Fixed) — installing…\n');

// Write core files
writeFile('src/canon/contracts/registry.js', REGISTRY_JS);
writeFile('src/canon/boundary.js', BOUNDARY_JS);
writeFile('src/canon/hud.js', HUD_JS);
writeFile('src/canon/tests/contracts.test.js', TESTS_JS);
writeFile('scripts/canon-verify.js', VERIFY_JS);
try { if (!DRY) fs.chmodSync(P('scripts/canon-verify.js'), 0o755); } catch {}
writeFile('src/canon/doctor/base.js', DOCTOR_BASE_JS);
writeFile('src/canon/deprecation.js', DEPRECATION_JS);

// Only create guard/console if missing (so we don't stomp your custom ones)
if (!ex('src/canon-guard/L2.js')) writeFile('src/canon-guard/L2.js', GUARD_L2_JS);
if (!ex('src/canon-console/L2.js')) writeFile('src/canon-console/L2.js', CONSOLE_L2_JS);

writeFile('src/canon/init-amplified.js', INIT_AMP_JS);

// Patch main.jsx to load amplified init (top import, remove older duplicates)
if (ex('src/main.jsx')) {
  patchFile('src/main.jsx', (s) => {
    let out = s.replace(/import\s+['"].\/canon\/init(?:-amplified)?\.js['"];?\n?/g, '');
    out = "import './canon/init-amplified.js';\n" + out;
    return out;
  });
}

// Clean jsconfig.json duplicate paths (@/* and @/modules/*)
if (ex('jsconfig.json')) {
  patchFile('jsconfig.json', (raw) => {
    try {
      const j = JSON.parse(raw);
      j.compilerOptions = j.compilerOptions || {};
      j.compilerOptions.paths = j.compilerOptions.paths || {};
      const newPaths = Object.assign({}, j.compilerOptions.paths);
      newPaths['@/*'] = ['src/*'];
      newPaths['@/modules/*'] = ['src/modules/*'];
      // remove dups by reassigning clean object
      j.compilerOptions.paths = { '@/*': ['src/*'], '@/modules/*': ['src/modules/*'] };
      // preserve other non-@ aliases
      Object.keys(newPaths).forEach(k => {
        if (!k.startsWith('@/')) j.compilerOptions.paths[k] = newPaths[k];
      });
      return JSON.stringify(j, null, 2);
    } catch {
      return raw;
    }
  });
}

console.log('\n==============================================');
console.log('✅ Canon Suite Amplification installed (fixed)');
console.log('==============================================');
console.log('Next:');
console.log('  1) node scripts/canon-verify.js');
console.log('  2) npm run dev');
console.log('  3) In browser console:');
console.log('       canon.status()');
console.log('       canon.setMode(\"STRICT\")');
console.log('       BeatBus.emit(\"STAGE_CHANGE\", { to:\"neural\" })  // expect rejection (missing from)');
console.log('');
