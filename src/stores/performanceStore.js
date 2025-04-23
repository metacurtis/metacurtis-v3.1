import { create } from 'zustand';

const usePerformanceStore = create(set => ({
  // Current quality tier
  quality: 'high',

  // Performance metrics
  metrics: {
    fps: 0,
    avgFrameTime: 0,
    jankCount: 0,
    jankRatio: 0,
  },

  // Actions
  setQuality: newQuality => set({ quality: newQuality }),
  setMetrics: newMetrics => set({ metrics: newMetrics }),
}));

export default usePerformanceStore;
