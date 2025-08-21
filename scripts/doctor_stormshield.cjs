#!/usr/bin/env node
/**
 * StormShield — BeatBus/StateCore re-render + event-storm doctor
 * - Backs up originals to snapshots/stormshield_<ts>/
 * - Makes StateCore & BeatBusBridge HMR-safe singletons
 * - Adds pause/resume + throttling + storm detector to the bridge
 * - Adds an UnlockConsole dev helper (rebinds SC/BUS, tap helpers)
 * - Patches main.jsx to load UnlockConsole in DEV
 *
 * Usage: node scripts/doctor_stormshield.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = p => path.join(ROOT, 'src', p);
const SNAP = path.join(ROOT, 'snapshots', `stormshield_${Date.now()}`);
fs.mkdirSync(SNAP, { recursive: true });

function write(file, content) {
  const abs = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs)) {
    const rel = path.relative(ROOT, abs);
    fs.copyFileSync(abs, path.join(SNAP, rel.replace(/[\\/]/g,'__')));
  }
  fs.writeFileSync(abs, content, 'utf8');
  console.log('  ✓ wrote', file);
}

/* ---------- UnlockConsole: keeps the console responsive in DEV ---------- */
const unlockConsole = `// src/dev/unlockConsole.js
// Minimal, safe dev helper: expose SC/BUS, taps, and keep boundary enforced.
(() => {
  const log = (...a)=>console.log('[UnlockConsole]', ...a);

  // Re-expose StateCore handles (lazy import so Vite dev path works)
  async function rebindSC() {
    if (window.SC) return;
    try {
      const mod = await import('/src/modules/state/StateCore.js');
      const core = mod.default || mod.stateCore || mod.StateCore;
      if (core) {
        window.StateCore = core;
        window.SC = {
          get: core.get?.bind(core),
          set: core.set?.bind(core),
          snapshot: core.getSnapshot?.bind(core),
          atoms: core.atoms || {}
        };
        log('SC rebound', Object.keys(window.SC.atoms));
      }
    } catch (e) { console.warn('[UnlockConsole] StateCore import failed:', e); }
  }

  function enforceBoundary() {
    try {
      if (window.BeatBus && window.canon?.boundary && !window.BeatBus.__boundaryEnforced) {
        window.canon.boundary.enforce(window.BeatBus);
        window.BeatBus.__boundaryEnforced = true;
        log('Boundary enforced');
      }
    } catch (e) { /* ignore */ }
  }

  function wrapBus() {
    const BUS = window.BeatBus;
    if (!BUS || BUS.__emitWrapped) return;
    const _emit = BUS.emit?.bind(BUS);
    if (typeof _emit !== 'function') return;
    BUS.emit = (evt, payload) => {
      BUS.lastEmit = { evt, payload, t: Date.now() };
      BUS.eventLog = BUS.eventLog || [];
      BUS.eventLog.push(BUS.lastEmit);
      if (BUS.eventLog.length > 400) BUS.eventLog.shift();
      return _emit(evt, payload);
    };
    BUS.getDebugInfo = () => {
      const listeners = {};
      if (BUS.listeners?.forEach) BUS.listeners.forEach((set, key) => listeners[key] = set.size);
      return { listeners, lastEmit: BUS.lastEmit, logSize: BUS.eventLog?.length || 0 };
    };
    BUS.__emitWrapped = true;
    log('BeatBus emit wrapped (debug)');
  }

  function installTaps() {
    const BUS = window.BeatBus;
    if (!BUS) return;
    window.busTap = window.busTap || ((evt, fn = (p)=>console.log('[tap]', evt, p)) => BUS.on?.(evt, fn));
    ['STAGE_CHANGE','QUALITY_CHANGE','BLUEPRINT_READY','STATE_STAGE_UPDATED','STATE_QUALITY_UPDATED']
      .forEach(ev => window.busTap(ev));
    log('Taps installed');
  }

  function boot() {
    enforceBoundary();
    wrapBus();
    installTaps();
    rebindSC();
    window.__UNLOCK = {
      pause: () => window.BeatBusBridge?.pause?.(),
      resume: () => window.BeatBusBridge?.resume?.(),
      status: () => ({
        boundary: window.canon?.boundary?.getReport?.(),
        bus: window.BeatBus?.getDebugInfo?.(),
        scAtoms: Object.keys(window.SC?.atoms || {})
      })
    };
    log('Ready. Shortcuts: window.SC, window.BeatBus, window.__UNLOCK');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();
})();
`;

