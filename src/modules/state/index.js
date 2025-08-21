// src/modules/state/index.js
/**
 * State module exports
 * Clean import: import { stateCore } from '@/modules/state'
 */

export { default as stateCore } from './StateCore.js';
export { default as StateCoreCanonValidator } from './StateCoreCanonValidator.js';

export { default as beatBusBridge } from './BeatBusBridge.js';
export { EVENT_MAPPINGS, SST_STAGES, QUALITY_TIERS } from './eventMappings.js';
