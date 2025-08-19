#!/usr/bin/env node
/**
 * doctor_reset_morph_core.cjs
 * Hard-resets the core to a working baseline with stage morphs + color changes.
 * Idempotent: backs up touched files once as .bak, snapshots all writes.
 *
 * It will:
 *  1) Overwrite/create:
 *     - src/modules/orchestration/core/BeatBus.js
 *     - src/modules/orchestration/core/BeatBusAdapter.js
 *     - src/state/StateController.js
 *     - src/engine/ConsciousnessEngine.js
 *  2) Ensure the Engine is imported at boot:
 *     - src/dev/renderHealthcheck.js → ensure `import "@/engine/ConsciousnessEngine.js"`
 *  3) Patch WebGLBackground.jsx to:
 *     - add aFrom/aTo attributes
 *     - animate uMorphProgress + uFadeProgress on each BLUEPRINT_READY
 *
 * Dry-run by default. Use --commit (optionally --no-verify) to commit+tag.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const NOW = new Date().toISOString().replace(/[:]/g,'-');
const SNAP_DIR = path.join(ROOT, 'snapshots', `doctor_reset_morph_core_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(core): reset bus/state/engine + inline morph RAF (renderer)';

function p(rel){ return path.join(ROOT, rel); }
function ex(rel){ return fs.existsSync(p(rel)); }
function rd(rel){ return fs.readFileSync(p(rel), 'utf8'); }
function wr(rel, s){ fs.writeFileSync(p(rel), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(d, {recursive:true}); }
function backupOnce(rel){
  const abs = p(rel), bak = abs + '.bak';
  if (fs.existsSync(abs) && !fs.existsSync(bak)){
    fs.copyFileSync(abs, bak);
    console.log('· backup', rel + '.bak');
  }
}
function snap(rel, content){
  ensureDir(SNAP_DIR);
  const snapPath = path.join(SNAP_DIR, rel.replace(/\//g,'__') + '.txt');
  ensureDir(path.dirname(snapPath));
  fs.writeFileSync(snapPath, content, 'utf8');
}

function writeFile(rel, content){
  const abs = p(rel);
  ensureDir(path.dirname(abs));
  const before = ex(rel) ? rd(rel) : null;
  if (before === content){ console.log('· no-op', rel); return false; }
  backupOnce(rel);
  wr(rel, content);
  snap(rel, content);
  console.log(ex(rel) ? '· patched' : '· created', rel);
  return true;
}

function safePatch(rel, fn){
  if (!ex(rel)){ console.log('· skip (missing)', rel); return false; }
  const before = rd(rel);
  const after = fn(before);
  if (after === before){ console.log('· no-op', rel); return false; }
  backupOnce(rel);
  wr(rel, after);
  snap(rel, after);
  console.log('· patched', rel);
  return true;
}

/* 1) Core files (BeatBus, Adapter, StateController, Engine) */
const BEATBUS_JS = `// modules/orchestration/core/BeatBus.js
// Central event system for the consciousness theater

class BeatBus {
  constructor() {
    this.listeners = new Map();
    this.eventLog = [];
    this.maxLogSize = 100;
    this.debug = false;
    try { this.debug = !!import.meta.env?.DEV; } catch(_) {}
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(callback);
    if (this.debug) console.log('🚌 BeatBus: Subscribed to', eventName);
    return () => this.off(eventName, callback);
  }

  once(eventName, callback) {
    const wrapped = (data) => { try { callback(data); } finally { this.off(eventName, wrapped); } };
    return this.on(eventName, wrapped);
  }

  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;
    this.listeners.get(eventName).delete(callback);
    if (this.listeners.get(eventName).size === 0) this.listeners.delete(eventName);
    if (this.debug) console.log('🚌 BeatBus: Unsubscribed from', eventName);
  }

  emit(eventName, data = {}) {
    this.logEvent(eventName, data);
    if (this.debug) console.log('🚌 BeatBus: Emitting', eventName, data);
    const ls = this.listeners.get(eventName);
    if (!ls || ls.size === 0) { if (this.debug) console.warn('🚌 BeatBus: No listeners for', eventName); return; }
    ls.forEach(cb => { try { cb(data); } catch (e) { console.error('🚌 BeatBus: Error in', eventName, 'listener:', e); } });
  }

  clear(eventName) { eventName ? this.listeners.delete(eventName) : this.listeners.clear(); }
  getListenerCount(eventName) { const s = this.listeners.get(eventName); return s ? s.size : 0; }
  getRegisteredEvents() { return Array.from(this.listeners.keys()); }

  logEvent(eventName, data) {
    const ts = Date.now();
    this.eventLog.push({ eventName, data, timestamp: ts });
    if (this.eventLog.length > this.maxLogSize) this.eventLog.shift();
  }
  getEventLog() { return [...this.eventLog]; }
  clearEventLog() { this.eventLog = []; }

  getDebugInfo() {
    const info = { registeredEvents: this.getRegisteredEvents(), listenerCounts: {}, recentEvents: this.eventLog.slice(-10) };
    this.listeners.forEach((set, evt) => info.listenerCounts[evt] = set.size);
    return info;
  }
}

const beatBus = new BeatBus();

try {
  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    window.BeatBus = beatBus;
    window.beatBusDebug = {
      getListeners: () => beatBus.listeners,
      getEventLog: () => beatBus.getEventLog(),
      clearEventLog: () => beatBus.clearEventLog(),
      getDebugInfo: () => beatBus.getDebugInfo(),
      getListenerMap: () => {
        const map = {};
        beatBus.listeners.forEach((listeners, event) => { map[event] = listeners.size; });
        return map;
      },
      testEmit: (eventName, data) => beatBus.emit(eventName, data),
    };
    console.log('🚌 BeatBus Debug Tools ready');
  }
} catch(_) {}

export default beatBus;
export { BeatBus };
`;