write('src/dev/unlockConsole.js', unlockConsole);

/* ---------- StateCore: singleton + HMR safe ---------- */
const stateCore = `// src/modules/state/StateCore.js
/**
 * StateCore — Phase 1/2, HMR-safe singleton
 * Wraps atoms; exposes get/set/subscribe/snapshot; initializes once.
 */

import { narrativeAtom }   from '@/stores/atoms/narrativeAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';
import { interactionAtom } from '@/stores/atoms/interactionAtom';
import { resourceAtom }    from '@/stores/atoms/resourceAtom';
import { stageAtom }       from '@/stores/atoms/stageAtom';
import { qualityAtom }     from '@/stores/atoms/qualityAtom';
import { clockAtom }       from '@/stores/atoms/clockAtom';

class _StateCore {
  constructor() {
    this.atoms = {
      narrative:   narrativeAtom,
      performance: performanceAtom,
      interaction: interactionAtom,
      resource:    resourceAtom,
      stage:       stageAtom,
      quality:     qualityAtom,
      clock:       clockAtom,
    };
    this.initialized = false;
    if (import.meta.env.DEV) this._devExpose();
  }

  async initialize() {
    if (this.initialized) return true;
    this._verifyAtoms();
    this._ensureDefaults();
    this.initialized = true;
    if (import.meta.env.DEV) console.log('✅ StateCore initialized');
    return true;
  }

  get(name, sel) {
    const a = this.atoms[name]; if (!a) return null;
    const s = a.getState?.(); return sel && typeof sel === 'function' ? sel(s) : s;
  }
  set(name, next) {
    const a = this.atoms[name]; if (!a?.setState) return false;
    a.setState(next); if (import.meta.env.DEV) console.log('[SC set]', name); return true;
  }
  subscribe(name, fn) {
    const a = this.atoms[name]; return a?.subscribe?.(fn) || (()=>{});
  }
  getSnapshot() {
    const out = {}; for (const [k,a] of Object.entries(this.atoms)) out[k] = a?.getState?.();
    return out;
  }

  _verifyAtoms() {
    const bad = Object.entries(this.atoms).filter(([_,a]) => !a || typeof a.getState !== 'function');
    if (bad.length) throw new Error('Missing/invalid atoms: '+bad.map(([k])=>k).join(', '));
  }
  _ensureDefaults() {
    const stg = this.get('narrative', s=>s?.currentStage);
    if (!stg) this.set('narrative', s => ({ ...s, currentStage: 'genesis' }));
    const tier = this.get('quality', s=>s?.currentTier);
    if (!tier) this.set('quality', s => ({ ...s, currentTier: 'HIGH' }));
  }
  _devExpose() {
    if (typeof window === 'undefined') return;
    window.StateCore = this;
    window.SC = {
      get: this.get.bind(this),
      set: this.set.bind(this),
      snapshot: this.getSnapshot.bind(this),
      atoms: this.atoms
    };
    console.log('🔧 SC dev handles ready (window.SC)');
  }
}

const instance = globalThis.__STATE_CORE__ || new _StateCore();
globalThis.__STATE_CORE__ = instance;

// Auto-init on DOM ready once
if (typeof window !== 'undefined' && !instance.initialized) {
  const start = () => instance.initialize();
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
}

// HMR safety
if (import.meta.hot) {
  import.meta.hot.accept?.();
  import.meta.hot.dispose?.(() => { /* nothing to clean for core wrapper */ });
}

export default instance;
export const stateCore = instance;
`;

write('src/modules/state/StateCore.js', stateCore);

