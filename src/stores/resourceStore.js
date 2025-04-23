// src/stores/resourceStore.js

import { create } from 'zustand';
import Registry from '@/utils/webgl/ResourceRegistry.js';

// 1) Create your Zustand store: initial stats + an updater action
const useResourceStore = create(set => ({
  stats: Registry.getStats(), // start off with whatever’s already registered
  updateStats: stats => set({ stats }), // action to overwrite stats
}));

// 2) _Outside_ of any React component, subscribe once.
//    Whenever your registry emits, we call updateStats.
Registry.subscribe(newStats => {
  useResourceStore.getState().updateStats(newStats);
});

export default useResourceStore;
