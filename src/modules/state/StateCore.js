// src/modules/state/StateCore.js
/**
 * StateCore — Phase 1/2, HMR-safe singleton
 * Wraps atoms; exposes get/set/subscribe/snapshot; initializes once.
 */

import { narrativeAtom } from '@/stores/atoms/narrativeAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';
import { interactionAtom } from '@/stores/atoms/interactionAtom';
import { resourceAtom } from '@/stores/atoms/resourceAtom';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { clockAtom } from '@/stores/atoms/clockAtom';


// @doctor:phase4b-hmr-dbdff18d - Bridge HMR cleanup
// @doctor:4b-disposers
const __doctorDisposers = [];const __hmrDisposers = [];
// Original dispose method if exists
const originalDispose = typeof this?.dispose === 'function' ? this.dispose.bind(this) : null;

// Enhanced dispose that cleans up all listeners
this.dispose = () => {
  // Call original dispose if it existed
  if (originalDispose) originalDispose();

  // Clean up tracked listeners
  __hmrDisposers.forEach((disposer) => {
    if (typeof disposer === 'function') {
      try {disposer();} catch (e) {console.warn('Dispose error:', e);}
    }
  });
  __hmrDisposers.length = 0;
};

// Wrap listener registration to capture unsubs
const __wrapListener = (target, method, originalMethod) => {
  return function (...args) {
    const result = originalMethod.apply(this, args);
    if (typeof result === 'function') {
      __hmrDisposers.push(result);
    }
    return result;
  };
};

// Apply wrapper if BeatBus is available
if (typeof BeatBus !== 'undefined' && BeatBus) {
  const originalOn = BeatBus.on;
  const originalOnce = BeatBus.once;
  if (originalOn) BeatBus.on = __wrapListener(BeatBus, 'on', originalOn);
  if (originalOnce) BeatBus.once = __wrapListener(BeatBus, 'once', originalOnce);
}
class _StateCore {
  constructor() {
    this.atoms = {
      narrative: narrativeAtom,
      performance: performanceAtom,
      interaction: interactionAtom,
      resource: resourceAtom,
      stage: stageAtom,
      quality: qualityAtom,
      clock: clockAtom
    };
    this.initialized = false;
    if (import.meta.env.DEV) {this._devExpose();import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});}
  }

  async initialize() {
    if (this.initialized) return true;
    this._verifyAtoms();
    this._ensureDefaults();
    this.initialized = true;
    if (import.meta.env.DEV) {console.log('✅ StateCore initialized');import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});}
    return true;
  }

  get(name, sel) {
    const a = this.atoms[name];
    if (!a) return null;
    const s = a.getState?.();
    return sel && typeof sel === 'function' ? sel(s) : s;
  }
  set(name, next) {
    const a = this.atoms[name];
    if (!a?.setState) return false;
    a.setState(next);
    if (import.meta.env.DEV) {console.log('[SC set]', name);import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});}
    return true;
  }
  subscribe(name, fn) {
    const a = this.atoms[name];
    return a?.subscribe?.(fn) || (() => {});
  }
  getSnapshot() {
    const out = {};
    for (const [k, a] of Object.entries(this.atoms)) out[k] = a?.getState?.();
    return out;
  }

  _verifyAtoms() {
    const bad = Object.entries(this.atoms).filter(
      ([_, a]) => !a || typeof a.getState !== 'function'
    );
    if (bad.length) throw new Error('Missing/invalid atoms: ' + bad.map(([k]) => k).join(', '));
  }
  _ensureDefaults() {
    const stg = this.get('narrative', (s) => s?.currentStage);
    if (!stg) this.set('narrative', (s) => ({ ...s, currentStage: 'genesis' }));
    const tier = this.get('quality', (s) => s?.currentTier);
    if (!tier) this.set('quality', (s) => ({ ...s, currentTier: 'HIGH' }));
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
  const start = () => instance.initialize();__doctorDisposers.push(() => {

    document.removeEventListener('DOMContentLoaded', start);});document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) :
  start();
}

// HMR safety
if (import.meta.hot) {
  import.meta.hot.accept?.();
  import.meta.hot.dispose?.(() => {

    /* nothing to clean for core wrapper */});import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});
}

export default instance;
export const stateCore = instance;


// @doctor:phase4b-hmr-dbdff18d - HMR dispose hook
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (typeof this?.dispose === 'function') {
      this.dispose();
    }"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});
  });
}