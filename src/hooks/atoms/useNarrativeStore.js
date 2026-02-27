// src/hooks/atoms/useNarrativeStore.js
// Compatibility layer for Zustand → Atomic migration
import { useAtomValue } from '@/state/atoms/createAtom';
import { narrativeAtom } from '@/state/atoms/narrativeAtom';
import stateCommands from '@/state/commands/StateCommands.js';

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
    nextStage: narrativeAtom.nextStage,
    prevStage: narrativeAtom.prevStage,
    // Canonical authority writers
    setStage: (stageInput, options) => stateCommands.setStage(stageInput, options),
    setScrollProgress: (progress, options) => stateCommands.setScrollProgress(progress, options),
    setMorphProgress: narrativeAtom.setMorphProgress,
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
