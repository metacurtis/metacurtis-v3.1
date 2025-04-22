// src/stores/performanceStore.js

import { create } from 'zustand';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js';

// Initialize device capabilities once
const initialDeviceInfo = DeviceCapabilities.getInfo?.() || {};

const usePerformanceStore = create(set => ({
  // Current quality tier: 'ultra' | 'high' | 'medium' | 'low'
  quality: 'high',

  // Latest performance metrics
  metrics: {
    fps: 0,
    avgFrameTime: 0,
    jankCount: 0,
    jankRatio: 0,
  },

  // Detected device/GPU capabilities
  device: initialDeviceInfo,

  // Action: override/lock-in a specific quality tier
  setQuality: newQuality => set({ quality: newQuality }),

  // Action: update the latest performance metrics
  setMetrics: newMetrics => set({ metrics: newMetrics }),

  // Action: update/refresh device info if needed
  setDeviceInfo: info => set({ device: info }),
}));

export default usePerformanceStore;