/* ---------- BeatBusBridge: singleton + pause/resume + throttle + storm detector ---------- */
const bridge = `// src/modules/state/BeatBusBridge.js
/**
 * BeatBusBridge — StormShield edition (HMR-safe)
 * - Idempotent initialize()
 * - pause()/resume()
 * - throttled handlers to avoid re-render storms
 * - storm detector auto-pauses if rate too high
 */

import StateCore from './StateCore';
let BeatBus;
try {
  const mod = await import('@/modules/orchestration/core/BeatBus');
  BeatBus = mod.default || mod.BeatBus || mod;
} catch {
  BeatBus = window.BeatBus;
}

function throttle(fn, ms = 16) {
  let t = 0, lastArgs, pending = false;
  return (...args) => {
    lastArgs = args;
    const now = performance.now();
    if (now - t >= ms) {
      t = now; return fn(...lastArgs);
    }
    if (!pending) {
      pending = true;
      setTimeout(() => { pending = false; t = performance.now(); fn(...lastArgs); }, ms);
    }
  };
}

class _BeatBusBridge {
  constructor() {
    this.eventMappings = new Map();
    this.subs = new Map();
    this.initialized = false;
    this.paused = false;
    this.eventCount = 0;
    this._stormWindow = [];
    if (import.meta.env.DEV) this._devExpose();
  }

  initialize() {
    if (this.initialized) return;
    if (!BeatBus) { console.warn('[Bridge] BeatBus not ready'); return; }
    if (!StateCore.initialized) StateCore.initialize();

    this._setupCoreMappings();
    this._connect();
    this._watchStorms();
    this._wireReverseFlow();

    this.initialized = true;
    console.log('✅ BeatBusBridge initialized (mappings:', this.eventMappings.size, ')');
  }

  pause()  { this.paused = true;  console.warn('⏸️ Bridge paused'); }
  resume() { this.paused = false; console.warn('▶️ Bridge resumed'); }

  _setupCoreMappings() {
    // STAGE_CHANGE -> narrative/stage
    this.map('STAGE_CHANGE', throttle((d) => {
      if (!d) return;
      StateCore.set('narrative', s => ({ ...s, currentStage: d.stage || d.to, isTransitioning: false, stageStartTime: Date.now() }));
      if (StateCore.atoms.stage) {
        const index = ['genesis','discipline','neural','velocity','architecture','harmony','transcendence'].indexOf(d.stage || d.to);
        StateCore.set('stage', s => ({ ...s, current: d.stage || d.to, index }));
      }
    }, 16));

    // QUALITY_CHANGE -> quality
    this.map('QUALITY_CHANGE', throttle((d) => {
      if (!d) return;
      const tier = d.tier || d.quality;
      StateCore.set('quality', s => ({ ...s, currentTier: tier, dpr: d.dpr ?? s.dpr, particleMultiplier: d.multiplier ?? s.particleMultiplier }));
    }, 16));

    // PERFORMANCE_UPDATE -> performance
    this.map('PERFORMANCE_UPDATE', throttle((d) => {
      if (!d) return;
      StateCore.set('performance', s => ({ ...s, fps: d.fps ?? s.fps, frameTime: d.frameTime ?? s.frameTime, particleCount: d.particleCount ?? s.particleCount }));
    }, 16));

    // FRAME_TICK -> clock
    this.map('FRAME_TICK', throttle((d) => {
      if (!d || !StateCore.atoms.clock) return;
      const cur = StateCore.get('clock') || {};
      StateCore.atoms.clock.setState({ ...cur, fps: d.fps ?? cur.fps, deltaMs: d.deltaMs ?? cur.deltaMs, averageFrameTime: d.averageFrameTime ?? cur.averageFrameTime });
    }, 32));
  }

  _connect() {
    for (const [evt, handler] of this.eventMappings) {
      const fn = (data) => {
        if (this.paused) return;
        try {
          handler(data);
          this._tick();
          if (import.meta.env.DEV) console.debug('🌉 BeatBus → StateCore', evt, data);
        } catch (e) { console.error('Bridge handler error', evt, e); }
      };
      BeatBus.on(evt, fn);
      this.subs.set(evt, fn);
    }
  }

  _wireReverseFlow() {
    // narrative -> STATE_STAGE_UPDATED
    this._unN = StateCore.subscribe('narrative', (s) => {
      if (!s?.currentStage || this.paused) return;
      BeatBus.emit?.('STATE_STAGE_UPDATED', { stage: s.currentStage, progress: s.globalProgress, source: 'state-core' });
    });
    // quality -> STATE_QUALITY_UPDATED
    this._unQ = StateCore.subscribe('quality', (s) => {
      if (!s?.currentTier || this.paused) return;
      BeatBus.emit?.('STATE_QUALITY_UPDATED', { tier: s.currentTier, dpr: s.dpr, source: 'state-core' });
    });
  }

  map(evt, handler) { this.eventMappings.set(evt, handler); }

  emit(evt, data) {
    BeatBus.emit?.(evt, { ...data, source: 'state-core', t: Date.now() });
  }

  _tick() {
    const now = Date.now();
    this._stormWindow.push(now);
    // keep 2s window
    while (this._stormWindow.length && now - this._stormWindow[0] > 2000) this._stormWindow.shift();
    this.eventCount++;
  }

  _watchStorms() {
    this._stormTimer = setInterval(() => {
      const rate = this._stormWindow.length / 2; // events/sec over last 2s
      if (rate > 200) {
        console.warn('🌪️ Event storm detected (~', Math.round(rate), '/sec ). Auto-pausing bridge. window.BeatBusBridge.resume() to continue.');
        this.pause();
      }
    }, 500);
  }

  dispose() {
    if (!BeatBus) return;
    for (const [evt, fn] of this.subs) BeatBus.off?.(evt, fn);
    this.subs.clear();
    if (this._unN) this._unN();
    if (this._unQ) this._unQ();
    clearInterval(this._stormTimer);
    this.initialized = false;
    console.log('🧹 Bridge disposed');
  }

  _devExpose() {
    if (typeof window === 'undefined') return;
    window.BeatBusBridge = this;
    window.BB = {
      pause:  () => this.pause(),
      resume: () => this.resume(),
      mappings: () => [...this.eventMappings.keys()],
      status: () => ({ initialized: this.initialized, paused: this.paused, eventCount: this.eventCount })
    };
  }
}

const bridge = globalThis.__BEATBUS_BRIDGE__ || new _BeatBusBridge();
globalThis.__BEATBUS_BRIDGE__ = bridge;

// Auto init once DOM is ready
if (typeof window !== 'undefined') {
  const start = () => bridge.initialize();
  if (!bridge.initialized) (document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', () => setTimeout(start, 50))
    : setTimeout(start, 50));
}

// HMR safety
if (import.meta.hot) {
  import.meta.hot.accept?.();
  import.meta.hot.dispose?.(() => bridge.dispose());
}

export default bridge;
`;

