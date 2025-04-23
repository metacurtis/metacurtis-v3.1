// src/stores/resourceStore.js
import { create } from 'zustand';
import Registry from '@/utils/webgl/ResourceRegistry.js';

// Create a Zustand store keyed around the Registry’s stats
const useResourceStore = create(set => {
  // Seed with the registry’s current snapshot
  set({ stats: Registry.getStats() });

  // Subscribe to future Registry updates
  const unsubscribe = Registry.subscribe(stats => {
    set({ stats });
  });

  // Return no-op cleanup for Zustand (optional)
  return () => {
    unsubscribe();
  };
});

export default useResourceStore;
