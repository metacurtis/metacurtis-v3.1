// @doctor:4b-disposers
const __doctorDisposers = []; // src/modules/state/eventMappings.js
/**
 * Event Mapping Configuration
 * Defines all BeatBus events and their state targets
 */
export const EVENT_MAPPINGS = {
  // Stage progression events
  STAGE_EVENTS: [
  'STAGE_CHANGE', // { from, to }
  'DIRECTOR_STAGE_TRANSITION',
  'STAGE_COMPLETE',
  'STAGE_ENTER',
  'STAGE_EXIT'],


  // Quality/Performance events
  QUALITY_EVENTS: [
  'QUALITY_CHANGE', // { tier } or { quality }
  'QUALITY_TIER_UPDATE',
  'DPR_CHANGE',
  'PERFORMANCE_UPDATE',
  'FRAME_TICK'],


  // Interaction events
  INTERACTION_EVENTS: [
  'USER_INTERACTION',
  'MOUSE_MOVE',
  'KEY_PRESS',
  'SCROLL_UPDATE',
  'TOUCH_EVENT'],


  // Memory/Resource events
  RESOURCE_EVENTS: [
  'RESOURCE_UPDATE',
  'MEMORY_WARNING',
  'TEXTURE_LOADED',
  'GEOMETRY_CREATED',
  'RESOURCE_DISPOSED'],


  // Narrative events
  NARRATIVE_EVENTS: [
  'MEMORY_FRAGMENT_ACTIVATE',
  'MEMORY_FRAGMENT_CLOSE',
  'DIALOGUE_START',
  'DIALOGUE_END',
  'NARRATOR_SPEAK'],


  // State-emitted events (reverse flow)
  STATE_EVENTS: ['STATE_STAGE_UPDATED', 'STATE_QUALITY_UPDATED', 'PERFORMANCE_WARNING']
};

// SST v3.0 Stage definitions
export const SST_STAGES = [
'genesis',
'discipline',
'neural',
'velocity',
'architecture',
'harmony',
'transcendence'];


// Quality tiers
export const QUALITY_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

export default EVENT_MAPPINGS; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}