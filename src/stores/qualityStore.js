// src/stores/qualityStore.js
import { create } from 'zustand';
// import { QualityLevels } from '@/utils/performance/AdaptiveQualitySystem.js'; // If needed for initial state

export const useQualityStore = create(set => ({
  currentQualityTier: 'HIGH',
  targetDpr: 1.0,
  frameloopMode: 'always',
  webglEnabled: true,
  particleCount: 5000,

  setCurrentQualityTier: tier => set({ currentQualityTier: tier }),
  setTargetDpr: dpr => set({ targetDpr: dpr }),
  setFrameloopMode: mode => set({ frameloopMode: mode }),
  setWebglEnabled: isEnabled => set({ webglEnabled: isEnabled }),
  setParticleCount: count => set({ particleCount: count }),
}));
