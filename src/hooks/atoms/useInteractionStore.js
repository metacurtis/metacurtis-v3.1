// src/hooks/atoms/useInteractionStore.js
// Compatibility layer for interaction store
import { useAtomValue } from '@stores/atoms/createAtom';
import { interactionAtom } from '@stores/atoms/interactionAtom'; // @doctor:4b-disposers
const __doctorDisposers = [];
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
    updateScrollState: interactionAtom.updateScrollState
  };
}

export default useInteractionStore; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}