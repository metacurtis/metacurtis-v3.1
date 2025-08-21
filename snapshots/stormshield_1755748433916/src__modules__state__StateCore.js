// src/modules/state/StateCore.js
/**
 * StateCore - Minimal Central State Authority (Phase 1)
 * Wraps existing atoms behind a unified interface: get/set/subscribe/snapshot
 * No async work; safe to init synchronously.
 *
 * @canon-boundary STATE_AUTHORITY
 * @sst-version 3.0
 */

import { narrativeAtom } from '@/stores/atoms/narrativeAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';
import { interactionAtom } from '@/stores/atoms/interactionAtom';
import { resourceAtom } from '@/stores/atoms/resourceAtom';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { clockAtom } from '@/stores/atoms/clockAtom';

class StateCore {
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
    this.initTime = null;

    // Canon Suite contract
    this.canonContract = {
      boundary: 'STATE_AUTHORITY',
      version: '1.0.0',
      sstCompliance: 'v3.0',
    };

    if (import.meta.env.DEV) {
      this._setupDevTools();
    }
  }

  /**
   * Ensure initialization before operations
   */
  ensureInit() {
    if (!this.initialized) {
      this.initialize();
    }
  }

  /**
   * Initialize StateCore (synchronous for Phase 1)
   * @canon-gate INITIALIZATION
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    console.log('🎯 StateCore: Initializing (Phase 1)...');

    try {
      // Verify all atoms are accessible
      this._verifyAtoms();

      // Set conservative initial state
      this._setInitialState();

      // Mark as initialized
      this.initialized = true;
      this.initTime = Date.now();

      console.log('✅ StateCore: Initialized successfully');

      // Notify Canon Suite (lowercase window.canon)
      if (typeof globalThis !== 'undefined' && globalThis.canon?.validate) {
        globalThis.canon.validate('STATE_CORE_INIT', {
          atoms: Object.keys(this.atoms),
          timestamp: this.initTime,
        });
      }

      return true;
    } catch (error) {
      console.error('❌ StateCore initialization failed:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Get state from specific atom
   * @param {string} atomName - Name of atom
   * @param {function} selector - Optional selector function
   */
  get(atomName, selector) {
    this.ensureInit();

    const atom = this.atoms[atomName];
    if (!atom || typeof atom.getState !== 'function') {
      console.error(`Unknown or invalid atom: ${atomName}`);
      return null;
    }

    const state = atom.getState();

    if (selector && typeof selector === 'function') {
      try {
        return selector(state);
      } catch (error) {
        console.error(`Selector error for ${atomName}:`, error);
        return state;
      }
    }

    return state;
  }

  /**
   * Set state for specific atom
   * @param {string} atomName - Name of atom
   * @param {any} newState - New state or updater function
   */
  set(atomName, newState) {
    this.ensureInit();

    const atom = this.atoms[atomName];
    if (!atom || typeof atom.setState !== 'function') {
      console.error(`Unknown or invalid atom: ${atomName}`);
      return false;
    }

    try {
      atom.setState(newState);

      if (import.meta.env.DEV) {
        console.log(
          `StateCore: Updated ${atomName}`,
          typeof newState === 'function' ? '[Function]' : newState
        );
      }

      return true;
    } catch (error) {
      console.error(`Failed to set state for ${atomName}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to atom changes
   * @param {string} atomName - Name of atom
   * @param {function} listener - Listener function
   */
  subscribe(atomName, listener) {
    const atom = this.atoms[atomName];
    if (!atom || typeof atom.subscribe !== 'function') {
      console.error(`Unknown or invalid atom: ${atomName}`);
      return () => {};
    }

    return atom.subscribe(listener);
  }

  /**
   * Get all current states (snapshot)
   */
  getSnapshot() {
    const snapshot = {};

    for (const [name, atom] of Object.entries(this.atoms)) {
      try {
        snapshot[name] = atom.getState?.();
      } catch (error) {
        console.error(`Failed to get state for ${name}:`, error);
        snapshot[name] = null;
      }
    }

    return snapshot;
  }

  /**
   * Verify all atoms are accessible
   * @private
   */
  _verifyAtoms() {
    const missing = [];

    for (const [name, atom] of Object.entries(this.atoms)) {
      if (!atom || typeof atom.getState !== 'function' || typeof atom.setState !== 'function') {
        missing.push(name);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing or invalid atoms: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Set conservative initial state
   * Phase 1: Don't touch stage (Director/BeatBus owns it)
   * @private
   */
  _setInitialState() {
    // Only set a safe quality default if missing
    const currentTier = this.get('quality', s => s?.currentTier);
    if (!currentTier) {
      this.set('quality', state => ({
        ...state,
        currentTier: 'HIGH',
      }));
    }
  }

  /**
   * Setup development tools
   * @private
   */
  _setupDevTools() {
    if (typeof window === 'undefined') return;

    window.StateCore = this;
    window.SC = {
      get: this.get.bind(this),
      set: this.set.bind(this),
      snapshot: this.getSnapshot.bind(this),
      atoms: this.atoms,
    };

    console.log('🔧 StateCore DevTools available:');
    console.log('  window.SC.get(atomName, selector?)');
    console.log('  window.SC.set(atomName, newState)');
    console.log('  window.SC.snapshot()');
  }

  /**
   * Canon Suite validation interface
   */
  validateCanonCompliance() {
    return {
      boundary: this.canonContract.boundary,
      version: this.canonContract.version,
      initialized: this.initialized,
      atoms: Object.keys(this.atoms),
      health: 'healthy',
    };
  }
}

// Create singleton instance
const stateCore = new StateCore();

// Auto-initialize in browser on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    stateCore.initialize();
  });
}

// Export both default and named for flexibility
export default stateCore;
export { stateCore };
