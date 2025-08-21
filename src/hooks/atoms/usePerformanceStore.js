// src/hooks/atoms/usePerformanceStore.js
// Compatibility layer for performance store
import { useAtomValue } from '@stores/atoms/createAtom';
import { performanceAtom } from '@stores/atoms/performanceAtom'; // @doctor:4b-disposers
const __doctorDisposers = [];
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
    setTransitionActive: performanceAtom.setTransitionActive
  };
}

export default usePerformanceStore; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}