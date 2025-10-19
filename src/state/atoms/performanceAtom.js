// src/state/atoms/performanceAtom.js
// Performance monitoring and adaptive quality state
import { createAtom } from './createAtom';

const initialState = {
  // Core metrics
  fps: 60,
  frameTime: 16.67,
  particleCount: 0,
  renderTime: 0,

  // Memory metrics
  memoryUsage: 0,
  textureMemory: 0,
  geometryCount: 0,

  // Quality settings
  currentTier: 'HIGH',
  targetFPS: 60,
  autoQuality: true,

  // Performance history
  fpsHistory: [],
  frameTimeHistory: [],

  // Device capabilities
  deviceTier: 'high',
  gpuTier: 2,
  isMobile: false,

  // Narrative performance (legacy compatibility)
  narrative: {
    currentStage: 'genesis',
    progress: 0,
    transitionActive: false,
  },
};

export const performanceAtom = createAtom(initialState, (get, set) => ({
  // Metric updates
  updateMetrics: metrics => {
    set(state => {
      const newState = { ...state, ...metrics };

      // Update history arrays (keep last 60 frames)
      if (metrics.fps !== undefined) {
        newState.fpsHistory = [...state.fpsHistory, metrics.fps].slice(-60);
      }
      if (metrics.frameTime !== undefined) {
        newState.frameTimeHistory = [...state.frameTimeHistory, metrics.frameTime].slice(-60);
      }

      return newState;
    });
  },

  // Quality management
  setTier: tier => {
    set(state => ({ ...state, currentTier: tier }));

    // Dispatch tier change event
    window.dispatchEvent(
      new CustomEvent('sst:qualityChange', {
        detail: { tier },
      })
    );
  },

  setAutoQuality: enabled => {
    set(state => ({ ...state, autoQuality: enabled }));
  },

  // Device detection
  setDeviceCapabilities: capabilities => {
    set(state => ({
      ...state,
      deviceTier: capabilities.tier || state.deviceTier,
      gpuTier: capabilities.gpuTier || state.gpuTier,
      isMobile: capabilities.isMobile !== undefined ? capabilities.isMobile : state.isMobile,
    }));
  },

  // Performance analysis
  getAverageFPS: () => {
    const history = get().fpsHistory;
    if (history.length === 0) return 60;
    return history.reduce((a, b) => a + b, 0) / history.length;
  },

  getPerformanceScore: () => {
    const state = get();
    const avgFPS = performanceAtom.getAverageFPS();
    const targetFPS = state.targetFPS;

    return Math.min(100, (avgFPS / targetFPS) * 100);
  },

  // Legacy narrative support (for SimpleStageController compatibility)
  setCurrentStage: stage => {
    set(state => ({
      ...state,
      narrative: { ...state.narrative, currentStage: stage },
    }));
  },

  setNarrativeProgress: progress => {
    set(state => ({
      ...state,
      narrative: { ...state.narrative, progress },
    }));
  },

  setTransitionActive: active => {
    set(state => ({
      ...state,
      narrative: { ...state.narrative, transitionActive: active },
    }));
  },

  // Reset
  reset: () => {
    set(initialState);
  },
}));

// Development helpers
if (import.meta.env.DEV) {
  window.performanceAtom = performanceAtom;
}
