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

class _StateCore {
  constructor() {
    this.atoms = {
      narrative: narrativeAtom,
      performance: performanceAtom,
      interaction: interactionAtom,
      resource: resourceAtom,
      stage: stageAtom,
      quality: qualityAtom,
      clock: clockAtom,
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
    const a = this.atoms[name];
    if (!a) return null;
    const s = a.getState?.();
    return sel && typeof sel === 'function' ? sel(s) : s;
  }
  set(name, next) {
    const a = this.atoms[name];
    if (!a?.setState) return false;
    a.setState(next);
    if (import.meta.env.DEV) console.log('[SC set]', name);
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
    const stg = this.get('narrative', s => s?.currentStage);
    if (!stg) this.set('narrative', s => ({ ...s, currentStage: 'genesis' }));
    const tier = this.get('quality', s => s?.currentTier);
    if (!tier) this.set('quality', s => ({ ...s, currentTier: 'HIGH' }));
  }
  _devExpose() {
    if (typeof window === 'undefined') return;
    window.StateCore = this;
    window.SC = {
      get: this.get.bind(this),
      set: this.set.bind(this),
      snapshot: this.getSnapshot.bind(this),
      atoms: this.atoms,
    };
    console.log('🔧 SC dev handles ready (window.SC)');
  }
}

const instance = globalThis.__STATE_CORE__ || new _StateCore();
globalThis.__STATE_CORE__ = instance;

// Auto-init on DOM ready once
if (typeof window !== 'undefined' && !instance.initialized) {
  const start = () => instance.initialize();
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', start)
    : start();
}

// HMR safety
if (import.meta.hot) {
  import.meta.hot.accept?.();
  import.meta.hot.dispose?.(() => {
    /* nothing to clean for core wrapper */
  });
}

export default instance;
export const stateCore = instance;