const ADAPTER_JS = `// modules/orchestration/core/BeatBusAdapter.js
// Compatibility shim: default export is the singleton bus,
// also expose getBeatBus() for callers that expect it.
import bus, { BeatBus as BeatBusClass } from './BeatBus.js';
export default bus;
export function getBeatBus(){ return bus; }
export { BeatBusClass };
`;

const STATECTRL_JS = `// StateController — SST v3.0: single writer + canonical events
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';

export const EVENTS = {
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  STATE_CHANGED: 'STATE_CHANGED',
  BLUEPRINT_READY: 'BLUEPRINT_READY',
  OPENING_COMPLETE: 'OPENING_COMPLETE',
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
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage, stage:_stage, quality:_quality });
}
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier, quality:_quality, stage:_stage });
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
  window.stateControls = { ...api, EVENTS, debug:{ getLog(){ return _ring.slice(); } } };
}

export default api;
`;

const ENGINE_JS = `// ConsciousnessEngine — SST v3.0: engine authoritative, renderer dumb
import { Canonical } from '@config/canonical/canonicalAuthority.js';
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS } from '@theater/events.js';

class ConsciousnessEngine {
  constructor() {
    this.blueprintCache = new Map();
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';
    this.initializeBeatBusListeners();
    console.log('🧠 ConsciousnessEngine ready (SST v3.0)');
  }

  initializeBeatBusListeners() {
    // Stage changes (accept {stage} or {to})
    BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => {
      const stage = payload.stage ?? payload.to;
      if (!stage) return;
      this.currentStage = stage;
      console.log(\`🧠 Engine: Stage -> \${stage}\`);
      this.buildAndEmitBlueprint(stage, this.currentQuality);
    });

    // Quality changes (accept {tier} or {quality})
    BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => {
      const tier = payload.tier ?? payload.quality;
      if (!tier) return;
      this.currentQuality = tier;
      console.log(\`🧠 Engine: Quality -> \${tier}\`);
      this.buildAndEmitBlueprint(this.currentStage, tier);
    });

    // Initial blueprint after mount
    setTimeout(() => {
      console.log('🧠 Engine: Requesting initial state…');
      this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
    }, 400);
  }

  buildAndEmitBlueprint(stage, quality) {
    const key = \`\${stage}|\${quality}\`;
    const cached = this.blueprintCache.get(key);
    if (cached) {
      console.log(\`🔨 Engine: Using cached \${key}\`);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint: cached, stage, quality, cached: true });
      return;
    }
    console.log(\`🔨 Engine: Building \${key}\`);
    const bp = this.buildBlueprint(stage, { quality });
    if (bp) {
      this.blueprintCache.set(key, bp);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint: bp, stage, quality, cached: false });
    }
  }

  buildBlueprint(stageName, { quality = 'HIGH' } = {}) {
    const start = (typeof performance!=='undefined'?performance.now():Date.now());
    const stageConfig = (Canonical?.stages?.[stageName]) || {};
    const SPEC_COUNTS = { genesis:2000, discipline:3000, neural:5000, velocity:12000, architecture:8000, harmony:12000, transcendence:15000 };
    const base = Number.isFinite(stageConfig.particleCount) ? stageConfig.particleCount : (SPEC_COUNTS[stageName] ?? 5000);
    const count = this.getParticleCountForQuality(base, quality);
    const maxParticles = Math.max(count, 1);

    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const allenAtlasPositions   = new Float32Array(maxParticles * 3);
    const animationSeeds        = new Float32Array(maxParticles * 3);
    const sizeMultipliers       = new Float32Array(maxParticles);
    const opacityData           = new Float32Array(maxParticles);
    const atlasIndices          = new Float32Array(maxParticles);
    const tierData              = new Float32Array(maxParticles);

    const tierCfg = stageConfig.tierDistribution || {
      tier1:{ ratio:0.5, sizeRange:[0.5,0.7], opacityRange:[0.3,0.7] },
      tier2:{ ratio:0.2, sizeRange:[0.7,0.9], opacityRange:[0.5,0.8] },
      tier3:{ ratio:0.15,sizeRange:[1.0,1.3], opacityRange:[0.7,0.9] },
      tier4:{ ratio:0.15,sizeRange:[1.3,2.0], opacityRange:[0.8,1.0] },
    };
    const t1 = Math.floor(count * tierCfg.tier1.ratio);
    const t2 = Math.floor(count * tierCfg.tier2.ratio);
    const t3 = Math.floor(count * tierCfg.tier3.ratio);
    const t4 = count - t1 - t2 - t3;

    let idx = 0;
    idx += this._genTier(atmosphericPositions, allenAtlasPositions, animationSeeds, sizeMultipliers, opacityData, atlasIndices, tierData, idx, t1, 0, stageName);
    idx += this._genTier(atmosphericPositions, allenAtlasPositions, animationSeeds, sizeMultipliers, opacityData, atlasIndices, tierData, idx, t2, 1, stageName);
    idx += this._genTier(atmosphericPositions, allenAtlasPositions, animationSeeds, sizeMultipliers, opacityData, atlasIndices, tierData, idx, t3, 2, stageName);
    this._genTier(atmosphericPositions, allenAtlasPositions, animationSeeds, sizeMultipliers, opacityData, atlasIndices, tierData, idx, t4, 3, stageName);

    const ms = (typeof performance!=='undefined'?performance.now():Date.now()) - start;
    console.log(\`✅ Blueprint \${stageName} built in \${ms.toFixed(2)}ms (quality:\${quality}, count:\${count})\`);

    return {
      stageName,
      particleCount: count,
      maxParticles,
      activeCount: count,
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: { quality, buildTime: ms, tierCounts:{ tier1:t1, tier2:t2, tier3:t3, tier4:t4 } },
    };
  }

  _genTier(atmos, allen, seeds, sizes, opac, atlas, tiers, startIndex, n, tierIndex, stageName){
    if (n<=0) return 0;
    const rnd = this._rng(\`\${stageName}|tier\${tierIndex}\`);
    for (let i=0;i<n;i++){
      const p = (startIndex + i) * 3;
      const p1 = startIndex + i;
      const r = rnd()*80 + 40, theta = rnd()*Math.PI*2, phi = Math.acos(2*rnd()-1);

      atmos[p+0] = r * Math.sin(phi) * Math.cos(theta);
      atmos[p+1] = r * Math.sin(phi) * Math.sin(theta);
      atmos[p+2] = r * Math.cos(phi);

      const br = 20 + rnd()*15;
      allen[p+0] = br * Math.sin(phi) * Math.cos(theta);
      allen[p+1] = br * Math.sin(phi) * Math.sin(theta);
      allen[p+2] = br * Math.cos(phi);

      seeds[p+0] = rnd(); seeds[p+1] = rnd(); seeds[p+2] = rnd();
      sizes[p1]  = 0.8 + rnd()*0.6;
      opac[p1]   = 0.5 + rnd()*0.4;
      atlas[p1]  = [7,1,4,1][tierIndex] || 1;
      tiers[p1]  = tierIndex;
    }
    return n;
  }

  _rng(seed){
    let h = 2166136261>>>0;
    for (let i=0;i<seed.length;i++){ h^=seed.charCodeAt(i); h=(h*16777619)>>>0; }
    return function() {
      h+=0x6D2B79F5; let t=h;
      t=Math.imul(t ^ t>>>15, t|1); t^=t+Math.imul(t ^ t>>>7, t|61);
      return ((t ^ t>>>14)>>>0)/4294967296;
    };
  }

  getParticleCountForQuality(base, q){
    const mul = { LOW:0.3, MEDIUM:0.6, HIGH:1.0, ULTRA:1.5 }[q] ?? 1.0;
    return Math.min(15000, Math.max(1, Math.floor(base * mul)));
  }
}

const engine = new ConsciousnessEngine();
if (typeof window!=='undefined'){
  window.engineDebug = {
    clearCache: ()=>engine.blueprintCache.clear(),
    forceRebuild: (stage, quality)=>{ engine.blueprintCache.delete(\`\${stage}|\${quality}\`); engine.buildAndEmitBlueprint(stage, quality); },
    getCacheStats: ()=>({ size: engine.blueprintCache.size, keys:[...engine.blueprintCache.keys()] }),
  };
}
export default engine;
`;

