import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
// src/stores/narrativeStore.js
// Migration wrapper - imports from atomic hooks
export { useNarrativeStore } from '../hooks/atoms/useNarrativeStore';
export { default } from '../hooks/atoms/useNarrativeStore';

// Export stage constants for compatibility
export const NARRATIVE_STAGES = {
  genesis: 0,
  discipline: 1,
  neural: 2,
  velocity: 3,
  architecture: 4,
  harmony: 5,
  transcendence: 6,
};

export const STAGE_NAME_TO_INDEX = {
  genesis: 0,
  discipline: 1,
  neural: 2,
  velocity: 3,
  architecture: 4,
  harmony: 5,
  transcendence: 6,
};

export const STAGE_INDEX_TO_NAME = [
  'genesis',
  'discipline',
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence',
];
