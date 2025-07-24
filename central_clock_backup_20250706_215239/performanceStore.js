/*  ──────────────────────────────────────────────────────────────────────────────
    src/stores/performanceStore.js
    MetaCurtis • Unified Performance + Narrative Store
    ✅ CORRECTED: Dashboard integration + Neural Shift compatibility
    ──────────────────────────────────────────────────────────────────────────────
    • Keeps all original FPS / jank tracking logic ✔
    • Adds "narrative" slice for stage-driven experience ✔
    • Adds enableNarrativeMode flag for instant rollback ✔
    • ✅ CORRECTED: 5-stage Neural Shift system ✔
    • ✅ ADDED: addEventLog method for analytics ✔
    • ✅ ADDED: Dashboard integration methods ✔
   --------------------------------------------------------------------------- */

import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js';

/* ── Constants ─────────────────────────── */
const FRAME_WINDOW = 120; // ≈2 s sliding window at 60 FPS
const UPDATE_INTERVAL = 500; // ms between averaged-metric store updates

/* ── Device info fallback ──────────────── */
const initialDeviceInfo =
  typeof DeviceCapabilities?.getInfo === 'function'
    ? DeviceCapabilities.getInfo()
    : {
        gpu: 'N/A',
        memory: 'N/A',
        cores: 'N/A',
        renderer: 'N/A',
        vendor: 'N/A',
        webglVersion: 'N/A',
      };
if (!initialDeviceInfo.gpu) initialDeviceInfo.gpu = 'N/A';

/* ── Internal rolling-window state ─────── */
let frameDeltasBuffer = [];
let jankFramesInWindowCounter = 0;
let lastStoreUpdateTime = 0;
let cumulativeJankSinceLastReset = 0;

/* ── ✅ ADDED: Event logging for analytics ─────── */
let eventLogBuffer = [];
const MAX_EVENT_LOG_SIZE = 100;

/* ─────────────────────────────────────────
   Zustand Store
   ───────────────────────────────────────── */
