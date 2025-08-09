// src/stores/atoms/resourceAtom.js
// WebGL resource tracking and management
import { createAtom } from './createAtom';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';

const initialState = {
  stats: {
    geometry: 0,
    material: 0,
    texture: 0,
    program: 0,
    bufferGeometry: 0,
  },

  memory: {
    used: 0,
    limit: 0,
    textures: 0,
    geometries: 0,
  },

  resources: {
    textures: new Map(),
    geometries: new Map(),
    materials: new Map(),
  },
};

export const resourceAtom = createAtom(initialState, (get, set) => ({
  // Update resource counts
  updateStats: stats => {
    set(state => ({
      ...state,
      stats: { ...state.stats, ...stats },
    }));
  },

  // Memory tracking
  updateMemory: memory => {
    set(state => ({
      ...state,
      memory: { ...state.memory, ...memory },
    }));
  },

  // Resource registration
  registerResource: (type, id, resource) => {
    set(state => {
      const resources = new Map(state.resources[type]);
      resources.set(id, resource);
      return {
        ...state,
        resources: {
          ...state.resources,
          [type]: resources,
        },
      };
    });
  },

  // Resource cleanup
  disposeResource: (type, id) => {
    set(state => {
      const resources = new Map(state.resources[type]);
      resources.delete(id);
      return {
        ...state,
        resources: {
          ...state.resources,
          [type]: resources,
        },
      };
    });
  },

  // Get all resources of a type
  getResources: type => {
    return Array.from(get().resources[type]?.values() || []);
  },

  // Clear all resources
  clearAll: () => {
    set(state => ({
      ...state,
      resources: {
        textures: new Map(),
        geometries: new Map(),
        materials: new Map(),
      },
    }));
  },

  reset: () => {
    set(initialState);
  },
}));

// Development helpers
if (import.meta.env.DEV) {
  window.resourceAtom = resourceAtom;
}
