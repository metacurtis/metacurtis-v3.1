// src/hooks/atoms/usePerformanceStore.js
// Compatibility layer for performance store
import { useAtomValue } from '@/stores/atoms/createAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';

export function usePerformanceStore(selector) {
  const state = useAtomValue(performanceAtom, selector);

  if (selector) {
    return state;
  }

  return {
    ...state,
    updateMetrics: performanceAtom.updateMetrics,
    setTier: performanceAtom.setTier,
    setAutoQuality: performanceAtom.setAutoQuality,
    setDeviceCapabilities: performanceAtom.setDeviceCapabilities,
    getAverageFPS: performanceAtom.getAverageFPS,
    getPerformanceScore: performanceAtom.getPerformanceScore,
    setCurrentStage: performanceAtom.setCurrentStage,
    setNarrativeProgress: performanceAtom.setNarrativeProgress,
    setTransitionActive: performanceAtom.setTransitionActive,
  };
}

export default usePerformanceStore;
