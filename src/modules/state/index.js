// @doctor:4b-disposers
const __doctorDisposers = []; // src/modules/state/index.js
/**
 * State module exports
 * Clean import: import { stateCore } from '@/modules/state'
 */
export { default as stateCore } from './StateCore.js';
export { default as StateCoreCanonValidator } from './StateCoreCanonValidator.js';

export { default as beatBusBridge } from './BeatBusBridge.js';
export { EVENT_MAPPINGS, SST_STAGES, QUALITY_TIERS } from './eventMappings.js'; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}