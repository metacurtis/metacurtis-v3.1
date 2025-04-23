// src/stores/performanceStore.js
import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js';

// How many frames make up our smoothing window? ~2 s at 60 FPS.
const FRAME_WINDOW = 120;
const frameDeltas = [];

// Initialize device capabilities once
const initialDeviceInfo = DeviceCapabilities.getInfo?.() || {};

const usePerformanceStore = create(set => ({
  // Quality tier (unchanged)
  quality: 'high',

  // Smoothed performance metrics
  metrics: {
    fps: 0,
    avgFrameTime: 0,
    jankCount: 0,
    jankRatio: 0,
  },

  // Detected device/GPU capabilities
  device: initialDeviceInfo,

  // Actions
  setQuality: newQ => set({ quality: newQ }),
  setDeviceInfo: info => set({ device: info }),

  /**
   * Called every frame with `delta` (in seconds).
   * We convert to ms, push into our ring, cap at FRAME_WINDOW,
   * then compute a moving average for frameTime and FPS.
   */
  tickFrame: delta => {
    const ms = delta * 1000;
    frameDeltas.push(ms);
    if (frameDeltas.length > FRAME_WINDOW) {
      frameDeltas.shift();
    }
    // compute moving average
    const sum = frameDeltas.reduce((s, t) => s + t, 0);
    const avgFrameTime = sum / frameDeltas.length;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    set({
      metrics: {
        fps,
        avgFrameTime,
        // optional: compute jank if you like
        jankCount: 0,
        jankRatio: 0,
      },
    });
  },
}));

export default usePerformanceStore;