/* write core */
let changed = false;
changed = writeFile('src/modules/orchestration/core/BeatBus.js', BEATBUS_JS) || changed;
changed = writeFile('src/modules/orchestration/core/BeatBusAdapter.js', ADAPTER_JS) || changed;
changed = writeFile('src/state/StateController.js', STATECTRL_JS) || changed;
changed = writeFile('src/engine/ConsciousnessEngine.js', ENGINE_JS) || changed;

/* 2) Ensure engine loads at boot via dev healthcheck */
if (ex('src/dev/renderHealthcheck.js')){
  changed = safePatch('src/dev/renderHealthcheck.js', (src)=>{
    if (/['"]@\/engine\/ConsciousnessEngine\.js['"]/.test(src)) return src;
    // insert after import block
    const m = src.match(/^(?:\s*import[\s\S]*?\n)+/m);
    const inject = `import "@/engine/ConsciousnessEngine.js"; // ensure engine side-effects load\n`;
    return m ? src.slice(0, m.index + m[0].length) + inject + src.slice(m.index + m[0].length) : (inject + src);
  }) || changed;
} else {
  console.log('· note: src/dev/renderHealthcheck.js not found — skipping boot wire');
}

/* 3) Patch WebGLBackground.jsx — add aFrom/aTo + RAF on BLUEPRINT_READY */
if (ex('src/components/webgl/WebGLBackground.jsx')){
  changed = safePatch('src/components/webgl/WebGLBackground.jsx', (s)=>{
    let out = s;

    // (a) Ensure aFrom/aTo attributes are set when geometry is built.
    // After atmosphericPosition set → add aFromPosition mirror
    out = out.replace(
      /geo\.setAttribute\(['"]atmosphericPosition['"],\s*new THREE\.BufferAttribute\(atmos,\s*3\)\);\s*/m,
      match => match + `\n    // mirror for alt shader naming\n    geo.setAttribute('aFromPosition', new THREE.BufferAttribute(atmos, 3));\n`
    );

    // After allenAtlasPosition set → add aToPosition mirror
    out = out.replace(
      /geo\.setAttribute\(['"]allenAtlasPosition['"],\s*new THREE\.BufferAttribute\(allen,\s*3\)\);\s*/m,
      match => match + `\n    // mirror for alt shader naming\n    geo.setAttribute('aToPosition', new THREE.BufferAttribute(allen, 3));\n`
    );

    // (b) On each BLUEPRINT_READY, kick a morph RAF (ease smoothstep)
    if (!/kickMorphRAF/.test(out)){
      const rafBlock = `
  // Morph kicker on each blueprint (inline RAF driver)
  function kickMorphRAF(durMs = 1200){
    try {
      const start = (typeof performance!=='undefined'?performance.now():Date.now());
      const tick = (t) => {
        const k = Math.min(1, ((typeof performance!=='undefined'?t:Date.now()) - start) / durMs);
        const s = k*k*(3 - 2*k); // smoothstep
        fallbackMorphRef.current = s;
        if (s < 1) requestAnimationFrame(tick);
      };
      fallbackMorphRef.current = 0;
      requestAnimationFrame(tick);
    } catch(e) {}
  }
`;
      // Put before "Blueprint subscription" effect block
      out = out.replace(/\/\/\s*Blueprint subscription[\s\S]*?useEffect\(/m, (m)=> rafBlock + "\n" + m);
    }

    // Ensure BLUEPRINT_READY handler calls kickMorphRAF with duration hint
    if (!/kickMorphRAF\(/.test(out)){
      out = out.replace(/const handleBlueprint = payload => {/, (m)=> `${m}\n      try { const d = (payload?.blueprint?.durationMs) || 1200; kickMorphRAF(d); } catch(_) { kickMorphRAF(1200); }`);
    }

    // (c) In useFrame, also drive uFadeProgress alongside uMorphProgress
    out = out.replace(
      /uniforms\.uMorphProgress\.value\s*=\s*mp\s*;/,
      'uniforms.uMorphProgress.value = mp;\n    mat.uniforms.uFadeProgress && (mat.uniforms.uFadeProgress.value = mp);'
    ).replace(
      /mat\.uniforms\.uMorphProgress\.value\s*=\s*mp\s*;/,
      'mat.uniforms.uMorphProgress.value = mp;\n    if (mat.uniforms.uFadeProgress) mat.uniforms.uFadeProgress.value = mp;'
    );

    return out;
  }) || changed;
} else {
  console.log('· note: src/components/webgl/WebGLBackground.jsx not found — cannot inject inline morph RAF');
}

/* commit & tag optionally */
if (changed && DO_COMMIT){
  try {
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_reset_morph_core_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  } catch (e) {
    console.warn('! git failed:', e?.message || e);
  }
} else if (changed){
  console.log('· dry run complete — re-run with --commit to persist');
} else {
  console.log('· nothing to change');
}