export const usePerformanceStore = create((set, get) => ({
  /* ── 1. Real-time Performance Metrics ───────────────────────────────────── */
  fps: 0,
  avgFrameTime: 0,
  jankCount: 0, // cumulative since last reset
  jankRatio: 0, // jank / total frames in window
  deltaMs: 0, // last frame delta

  /* ── 2. Device & Config ─────────────────────────────────────────────────── */
  device: initialDeviceInfo,
  jankThresholdMs: 33.4, // >30 FPS ≈ "jank"

  /* ── 3. ✅ CORRECTED: Neural Shift Narrative Slice (5-stage system) ────── */
  enableNarrativeMode: true, // global feature flag
  narrative: {
    currentStage: 'genesis', // ✅ CORRECTED: 5-stage system
    progress: 0, // 0 → 1 during tween
    transitionActive: false, // ✅ MAINTAINED: for backward compatibility
    isTransitioning: false, // ✅ ADDED: for narrativeStore compatibility
  },

  /* ── 4. ✅ ADDED: Event logging for analytics ──────────────────────────── */
  eventLog: [],

  /* ── 5. Setters / Actions ───────────────────────────────────────────────── */
  setDeviceInfo: info => set({ device: info }),

  /*  Performance tick – called each useFrame(delta) */
  tickFrame: delta => {
    const ms = delta * 1000;
    if (typeof ms !== 'number' || ms < 0 || Number.isNaN(ms)) {
      console.warn('PerformanceStore: Invalid delta time:', delta);
      return;
    }

    /* update rolling window */
    frameDeltasBuffer.push(ms);
    if (ms > get().jankThresholdMs) {
      jankFramesInWindowCounter++;
      cumulativeJankSinceLastReset++;
    }
    if (frameDeltasBuffer.length > FRAME_WINDOW) {
      const removed = frameDeltasBuffer.shift();
      if (removed > get().jankThresholdMs) jankFramesInWindowCounter--;
    }

    /* live delta for DevPerformanceMonitor */
    if (Math.abs(get().deltaMs - ms) > 0.05) set({ deltaMs: ms });

    /* throttled average refresh */
    const now = performance.now();
    if (now - lastStoreUpdateTime < UPDATE_INTERVAL) return;
    lastStoreUpdateTime = now;

    const n = frameDeltasBuffer.length;
    const sum = frameDeltasBuffer.reduce((s, t) => s + t, 0);
    const avg = n ? sum / n : 0;

    set({
      fps: avg ? 1000 / avg : 0,
      avgFrameTime: avg,
      jankCount: cumulativeJankSinceLastReset,
      jankRatio: n ? jankFramesInWindowCounter / n : 0,
    });
  },

  resetMetricsAndCounters: () => {
    frameDeltasBuffer = [];
    jankFramesInWindowCounter = 0;
    cumulativeJankSinceLastReset = 0;
    lastStoreUpdateTime = 0;
    set({ fps: 0, avgFrameTime: 0, jankCount: 0, jankRatio: 0, deltaMs: 0 });
  },

  setJankThreshold: ms => {
    if (typeof ms === 'number' && ms > 0) set({ jankThresholdMs: ms });
    else console.warn('PerformanceStore: invalid jank threshold', ms);
  },

  /* ── ✅ CORRECTED: Narrative setters with Neural Shift compatibility ───── */
  setEnableNarrativeMode: flag => set({ enableNarrativeMode: !!flag }),

  setCurrentStage: stage => {
    // ✅ ADDED: Validate stage name for 5-stage system
    const validStages = ['genesis', 'silent', 'awakening', 'acceleration', 'transcendence'];
    const validatedStage = validStages.includes(stage) ? stage : 'genesis';

    set(s => ({
      narrative: {
        ...s.narrative,
        currentStage: validatedStage,
      },
    }));

    // ✅ ADDED: Log stage changes for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 Performance Store: Stage updated to ${validatedStage}`);
    }
  },

  setNarrativeProgress: value => {
    const clampedValue = Math.max(0, Math.min(1, value));
    set(s => ({ narrative: { ...s.narrative, progress: clampedValue } }));
  },

  setTransitionActive: flag => {
    const isActive = !!flag;
    set(s => ({
      narrative: {
        ...s.narrative,
        transitionActive: isActive,
        isTransitioning: isActive, // ✅ ADDED: Sync both flags
      },
    }));
  },

  /* ── ✅ ADDED: Narrative integration methods ──────────────────────────── */
  updateNarrativeState: narrativeData => {
    const { currentStage, progress, isTransitioning } = narrativeData;

    set(s => ({
      narrative: {
        ...s.narrative,
        ...(currentStage && { currentStage }),
        ...(typeof progress === 'number' && { progress }),
        ...(typeof isTransitioning === 'boolean' && {
          transitionActive: isTransitioning,
          isTransitioning,
        }),
      },
    }));
  },

  /* ── ✅ ADDED: Event logging with safety checks ───────────────────────── */
  addEventLog: (eventType, eventData = {}) => {
    try {
      const event = {
        type: eventType,
        data: eventData,
        timestamp: performance.now(),
        fps: get().fps,
        stage: get().narrative.currentStage,
        id: Math.random().toString(36).substr(2, 9),
      };

      // Add to buffer
      eventLogBuffer.push(event);

      // Trim buffer if too large
      if (eventLogBuffer.length > MAX_EVENT_LOG_SIZE) {
        eventLogBuffer = eventLogBuffer.slice(-MAX_EVENT_LOG_SIZE);
      }

      // Update store
      set({ eventLog: [...eventLogBuffer] });

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Event: ${eventType}`, eventData);
      }

      return event.id;
    } catch (error) {
      console.warn('PerformanceStore: Failed to log event:', error);
      return null;
    }
  },

  clearEventLog: () => {
    eventLogBuffer = [];
    set({ eventLog: [] });
  },

  getEventLog: () => {
    return [...eventLogBuffer];
  },

  /* ── ✅ ADDED: Dashboard integration methods ──────────────────────────── */
  getPerformanceSnapshot: () => {
    const state = get();
    return {
      performance: {
        fps: state.fps,
        avgFrameTime: state.avgFrameTime,
        deltaMs: state.deltaMs,
        jankCount: state.jankCount,
        jankRatio: state.jankRatio,
        jankThreshold: state.jankThresholdMs,
      },
      narrative: {
        currentStage: state.narrative.currentStage,
        progress: state.narrative.progress,
        transitionActive: state.narrative.transitionActive,
        isTransitioning: state.narrative.isTransitioning,
        enableNarrativeMode: state.enableNarrativeMode,
      },
      device: state.device,
      timestamp: performance.now(),
    };
  },

  /* ── ✅ ADDED: Performance analysis for neural shift correlation ───────── */
  analyzePerformanceCorrelation: () => {
    const state = get();
    const { fps, narrative } = state;

    // Expected FPS based on cognitive load (neural shift complexity)
    const cognitiveLoadMap = {
      genesis: 0.3,
      silent: 0.5,
      awakening: 0.8,
      acceleration: 0.9,
      transcendence: 1.0,
    };

    const cognitiveLoad = cognitiveLoadMap[narrative.currentStage] || 0.3;
    const expectedFPS = 60 - cognitiveLoad * 20; // Simple correlation model
    const deviation = Math.abs(fps - expectedFPS);

    let correlation = 'optimal';
    if (deviation > 10) correlation = 'concerning';
    else if (deviation > 5) correlation = 'acceptable';

    return {
      cognitiveLoad,
      expectedFPS,
      actualFPS: fps,
      deviation,
      correlation,
      stage: narrative.currentStage,
    };
  },

  /* ── ✅ ADDED: Development helpers ─────────────────────────────────────── */
  devGetState: () => {
    if (process.env.NODE_ENV === 'development') {
      return get().getPerformanceSnapshot();
    }
    return null;
  },

  devSimulateJank: (duration = 100) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐌 Simulating ${duration}ms jank...`);
      get().addEventLog('dev_jank_simulation', { duration });

      // Simulate jank by adding fake high frame time
      const fakeMs = duration;
      frameDeltasBuffer.push(fakeMs);
      if (fakeMs > get().jankThresholdMs) {
        jankFramesInWindowCounter++;
        cumulativeJankSinceLastReset++;
      }
    }
  },

  devResetPerformance: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Resetting performance metrics...');
      get().resetMetricsAndCounters();
      get().clearEventLog();
    }
  },
}));

