// modules/orchestration/core/EventCatalog.js
/**
 * MetaCurtis Event Catalog - Single Source of Truth
 * All events in the system must be defined here
 * Version: 1.0.0
 *
 * Naming Convention:
 * - Use colon separators for hierarchy (system:subsystem:action)
 * - All lowercase with colons
 * - Present tense for states, past tense for completed actions
 */

export const EVENTS = {
  // ============= STATE EVENTS =============
  // Core state changes
  STAGE_CHANGE: 'stage:change',
  STAGE_TRANSITION_START: 'stage:transition:start',
  STAGE_TRANSITION_COMPLETE: 'stage:transition:complete',
  STAGE_JUMP: 'stage:jump',

  QUALITY_CHANGE: 'quality:change',
  QUALITY_TIER_UPDATE: 'quality:tier:update',
  QUALITY_ADAPTIVE_ADJUST: 'quality:adaptive:adjust',

  STATE_CHANGED: 'state:changed', // Generic state update
  STATE_INITIALIZED: 'state:initialized',

  // ============= ENGINE EVENTS =============
  // Consciousness Engine
  BLUEPRINT_REQUEST: 'engine:blueprint:request',
  BLUEPRINT_READY: 'engine:blueprint:ready',
  BLUEPRINT_CACHED: 'engine:blueprint:cached',
  BLUEPRINT_CACHE_HIT: 'engine:blueprint:cache:hit',
  ENGINE_INITIALIZED: 'engine:initialized',
  ENGINE_ERROR: 'engine:error',
  ENGINE_REBUILD: 'engine:rebuild',

  // Particle system
  PARTICLES_GENERATED: 'engine:particles:generated',
  PARTICLES_UPDATE: 'engine:particles:update',
  TIER_DISTRIBUTION_CHANGE: 'engine:tier:distribution:change',

  // ============= THEATER EVENTS =============
  // Theater state machine
  THEATER_STATE_CHANGE: 'theater:state:change',
  THEATER_INITIALIZED: 'theater:initialized',
  THEATER_READY: 'theater:ready',
  THEATER_ERROR: 'theater:error',

  // Opening sequence
  OPENING_START: 'theater:opening:start',
  OPENING_PHASE_CHANGE: 'theater:opening:phase',
  OPENING_COMPLETE: 'theater:opening:complete',
  OPENING_SKIP: 'theater:opening:skip',

  // Stage progression
  STAGE_ENTRY: 'theater:stage:entry',
  STAGE_EXIT: 'theater:stage:exit',
  STAGE_LOCK: 'theater:stage:lock',
  STAGE_UNLOCK: 'theater:stage:unlock',

  // ============= MEMORY FRAGMENTS =============
  MEMORY_FRAGMENT_TRIGGER: 'memory:fragment:trigger',
  MEMORY_FRAGMENT_ACTIVATED: 'memory:fragment:activated',
  MEMORY_FRAGMENT_DISMISS: 'memory:fragment:dismiss',
  MEMORY_FRAGMENT_INTERACTION: 'memory:fragment:interaction',
  MEMORY_FRAGMENT_COMPLETE: 'memory:fragment:complete',

  // ============= NARRATIVE EVENTS =============
  NARRATIVE_START: 'narrative:start',
  NARRATIVE_PAUSE: 'narrative:pause',
  NARRATIVE_RESUME: 'narrative:resume',
  NARRATIVE_COMPLETE: 'narrative:complete',
  NARRATIVE_DIALOGUE_START: 'narrative:dialogue:start',
  NARRATIVE_DIALOGUE_COMPLETE: 'narrative:dialogue:complete',
  NARRATIVE_TYPEWRITER_START: 'narrative:typewriter:start',
  NARRATIVE_TYPEWRITER_COMPLETE: 'narrative:typewriter:complete',

  // ============= PERFORMANCE EVENTS =============
  FPS_UPDATE: 'performance:fps:update',
  FPS_WARNING: 'performance:fps:warning',
  FPS_CRITICAL: 'performance:fps:critical',
  MEMORY_WARNING: 'performance:memory:warning',
  MEMORY_CRITICAL: 'performance:memory:critical',
  TIER_ADJUSTMENT: 'performance:tier:adjustment',
  PERFORMANCE_REPORT: 'performance:report',

  // ============= INTERACTION EVENTS =============
  USER_INTERACTION: 'interaction:user',
  KEYBOARD_NAVIGATION: 'interaction:keyboard',
  KEYBOARD_COMMAND: 'interaction:keyboard:command',
  SCROLL_UPDATE: 'interaction:scroll',
  SCROLL_LOCK: 'interaction:scroll:lock',
  SCROLL_UNLOCK: 'interaction:scroll:unlock',
  MOUSE_MOVE: 'interaction:mouse:move',
  MOUSE_ENTER_FRAGMENT: 'interaction:mouse:enter:fragment',
  MOUSE_LEAVE_FRAGMENT: 'interaction:mouse:leave:fragment',

  // ============= WEBGL EVENTS =============
  WEBGL_INITIALIZED: 'webgl:initialized',
  WEBGL_CONTEXT_LOST: 'webgl:context:lost',
  WEBGL_CONTEXT_RESTORED: 'webgl:context:restored',
  WEBGL_RESIZE: 'webgl:resize',
  SHADER_COMPILE_START: 'webgl:shader:compile:start',
  SHADER_COMPILE_SUCCESS: 'webgl:shader:compile:success',
  SHADER_COMPILE_ERROR: 'webgl:shader:compile:error',
  RENDERER_READY: 'webgl:renderer:ready',
  FRAME_RENDER: 'webgl:frame:render',

  // ============= CAMERA EVENTS =============
  CAMERA_MOVE_START: 'camera:move:start',
  CAMERA_MOVE_COMPLETE: 'camera:move:complete',
  CAMERA_SHAKE: 'camera:shake',
  CAMERA_RESET: 'camera:reset',

  // ============= AUDIO EVENTS =============
  AUDIO_INITIALIZED: 'audio:initialized',
  AUDIO_PLAY: 'audio:play',
  AUDIO_PAUSE: 'audio:pause',
  AUDIO_VOLUME_CHANGE: 'audio:volume:change',
  AUDIO_TRACK_CHANGE: 'audio:track:change',

  // ============= DEBUG EVENTS =============
  DEBUG_MODE_TOGGLE: 'debug:mode:toggle',
  DEBUG_OVERLAY_UPDATE: 'debug:overlay:update',
  DEBUG_COMMAND_EXECUTE: 'debug:command:execute',
  DEBUG_METRICS_UPDATE: 'debug:metrics:update',
  DEBUG_LOG: 'debug:log',
};