write('src/modules/state/BeatBusBridge.js', bridge);

/* ---------- Patch main.jsx to load UnlockConsole in DEV & ensure state loads ---------- */
const mainPath = SRC('main.jsx');
if (fs.existsSync(mainPath)) {
  let s = fs.readFileSync(mainPath, 'utf8');

  // ensure StateCore + Bridge are imported so their DOM-ready hooks run
  if (!/modules\/state\/StateCore\.js/.test(s)) {
    s = s.replace(/(import ['"].*?index\.css['"];?\s*)/,
      `$1\nimport '@/modules/state/StateCore.js';\nimport '@/modules/state/BeatBusBridge.js';\n`);
  }
  // add UnlockConsole in DEV if missing
  if (!/dev\/unlockConsole\.js/.test(s)) {
    if (/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{/.test(s)) {
      s = s.replace(/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{/,
        `if (import.meta.env.DEV) {\n  import('./dev/unlockConsole.js').then(()=>console.log('UnlockConsole active'));`);
    } else {
      s += `\n\nif (import.meta.env.DEV) {\n  import('./dev/unlockConsole.js').then(()=>console.log('UnlockConsole active'));\n}\n`;
    }
  }
  fs.writeFileSync(mainPath, s, 'utf8');
  console.log('  ✓ patched src/main.jsx');
} else {
  console.log('  ℹ src/main.jsx not found; skipped main patch');
}

console.log('\n📦 Backups saved to:', path.relative(ROOT, SNAP));
console.log('✅ StormShield applied. Restart dev server if needed.\n');