// ✅ ADDED: Global development access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.usePerformanceStore = usePerformanceStore;
  window.performanceUtils = {
    getSnapshot: () => usePerformanceStore.getState().getPerformanceSnapshot(),
    analyzeCorrelation: () => usePerformanceStore.getState().analyzePerformanceCorrelation(),
    simulateJank: ms => usePerformanceStore.getState().devSimulateJank(ms),
    resetPerformance: () => usePerformanceStore.getState().devResetPerformance(),
    logEvent: (type, data) => usePerformanceStore.getState().addEventLog(type, data),
  };
}

export default usePerformanceStore;

/*
🎯 CORRECTED PERFORMANCE STORE INTEGRATION ✅

✅ NEURAL SHIFT COMPATIBILITY:
- Updated narrative slice to 5-stage system (genesis → silent → awakening → acceleration → transcendence)
- Added stage validation for Neural Shift cognitive transformation
- Synchronized transitionActive and isTransitioning flags
- Performance correlation analysis for cognitive load tracking

✅ DASHBOARD INTEGRATION:
- Added addEventLog method with safety checks (critical for dashboard)
- Added updateNarrativeState for external narrative store integration
- Added getPerformanceSnapshot for comprehensive state access
- Added performance correlation analysis for neural shift validation

✅ EVENT LOGGING SYSTEM:
- Safe event logging with try/catch protection
- Circular buffer management (max 100 events)
- Development-friendly logging with console output
- Event correlation with performance metrics and stage data

✅ DEVELOPMENT TOOLS:
- Performance snapshot utilities
- Jank simulation for testing
- Performance reset capabilities
- Global window access for debugging

✅ CONTENT INTEGRITY COMPLIANCE:
- All phantom function calls eliminated
- addEventLog method properly implemented
- Error handling for safe operation
- Backward compatibility maintained

✅ INTEGRATION METHODS:
- updateNarrativeState: For narrativeStore synchronization  
- analyzePerformanceCorrelation: Neural shift performance validation
- getPerformanceSnapshot: Complete state for dashboard
- Event logging: Analytics and debugging support

This corrected store now provides all methods expected by the surgical dashboard
enhancements and maintains perfect Neural Shift compatibility! 🧠⚡
*/
