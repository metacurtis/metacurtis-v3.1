/*  ──────────────────────────────────────────────────────────────────────────────
    src/stores/performanceStore.js
    MetaCurtis • Unified Performance + Narrative Store
    ✅ CONSOLE OPTIMIZED: Reduced noise + enhanced stability integration
    ──────────────────────────────────────────────────────────────────────────────
    • Keeps all original FPS / jank tracking logic ✔
    • Adds "narrative" slice for stage-driven experience ✔
    • Adds enableNarrativeMode flag for instant rollback ✔
    • ✅ ENHANCED: SST v2.0 7-stage system compatibility ✔
    • ✅ ADDED: addEventLog method for analytics ✔
    • ✅ OPTIMIZED: Console noise reduction + development gates ✔
   --------------------------------------------------------------------------- */

import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js';

/* ── Constants ─────────────────────────── */
const FRAME_WINDOW = 120; // ≈2 s sliding window at 60 FPS
const UPDATE_INTERVAL = 500; // ms between averaged-metric store updates

// ✅ ENHANCED: Console logging configuration
const LOGGING_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  frequency: {
    events: 1.0,        // Log all events in development
    performance: 0.1,   // Log 10% of performance updates
    anomalies: 1.0,     // Log all anomalies
    stageChanges: 1.0,  // Log all stage changes
  },
  throttle: {
    performanceUpdates: 2000, // Max one performance log per 2s
    extensionWarnings: 10000, // Max one extension warning per 10s
  }
};

// ✅ ENHANCED: Throttling state
let lastPerformanceLog = 0;
let lastExtensionWarning = 0;

/* ── Device info with caching ──────────── */
const getInitialDeviceInfo = () => {
  try {
    const deviceInfo = DeviceCapabilities.getInfo();
    return deviceInfo || {
      gpu: 'N/A',
      memory: 'N/A',
      cores: 'N/A',
      renderer: 'N/A',
      vendor: 'N/A',
      webglVersion: 'N/A',
      deviceType: 'desktop',
      recommendedQualityTier: 'MEDIUM',
    };
  } catch (error) {
    console.warn('PerformanceStore: Failed to get device info:', error);
    return {
      gpu: 'N/A',
      memory: 'N/A',
      cores: 'N/A',
      renderer: 'N/A',
      vendor: 'N/A',
      webglVersion: 'N/A',
      deviceType: 'desktop',
      recommendedQualityTier: 'MEDIUM',
    };
  }
};

const initialDeviceInfo = getInitialDeviceInfo();

/* ── Internal rolling-window state ─────── */
let frameDeltasBuffer = [];
let jankFramesInWindowCounter = 0;
let lastStoreUpdateTime = 0;
let cumulativeJankSinceLastReset = 0;

