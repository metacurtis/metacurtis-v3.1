// src/stores/performanceStore.js
import { create } from 'zustand';
import { QualityLevels } from '@/utils/performance/AdaptiveQualitySystem.js';

/**
 * Zustand store for global performance state:
 *  - quality: current quality level (ultra/high/medium/low)
 *  - metrics: latest performance metrics (fps, frame times, jank count, etc.)
 *  - capabilities: device/GPU capabilities
 *  - config: optional global thresholds or presets
 */
const usePerformanceStore = create((set, get) => ({
  // --- State ---
  quality: QualityLevels.HIGH,
  metrics: {
    frameTimes: [],
    averageFrameMs: 0,
    averageFps: 0,
    jankCount: 0,
    windowSize: 0,
    sampleCount: 0,
  },
  capabilities: {}, // populated by DeviceCapabilities
  config: {}, // can hold minFps, maxFps, ultraFps, etc.

  // --- Actions ---
  setQuality: newQuality => set({ quality: newQuality }),

  setMetrics: newMetrics => set({ metrics: newMetrics }),

  setCapabilities: newCapabilities => set({ capabilities: newCapabilities }),

  setConfig: newConfig => set({ config: newConfig }),

  // Optional getters if you need them (get() is available on the hook itself)
  getQuality: () => get().quality,
  getMetrics: () => get().metrics,
  getCapabilities: () => get().capabilities,
  getConfig: () => get().config,
}));

export default usePerformanceStore;
