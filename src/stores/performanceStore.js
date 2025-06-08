/*  ──────────────────────────────────────────────────────────────────────────────
    src/stores/performanceStore.js
    MetaCurtis • Unified Performance + Narrative Store
    ──────────────────────────────────────────────────────────────────────────────
    • Keeps all original FPS / jank tracking logic ✔
    • Adds “narrative” slice for stage-driven experience ✔
    • Adds enableNarrativeMode flag for instant rollback ✔
    • No behavioural changes to existing performance maths ✔
   --------------------------------------------------------------------------- */

import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js'; // adjust if needed

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
  jankThresholdMs: 33.4, // >30 FPS ≈ “jank”

  /* ── 3. NEW Narrative Slice ─────────────────────────────────────────────── */
  enableNarrativeMode: true, // global feature flag
  narrative: {
    currentStage: 'genesis', // 'genesis' | 'structure' | 'learning' | 'building' | 'mastery'
    progress: 0, // 0 → 1 during tween
    transitionActive: false,
  },

  /* ── 4. Setters / Actions ───────────────────────────────────────────────── */
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

  /* ── Narrative setters (simple merges) ─────────────────────────────────── */
  setEnableNarrativeMode: flag => set({ enableNarrativeMode: !!flag }),

  setCurrentStage: stage => set(s => ({ narrative: { ...s.narrative, currentStage: stage } })),

  setNarrativeProgress: value => set(s => ({ narrative: { ...s.narrative, progress: value } })),

  setTransitionActive: flag =>
    set(s => ({ narrative: { ...s.narrative, transitionActive: !!flag } })),
}));

export default usePerformanceStore;