/* ── ✅ ENHANCED: Event logging with noise reduction ─────── */
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

  /* ── 3. ✅ ENHANCED: SST v2.0 Narrative Slice (7-stage system) ──────────── */
  enableNarrativeMode: true, // global feature flag
  narrative: {
    currentStage: 'genesis', // ✅ ENHANCED: SST v2.0 7-stage system
    progress: 0, // 0 → 1 during tween
    transitionActive: false, // ✅ MAINTAINED: for backward compatibility
    isTransitioning: false, // ✅ ADDED: for narrativeStore compatibility
  },

  /* ── 4. ✅ ENHANCED: Event logging with noise control ──────────────────── */
  eventLog: [],

  /* ── 5. Setters / Actions ───────────────────────────────────────────────── */
  setDeviceInfo: info => {
    set({ device: info });
    if (LOGGING_CONFIG.enabled && Math.random() < LOGGING_CONFIG.frequency.performance) {
      console.log('📱 Device info updated:', {
        type: info.deviceType,
        webgl: info.webglVersion,
        quality: info.recommendedQualityTier,
      });
    }
  },

  /*  ✅ ENHANCED: Performance tick with noise reduction */
  tickFrame: delta => {
    const ms = delta * 1000;
    if (typeof ms !== 'number' || ms < 0 || Number.isNaN(ms)) {
      if (LOGGING_CONFIG.enabled) {
        console.warn('PerformanceStore: Invalid delta time:', delta);
      }
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
    const newFps = avg ? 1000 / avg : 0;

    set({
      fps: newFps,
      avgFrameTime: avg,
      jankCount: cumulativeJankSinceLastReset,
      jankRatio: n ? jankFramesInWindowCounter / n : 0,
    });

    // ✅ ENHANCED: Throttled performance logging
    if (LOGGING_CONFIG.enabled && 
        Math.random() < LOGGING_CONFIG.frequency.performance &&
        now - lastPerformanceLog > LOGGING_CONFIG.throttle.performanceUpdates) {
      console.log(`📊 Performance: ${newFps.toFixed(1)} FPS, ${avg.toFixed(1)}ms avg, ${(get().jankRatio * 100).toFixed(1)}% jank`);
      lastPerformanceLog = now;
    }
  },

  resetMetricsAndCounters: () => {
    frameDeltasBuffer = [];
    jankFramesInWindowCounter = 0;
    cumulativeJankSinceLastReset = 0;
    lastStoreUpdateTime = 0;
    set({ fps: 0, avgFrameTime: 0, jankCount: 0, jankRatio: 0, deltaMs: 0 });
    
    if (LOGGING_CONFIG.enabled) {
      console.log('🔄 Performance metrics reset');
    }
  },

  setJankThreshold: ms => {
    if (typeof ms === 'number' && ms > 0) {
      set({ jankThresholdMs: ms });
      if (LOGGING_CONFIG.enabled) {
        console.log(`⚙️ Jank threshold updated to ${ms}ms`);
      }
    } else {
      console.warn('PerformanceStore: invalid jank threshold', ms);
    }
  },

  /* ── ✅ ENHANCED: Narrative setters with SST v2.0 compatibility ────────── */
  setEnableNarrativeMode: flag => {
    set({ enableNarrativeMode: !!flag });
    if (LOGGING_CONFIG.enabled) {
      console.log(`🎭 Narrative mode: ${!!flag ? 'enabled' : 'disabled'}`);
    }
  },

  setCurrentStage: stage => {
    // ✅ ENHANCED: Validate stage name for SST v2.0 7-stage system
    const validStages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
    const validatedStage = validStages.includes(stage) ? stage : 'genesis';

    set(s => ({
      narrative: {
        ...s.narrative,
        currentStage: validatedStage,
      },
    }));

    // ✅ ENHANCED: Throttled stage change logging
    if (LOGGING_CONFIG.enabled && Math.random() < LOGGING_CONFIG.frequency.stageChanges) {
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

  /* ── ✅ ENHANCED: Narrative integration methods ───────────────────────── */
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

  /* ── ✅ ENHANCED: Event logging with intelligent noise reduction ─────── */
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

      // ✅ ENHANCED: Intelligent logging based on event type
      if (LOGGING_CONFIG.enabled) {
        const shouldLog = (() => {
          switch (eventType) {
            case 'extension_interference_detected':
              const now = performance.now();
              if (now - lastExtensionWarning > LOGGING_CONFIG.throttle.extensionWarnings) {
                lastExtensionWarning = now;
                return true;
              }
              return false;
            case 'webgl_canvas_created':
            case 'keyboard_navigation':
            case 'debug_toggle':
              return Math.random() < LOGGING_CONFIG.frequency.events;
            case 'performance_anomaly':
            case 'quality_tier_change':
              return Math.random() < LOGGING_CONFIG.frequency.anomalies;
            default:
              return Math.random() < LOGGING_CONFIG.frequency.events;
          }
        })();

        if (shouldLog) {
          console.log(`📊 Event: ${eventType}`, eventData);
        }
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
    if (LOGGING_CONFIG.enabled) {
      console.log('🗑️ Event log cleared');
    }
  },

  getEventLog: () => {
    return [...eventLogBuffer];
  },

  /* ── ✅ ENHANCED: Dashboard integration methods ───────────────────────── */
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

  /* ── ✅ ENHANCED: Performance analysis for SST v2.0 correlation ────────── */
  analyzePerformanceCorrelation: () => {
    const state = get();
    const { fps, narrative } = state;

    // ✅ ENHANCED: SST v2.0 cognitive load mapping (7-stage system)
    const cognitiveLoadMap = {
      genesis: 0.2,        // Simple hippocampus activation
      discipline: 0.3,     // Brainstem structure formation
      neural: 0.5,         // Temporal lobe pathway growth
      velocity: 0.8,       // High-energy electrical storm
      architecture: 0.6,   // Frontal lobe grid organization
      harmony: 0.7,        // Prefrontal coordination
      transcendence: 1.0,  // Full consciousness integration
    };

    const cognitiveLoad = cognitiveLoadMap[narrative.currentStage] || 0.3;
    const expectedFPS = 60 - cognitiveLoad * 15; // Refined correlation model
    const deviation = Math.abs(fps - expectedFPS);

    let correlation = 'optimal';
    if (deviation > 15) correlation = 'concerning';
    else if (deviation > 8) correlation = 'acceptable';

    return {
      cognitiveLoad,
      expectedFPS,
      actualFPS: fps,
      deviation,
      correlation,
      stage: narrative.currentStage,
      sstCompliant: true, // SST v2.0 system
    };
  },

  /* ── ✅ ENHANCED: Development helpers with noise control ──────────────── */
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

  /* ── ✅ NEW: Console configuration controls ──────────────────────────── */
  setLoggingFrequency: (type, frequency) => {
    if (process.env.NODE_ENV === 'development' && LOGGING_CONFIG.frequency[type] !== undefined) {
      LOGGING_CONFIG.frequency[type] = Math.max(0, Math.min(1, frequency));
      console.log(`🔧 Logging frequency for ${type} set to ${frequency}`);
    }
  },

  getLoggingConfig: () => {
    if (process.env.NODE_ENV === 'development') {
      return { ...LOGGING_CONFIG };
    }
    return null;
  },
}));

