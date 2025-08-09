// src/hooks/atoms/useInteractionStore.js
// Compatibility layer for interaction store
import { useAtomValue } from '@stores/atoms/createAtom';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import { interactionAtom } from '@stores/atoms/interactionAtom';

export function useInteractionStore(selector) {
  const state = useAtomValue(interactionAtom, selector);

  if (selector) {
    return state;
  }

  return {
    ...state,
    addInteractionEvent: interactionAtom.addInteractionEvent,
    consumeInteractionEvents: interactionAtom.consumeInteractionEvents,
    cleanupProcessedEvents: interactionAtom.cleanupProcessedEvents,
    setTypewriterProgress: interactionAtom.setTypewriterProgress,
    updateMousePosition: interactionAtom.updateMousePosition,
    setTouchActive: interactionAtom.setTouchActive,
    setHoveredElement: interactionAtom.setHoveredElement,
    recordClick: interactionAtom.recordClick,
    setKeyPressed: interactionAtom.setKeyPressed,
    updateScrollState: interactionAtom.updateScrollState,
  };
}

export default useInteractionStore;