// Event payload schemas for validation and documentation
export const EVENT_PAYLOADS = {
  [EVENTS.STAGE_CHANGE]: {
    stage: 'string', // 'genesis', 'discipline', 'neural', etc.
    previousStage: 'string|null',
    source: 'string', // 'keyboard', 'scroll', 'api', 'auto'
    timestamp: 'number',
  },

  [EVENTS.BLUEPRINT_READY]: {
    stage: 'string',
    quality: 'string', // 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'
    blueprint: 'object', // The complete blueprint object
    cached: 'boolean',
    cacheKey: 'string',
    particleCount: 'number',
  },

  [EVENTS.QUALITY_CHANGE]: {
    quality: 'string',
    previousQuality: 'string',
    reason: 'string', // 'manual', 'adaptive', 'device', 'performance'
    fps: 'number|null',
  },

  [EVENTS.MEMORY_FRAGMENT_TRIGGER]: {
    fragmentId: 'string',
    stage: 'string',
    triggerType: 'string', // 'scroll', 'time', 'interaction', 'auto'
    position: 'object|null', // {x, y} for positioned fragments
  },

  [EVENTS.THEATER_STATE_CHANGE]: {
    state: 'string', // 'idle', 'opening', 'stage', 'transitioning'
    previousState: 'string',
    stage: 'string|null',
    timestamp: 'number',
  },

  [EVENTS.FPS_UPDATE]: {
    fps: 'number',
    average: 'number', // Rolling average
    min: 'number',
    max: 'number',
    frameTime: 'number', // ms
  },

  [EVENTS.USER_INTERACTION]: {
    type: 'string', // 'click', 'keypress', 'scroll', 'touch'
    target: 'string|null',
    data: 'object|null',
  },
};

// Validation helper with detailed error reporting
export function validateEventPayload(eventName, payload) {
  if (!EVENTS[eventName] && !Object.values(EVENTS).includes(eventName)) {
    console.error(`Unknown event: ${eventName}`);
    return false;
  }

  const schema = EVENT_PAYLOADS[eventName];
  if (!schema) return true; // No schema defined, allow any payload

  const errors = [];

  for (const [key, typeSpec] of Object.entries(schema)) {
    const types = typeSpec.split('|');
    const isOptional = types.includes('null');

    if (!(key in payload) && !isOptional) {
      errors.push(`Missing required field '${key}'`);
      continue;
    }

    if (key in payload) {
      const actualType = typeof payload[key];
      const validTypes = types.filter(t => t !== 'null');

      if (!validTypes.includes(actualType) && payload[key] !== null) {
        errors.push(`Invalid type for '${key}': expected ${typeSpec}, got ${actualType}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`Event payload validation failed for ${eventName}:`, errors);
    return false;
  }

  return true;
}

// Helper to create type-safe event emitters
export function createEventEmitter(eventName, beatBus) {
  return payload => {
    if (validateEventPayload(eventName, payload)) {
      beatBus.emit(eventName, payload);
    }
  };
}

// Event groups for bulk operations
export const EVENT_GROUPS = {
  STATE: [EVENTS.STAGE_CHANGE, EVENTS.QUALITY_CHANGE, EVENTS.STATE_CHANGED],
  PERFORMANCE: [
    EVENTS.FPS_UPDATE,
    EVENTS.FPS_WARNING,
    EVENTS.MEMORY_WARNING,
    EVENTS.TIER_ADJUSTMENT,
  ],
  THEATER: [
    EVENTS.THEATER_STATE_CHANGE,
    EVENTS.OPENING_START,
    EVENTS.OPENING_COMPLETE,
    EVENTS.STAGE_ENTRY,
    EVENTS.STAGE_EXIT,
  ],
  DEBUG: [EVENTS.DEBUG_MODE_TOGGLE, EVENTS.DEBUG_OVERLAY_UPDATE, EVENTS.DEBUG_COMMAND_EXECUTE],
};

// Export a frozen version to prevent accidental mutations
export default Object.freeze(EVENTS);

// Also export as named for better IDE support
export { EVENTS as EventCatalog };
