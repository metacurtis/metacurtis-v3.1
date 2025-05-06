// src/stores/qualityStore.js
import { create } from 'zustand';

// Define the possible frameloop modes
export const FRAMELOOP_MODES = ['always', 'demand', 'never'];

export const useQualityStore = create(set => ({
  // --- State ---
  frameloopMode: 'always', // Default frameloop mode

  // --- Actions ---
  setFrameloopMode: mode => {
    if (FRAMELOOP_MODES.includes(mode)) {
      set({ frameloopMode: mode });
      console.log(`Frameloop mode set to: ${mode}`); // For debugging
    } else {
      console.warn(`Invalid frameloop mode attempted: ${mode}`);
    }
  },
}));

// Optional: Selector hook for convenience
export const useFrameloopMode = () => useQualityStore(state => state.frameloopMode);
