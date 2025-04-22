// src/stores/resourceStore.js

import { create } from 'zustand';
import ResourceMetrics from '@/utils/performance/ResourceMetrics.js';

const metrics = new ResourceMetrics();

const useResourceStore = create(set => ({
  resourceStats: {
    counts: { texture: 0, material: 0, geometry: 0, buffer: 0, other: 0 },
    delta: { texture: 0, material: 0, geometry: 0, buffer: 0, other: 0 },
    leakWarning: false,
  },

  // Sample now and update store
  sampleResources: () => {
    const data = metrics.sample();
    set({ resourceStats: data });
  },
}));

export default useResourceStore;
