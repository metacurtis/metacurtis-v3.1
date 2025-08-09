// src/stores/atoms/stageAtom.js
// SST v3.0 COMPLIANT - Stage management with BeatBus integration

import { createAtom } from './createAtom.js';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import BeatBus from '@modules/orchestration/core/BeatBus';
import { EVENTS } from '@theater/events.js';

/* ------------------------------------------------------------------ */
/*  SST v3.0 Canonical Stage Configuration                            */
/* ------------------------------------------------------------------ */
const STAGE_NAMES = [
  'genesis',
  'discipline', 
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence'
];

const STAGE_COUNT = STAGE_NAMES.length;

// SST v3.0 particle counts per stage
const STAGE_PARTICLES = {
  genesis: 2000,
  discipline: 3000,
  neural: 5000,
  velocity: 12000,
  architecture: 8000,
  harmony: 12000,
  transcendence: 15000
};

// SST v3.0 stage colors
const STAGE_COLORS = {
  genesis: { current: '#00ff00', next: '#22c55e' },
  discipline: { current: '#1e40af', next: '#3b82f6' },
  neural: { current: '#4338ca', next: '#a855f7' },
  velocity: { current: '#7c3aed', next: '#9333ea' },
  architecture: { current: '#0891b2', next: '#06b6d4' },
  harmony: { current: '#f59e0b', next: '#d97706' },
  transcendence: { current: '#ffffff', next: '#00ffcc' }
};

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */
const CONFIG = {
  BATCH_DELAY_MS: 16,
  MAX_BATCH_SIZE: 5,
  SMOOTHING_FACTOR: 0.8,
  AUTO_ADVANCE_MS: 3000,
  PROGRESS_THROTTLE_MS: 16
};

/* ------------------------------------------------------------------ */
/*  Initial State                                                     */
/* ------------------------------------------------------------------ */
const INITIAL_STATE = {
  currentStage: 'genesis',
  currentStageIndex: 0,
  stageProgress: 0,
  globalProgress: 0,
  stageConfig: {
    particleCount: STAGE_PARTICLES.genesis,
    colors: STAGE_COLORS.genesis
  },
  isTransitioning: false,
  autoAdvanceEnabled: false,
  lastTransition: 0,
  transitionHistory: [],
  _batch: [],
  _batchTimer: null,
  _lastProgressUpdate: 0
};

// SAFETY: Always return valid state
const ensureValidState = (state) => {
  if (!state) return { ...INITIAL_STATE };
  return {
    ...INITIAL_STATE,
    ...state,
    transitionHistory: Array.isArray(state.transitionHistory) ? state.transitionHistory : []
  };
};

/* ================================================================== */
/*  Batching Helper                                                   */
/* ================================================================== */
class TransitionBatcher {
  constructor() { 
    this.list = []; 
    this.tid = null; 
  }

  push(obj) {
    this.list.push(obj);
    if (this.list.length >= CONFIG.MAX_BATCH_SIZE) return this.flush();
    if (this.tid) clearTimeout(this.tid);
    this.tid = setTimeout(() => this.flush(), CONFIG.BATCH_DELAY_MS);
  }

  flush() {
    if (!this.list.length) return null;
    const b = [...this.list]; 
    this.list.length = 0;
    if (this.tid) { 
      clearTimeout(this.tid); 
      this.tid = null; 
    }
    return b;
  }
}

class ProgressSmoother {
  constructor() { 
    this.target = 0; 
    this.val = 0; 
    this.raf = null; 
  }
  
  to(p) {
    this.target = Math.max(0, Math.min(1, p));
    if (!this.raf) this.tick();
  }
  
  tick = () => {
    const d = this.target - this.val;
    if (Math.abs(d) < 0.001) { 
      this.val = this.target; 
      this.raf = null; 
      return;
    }
    this.val += d * (1 - CONFIG.SMOOTHING_FACTOR);
    this.raf = requestAnimationFrame(this.tick);
  };
  
  value() { return this.val; }
  
  dispose() { 
    if (this.raf) cancelAnimationFrame(this.raf); 
  }
}

