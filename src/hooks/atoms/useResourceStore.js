// src/hooks/atoms/useResourceStore.js
// Compatibility layer for resource store
import { useAtomValue } from '@stores/atoms/createAtom';
import { resourceAtom } from '@stores/atoms/resourceAtom'; // @doctor:4b-disposers
const __doctorDisposers = [];
export function useResourceStore(selector) {
  const state = useAtomValue(resourceAtom, selector);

  if (selector) {
    return state;
  }

  return {
    ...state,
    updateStats: resourceAtom.updateStats,
    updateMemory: resourceAtom.updateMemory,
    registerResource: resourceAtom.registerResource,
    disposeResource: resourceAtom.disposeResource,
    getResources: resourceAtom.getResources,
    clearAll: resourceAtom.clearAll
  };
}

export default useResourceStore; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}