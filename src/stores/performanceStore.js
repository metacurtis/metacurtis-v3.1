// src/stores/performanceStore.js
import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js';
import PerformanceMetrics from '@/utils/performance/PerformanceMetrics.js';

const initialDeviceInfo = DeviceCapabilities.getInfo?.() || {};

// one shared metrics instance
const metrics = new PerformanceMetrics();

const usePerformanceStore = create(set => ({
  quality: 'high',
  device: initialDeviceInfo,
  metrics: {
    fps: 0,
    avgFrameTime: 0,
    jankCount: 0,
    jankRatio: 0,
  },

  // called from your FPSCalculator
  tickFrame: delta => {
    metrics.tick(delta);
    set({ metrics: metrics.getMetrics() });
  },

  setQuality: q => set({ quality: q }),
  setDeviceInfo: info => set({ device: info }),
}));

export default usePerformanceStore;
