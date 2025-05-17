// src/stores/performanceStore.js
import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js'; // Ensure this path is correct

const FRAME_WINDOW = 120; // Number of frames for moving average (~2 seconds at 60fps)
const UPDATE_INTERVAL = 500; // Update reactive store state for averaged metrics every 500ms

// Attempt to get initial device info, provide fallbacks
const initialDeviceInfo =
  typeof DeviceCapabilities.getInfo === 'function'
    ? DeviceCapabilities.getInfo()
    : {
        gpu: 'N/A',
        memory: 'N/A',
        cores: 'N/A',
        renderer: 'N/A',
        vendor: 'N/A',
        webglVersion: 'N/A',
      };
if (!initialDeviceInfo.gpu) initialDeviceInfo.gpu = 'N/A'; // Ensure essential fields have fallbacks

// Module-level variables for accumulating data between throttled store updates.
let frameDeltasBuffer = [];
let jankFramesInWindowCounter = 0;
let lastStoreUpdateTime = 0;
let cumulativeJankSinceLastReset = 0;
// Removed 'lastDeltaMsForTick' as it was unused. The 'deltaMs' in the store serves this purpose.

export const usePerformanceStore = create((set, get) => ({
  // --- Exposed Metrics (Primitives) ---
  fps: 0,
  avgFrameTime: 0,
  jankCount: 0, // Cumulative jank frames encountered since last reset
  jankRatio: 0, // Jank ratio over the current window at last update
  deltaMs: 0, // Last frame's delta time in ms

  // --- Configuration & Device Info ---
  device: initialDeviceInfo,
  jankThresholdMs: 33.4, // Frames longer than this (ms) are considered jank (approx. >30fps)

  // --- Actions ---
  setDeviceInfo: info => set({ device: info }),

  tickFrame: delta => {
    // delta is in seconds from R3F useFrame
    const ms = delta * 1000;
    // Validate delta time
    if (typeof ms !== 'number' || ms < 0 || isNaN(ms)) {
      console.warn('PerformanceStore: Invalid delta time received in tickFrame:', delta);
      return;
    }

    // Update internal buffers on every tick
    frameDeltasBuffer.push(ms);
    if (ms > get().jankThresholdMs) {
      jankFramesInWindowCounter++;
      cumulativeJankSinceLastReset++;
    }

    // Maintain the sliding window size for frame deltas
    if (frameDeltasBuffer.length > FRAME_WINDOW) {
      const removed = frameDeltasBuffer.shift();
      if (removed > get().jankThresholdMs) {
        jankFramesInWindowCounter = Math.max(0, jankFramesInWindowCounter - 1);
      }
    }

    // Update deltaMs in the store immediately if it has changed significantly,
    // as DevPerformanceMonitor might want to show this live.
    // This is a frequent update but only for one primitive.
    // Using a small tolerance to avoid excessive updates for tiny floating point differences.
    if (Math.abs(get().deltaMs - ms) > 0.05) {
      // Check if difference is more than 0.05ms
      set({ deltaMs: ms });
    }

    // Throttle the main averaged metrics update
    const now = performance.now();
    if (now - lastStoreUpdateTime < UPDATE_INTERVAL) {
      return; // Not time to update the reactive averaged metrics in the store yet
    }
    lastStoreUpdateTime = now; // Reset the timer for the next throttled update

    const numFramesInWindow = frameDeltasBuffer.length;
    let calculatedFps = 0;
    let calculatedAvgFrameTime = 0;
    let calculatedWindowJankRatio = 0;

    if (numFramesInWindow > 0) {
      const sumMs = frameDeltasBuffer.reduce((s, t) => s + t, 0);
      calculatedAvgFrameTime = sumMs / numFramesInWindow;
      calculatedFps = calculatedAvgFrameTime > 0 ? 1000 / calculatedAvgFrameTime : 0;
      calculatedWindowJankRatio = jankFramesInWindowCounter / numFramesInWindow;
    }

    // Update the store with new averaged metrics.
    // The 'state' parameter is prefixed with an underscore as it's not used in this specific setter.
    set(_state => ({
      fps: calculatedFps,
      avgFrameTime: calculatedAvgFrameTime,
      jankCount: cumulativeJankSinceLastReset, // Use the accumulated jank
      jankRatio: calculatedWindowJankRatio,
      // deltaMs is already set above for immediate feedback
    }));
  },

  resetMetricsAndCounters: () => {
    frameDeltasBuffer = [];
    jankFramesInWindowCounter = 0;
    cumulativeJankSinceLastReset = 0;
    lastStoreUpdateTime = 0; // Reset update timer as well
    set({
      fps: 0,
      avgFrameTime: 0,
      jankCount: 0,
      jankRatio: 0,
      deltaMs: 0,
    });
    // console.log('PerformanceStore: Metrics and calculation buffers reset.');
  },

  setJankThreshold: thresholdMs => {
    if (typeof thresholdMs === 'number' && thresholdMs > 0) {
      set({ jankThresholdMs: thresholdMs });
      // console.log('PerformanceStore: Jank threshold set to', thresholdMs, 'ms');
    } else {
      console.warn('PerformanceStore: Invalid jank threshold provided:', thresholdMs);
    }
  },
}));

export default usePerformanceStore;