// ✅ ENHANCED: Global development access with console controls
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.usePerformanceStore = usePerformanceStore;
  window.performanceUtils = {
    getSnapshot: () => usePerformanceStore.getState().getPerformanceSnapshot(),
    analyzeCorrelation: () => usePerformanceStore.getState().analyzePerformanceCorrelation(),
    simulateJank: ms => usePerformanceStore.getState().devSimulateJank(ms),
    resetPerformance: () => usePerformanceStore.getState().devResetPerformance(),
    logEvent: (type, data) => usePerformanceStore.getState().addEventLog(type, data),
    
    // ✅ NEW: Console noise controls
    setLogging: (type, frequency) => usePerformanceStore.getState().setLoggingFrequency(type, frequency),
    getLoggingConfig: () => usePerformanceStore.getState().getLoggingConfig(),
    quietMode: () => {
      // Reduce all logging to minimum
      const store = usePerformanceStore.getState();
      store.setLoggingFrequency('events', 0.1);
      store.setLoggingFrequency('performance', 0.05);
      store.setLoggingFrequency('anomalies', 0.5);
      console.log('🔇 Quiet mode enabled - reduced logging');
    },
    verboseMode: () => {
      // Restore full logging
      const store = usePerformanceStore.getState();
      store.setLoggingFrequency('events', 1.0);
      store.setLoggingFrequency('performance', 0.2);
      store.setLoggingFrequency('anomalies', 1.0);
      console.log('🔊 Verbose mode enabled - full logging');
    },
  };
}

export default usePerformanceStore;

/*
🎯 CONSOLE OPTIMIZED PERFORMANCE STORE ✅

✅ SST v2.0 COMPATIBILITY:
- Updated to 7-stage system (genesis → discipline → neural → velocity → architecture → harmony → transcendence)
- Enhanced cognitive load mapping for brain region correlation
- Performance analysis adapted for consciousness theater stages
- Narrative integration with SST v2.0 canonical progression

✅ CONSOLE NOISE REDUCTION:
- Intelligent logging frequency controls (10% performance, 100% events)
- Throttled extension warnings (max 1 per 10 seconds)
- Event-type specific logging decisions
- Development-only performance logging with random sampling

✅ ENHANCED STABILITY INTEGRATION:
- Cached device capabilities integration
- Error handling for device info failures
- Throttled performance update logging
- Stage validation for 7-stage system

✅ DEVELOPMENT TOOLS:
- Console noise control utilities (quietMode/verboseMode)
- Configurable logging frequencies per event type
- Enhanced debug information for SST v2.0
- Performance snapshot utilities with brain region correlation

✅ EVENT LOGGING OPTIMIZATION:
- Smart event filtering based on type and frequency
- Extension interference throttling
- Performance anomaly prioritization
- Circular buffer management with size limits

✅ PRODUCTION READINESS:
- Environment-based logging gates
- Reduced console noise in production builds
- Efficient event buffering and cleanup
- Error-resistant device capability detection

This optimized store eliminates console noise while maintaining
full functionality and SST v2.0 compatibility! 🧠⚡
*/