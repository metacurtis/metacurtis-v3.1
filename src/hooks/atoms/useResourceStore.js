// src/hooks/atoms/useResourceStore.js
// Compatibility layer for resource store
import { useAtomValue } from '@/state/atoms/createAtom';
import { resourceAtom } from '@/state/atoms/resourceAtom';

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
    clearAll: resourceAtom.clearAll,
  };
}

export default useResourceStore;
