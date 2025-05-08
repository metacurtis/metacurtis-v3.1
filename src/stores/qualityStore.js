// src/stores/qualityStore.js
import { create } from 'zustand';

export const FRAMELOOP_MODES = ['always', 'demand', 'never'];

export const useQualityStore = create((set, get) => ({
  // State
  frameloopMode: 'always',
  currentFps: null,
  targetDpr: Math.min(window.devicePixelRatio || 1, 1.5), // Sensible default

  // Actions
  setFrameloopMode: mode => {
    if (FRAMELOOP_MODES.includes(mode)) {
      set({ frameloopMode: mode });
    } else {
      console.warn(`Invalid frameloop mode attempted: ${mode}`);
    }
  },
  setMeasuredFps: fps => set({ currentFps: fps }),
  setTargetDpr: dpr => {
    const maxDpr = window.devicePixelRatio || 1;
    const newDpr = Math.max(0.5, Math.min(maxDpr, dpr)); // Clamped DPR
    if (get().targetDpr !== newDpr) {
      set({ targetDpr: newDpr });
    }
  },
}));

// Optional selector hooks
export const useFrameloopMode = () => useQualityStore(state => state.frameloopMode);
export const useCurrentFps = () => useQualityStore(state => state.currentFps);
export const useTargetDpr = () => useQualityStore(state => state.targetDpr);
