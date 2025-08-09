// src/hooks/atoms/useNarrativeStore.js
// Compatibility layer for Zustand → Atomic migration
import { useAtomValue } from '@stores/atoms/createAtom';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import { narrativeAtom } from '@stores/atoms/narrativeAtom';

export function useNarrativeStore(selector) {
  // Get the full state or selected portion
  const state = useAtomValue(narrativeAtom, selector);

  // Return both state and actions for compatibility
  if (selector) {
    return state;
  }

  // Full store compatibility mode
  return {
    // State
    ...state,

    // Actions (bound to atom)
    jumpToStage: narrativeAtom.jumpToStage,
    nextStage: narrativeAtom.nextStage,
    prevStage: narrativeAtom.prevStage,
    setStage: narrativeAtom.setStage,
    setGlobalProgress: narrativeAtom.setGlobalProgress,
    setScrollProgress: narrativeAtom.setScrollProgress,
    setMorphProgress: narrativeAtom.setMorphProgress,
    setNarrativeProgress: narrativeAtom.setNarrativeProgress,
    activateMemoryFragment: narrativeAtom.activateMemoryFragment,
    dismissMemoryFragment: narrativeAtom.dismissMemoryFragment,
    isStageFeatureEnabled: narrativeAtom.isStageFeatureEnabled,
    getAllEnabledFeatures: narrativeAtom.getAllEnabledFeatures,
    triggerNarrativeEvent: narrativeAtom.triggerNarrativeEvent,
    hasNarrativeEventFired: narrativeAtom.hasNarrativeEventFired,
    updateEngagement: narrativeAtom.updateEngagement,
    trackUserEngagement: narrativeAtom.trackUserEngagement,
    updateTimeInStage: narrativeAtom.updateTimeInStage,
    getNarrativeSnapshot: narrativeAtom.getNarrativeSnapshot,
    getCurrentStageIndex: narrativeAtom.getCurrentStageIndex,
    getStageOrder: narrativeAtom.getStageOrder,
  };
}

// Also export as default for import compatibility
export default useNarrativeStore;