/* ================================================================== */
/*  Stage Atom Definition                                             */
/* ================================================================== */
export const stageAtom = createAtom(INITIAL_STATE, (set, get) => {
  const batcher = new TransitionBatcher();
  const smoother = new ProgressSmoother();

  // Apply batched updates
  const applyBatch = () => {
    const batch = batcher.flush();
    if (!batch) return;
    
    const merged = batch.reduce((acc, cur) => ({ ...acc, ...cur }), {});
    const prev = ensureValidState(get());
    const next = ensureValidState({ ...prev, ...merged });

    // Track history (max 10)
    next.transitionHistory = [
      ...(prev.transitionHistory || []).slice(-9),
      { timestamp: Date.now(), data: merged }
    ];
    
    set(next, 'batched');

    // ONLY emit if stage ACTUALLY changed
    if (next.currentStage !== prev.currentStage) {
      const stageName = next.currentStage;
      
      console.log(`🎭 stageAtom: Emitting STAGE_CHANGE for ${stageName}`);
      
      BeatBus.emit(EVENTS.STAGE_CHANGE, {
        stage: stageName,
        stageIndex: next.currentStageIndex,
        config: {
          particleCount: STAGE_PARTICLES[stageName],
          colors: STAGE_COLORS[stageName]
        }
      });
    }
  };

  const scheduleFlush = () => requestAnimationFrame(applyBatch);

  const actions = {
    // Main stage change
    setStage(stageName) {
      // DEDUPE: Don't set if already there
      const prev = ensureValidState(get());
      if (prev.currentStage === stageName) {
        console.log(`🔄 Stage already ${stageName}, skipping`);
        return;
      }
      
      const idx = STAGE_NAMES.indexOf(stageName);
      if (idx === -1) {
        console.warn('Invalid stage:', stageName);
        return;
      }
      
      console.log(`🎯 stageAtom.setStage: ${stageName} (index: ${idx})`);
      
      batcher.push({
        currentStage: stageName,
        currentStageIndex: idx,
        stageProgress: 0,
        globalProgress: idx / (STAGE_COUNT - 1),
        stageConfig: {
          particleCount: STAGE_PARTICLES[stageName],
          colors: STAGE_COLORS[stageName]
        },
        isTransitioning: true,
        lastTransition: Date.now()
      });
      
      scheduleFlush();
      setTimeout(() => actions.setTransitioning(false), 200);
    },

    nextStage() {
      const state = ensureValidState(get());
      const next = Math.min(state.currentStageIndex + 1, STAGE_COUNT - 1);
      if (next !== state.currentStageIndex) {
        actions.setStage(STAGE_NAMES[next]);
      }
    },

    prevStage() {
      const state = ensureValidState(get());
      const prev = Math.max(state.currentStageIndex - 1, 0);
      if (prev !== state.currentStageIndex) {
        actions.setStage(STAGE_NAMES[prev]);
      }
    },

    goToStage(index) {
      if (index >= 0 && index < STAGE_COUNT) {
        actions.setStage(STAGE_NAMES[index]);
      }
    },

    setStageProgress(progress) {
      const now = performance.now();
      const state = ensureValidState(get());
      if (now - state._lastProgressUpdate < CONFIG.PROGRESS_THROTTLE_MS) return;
      
      smoother.to(progress);
      batcher.push({
        stageProgress: progress,
        _lastProgressUpdate: now
      });
      scheduleFlush();
    },

    setTransitioning(value) {
      batcher.push({ isTransitioning: !!value });
      scheduleFlush();
    },

    setAutoAdvanceEnabled(enabled) {
      batcher.push({ autoAdvanceEnabled: enabled });
      scheduleFlush();
    },

    getCurrentStage() {
      const state = ensureValidState(get());
      return state.currentStage;
    },

    getCurrentStageIndex() {
      const state = ensureValidState(get());
      return state.currentStageIndex;
    },

    getState() {
      return ensureValidState(get());
    },

    reset() {
      smoother.dispose();
      batcher.flush();
      set({ ...INITIAL_STATE }, 'reset');
      
      BeatBus.emit(EVENTS.STAGE_CHANGE, {
        stage: 'genesis',
        stageIndex: 0,
        config: {
          particleCount: STAGE_PARTICLES.genesis,
          colors: STAGE_COLORS.genesis
        }
      });
    }
  };

  // Auto-advance (with safety)
  if (typeof window !== 'undefined') {
    setInterval(() => {
      const state = ensureValidState(get());
      if (!state.autoAdvanceEnabled || state.isTransitioning) return;
      if (Date.now() - state.lastTransition < CONFIG.AUTO_ADVANCE_MS) return;
      actions.nextStage();
    }, CONFIG.AUTO_ADVANCE_MS);
  }

  return actions;
});

/* ------------------------------------------------------------------ */
/*  Global Access                                                      */
/* ------------------------------------------------------------------ */
if (typeof window !== 'undefined') {
  window.stageControls = {
    goToStage: (index) => stageAtom.goToStage(index),
    nextStage: () => stageAtom.nextStage(),
    prevStage: () => stageAtom.prevStage(),
    getCurrentStage: () => stageAtom.getCurrentStage(),
    getCurrentStageIndex: () => stageAtom.getCurrentStageIndex(),
    reset: () => stageAtom.reset(),
    
    // Test functions
    testStageChange: () => {
      console.log('Testing stage changes...');
      const stages = ['genesis', 'discipline', 'neural', 'velocity'];
      stages.forEach((stage, i) => {
        setTimeout(() => {
          console.log(`Setting stage to ${stage}`);
          stageAtom.setStage(stage);
        }, i * 1000);
      });
    }
  };
  
  console.log('🎭 stageAtom: Enhanced with safety checks');
  console.log('🎮 Available: window.stageControls');
  console.log('🧪 Test: window.stageControls.testStageChange()');
}

export default stageAtom;
