// src/theater/events.js
// SST v3.3 — Complete Event Catalog (canonical, named export)

export const EVENTS = {
  // Opening (overlay-only; Director-driven)
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK',
  TERMINAL_TYPE: 'TERMINAL_TYPE',          // { lines[], typeSpeed, lineDelay }
  SCREEN_FILL: 'SCREEN_FILL',              // { text, scrollSpeed }

  // Renderer/Theater gates
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT', // { width, height, aspect }

  // Emergence / blueprint handoff
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
  BLUEPRINT_READY: 'BLUEPRINT_READY',           // { blueprint, stage?, quality?, mode? }
  PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',       // fencepost (emit once)

  // Renderer tuning & morph
  RENDERER_TUNE: 'RENDERER_TUNE',               // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
  PARTICLE_PHASE: 'PARTICLE_PHASE',             // { name }
  MORPH_PROGRESS: 'MORPH_PROGRESS',             // { value: 0..1 }

  // Stage / narrative control
  START_NARRATIVE: 'START_NARRATIVE',           // { id?, stage? }
  NARRATIVE_STAGE_CHANGE: 'NARRATIVE_STAGE_CHANGE',
  NARRATIVE_LINE: 'NARRATIVE_LINE',
  STAGE_CHANGE: 'STAGE_CHANGE',                 // { from, to } (canonical)
  STAGE_CHANGED: 'STAGE_CHANGED',               // (legacy/compat)
  STAGE_TRANSITION: 'STAGE_TRANSITION',

  // Quality/tier (canonical: tier)
  QUALITY_CHANGE: 'QUALITY_CHANGE',             // { tier }

  // Scroll / fragments
  ENABLE_SCROLL: 'ENABLE_SCROLL',
  MEMORY_FRAGMENT_CHECK: 'MEMORY_FRAGMENT_CHECK',
  MEMORY_FRAGMENT_START: 'MEMORY_FRAGMENT_START',
  MEMORY_FRAGMENT_END: 'MEMORY_FRAGMENT_END',
  MEMORY_FRAGMENT_TRIGGER: 'MEMORY_FRAGMENT_TRIGGER',
  // Back-compat alias (string literal, not self-reference)
  TRIGGER_FRAGMENT: 'MEMORY_FRAGMENT_TRIGGER',

  // Audio cues
  AUDIO_START_STAGE: 'AUDIO_START_STAGE',       // { stage }
  AUDIO_KEY_CLICK: 'AUDIO_KEY_CLICK',
  AUDIO_COMPUTER_HUM: 'AUDIO_COMPUTER_HUM',
  AUDIO_CROSSFADE: 'AUDIO_CROSSFADE',

  // Tier/system behavior (optional hooks)
  TIER_BEHAVIOR_UPDATE: 'TIER_BEHAVIOR_UPDATE',

  // Prewarm lifecycle
  PREWARM_GENESIS_BLUEPRINT: 'PREWARM_GENESIS_BLUEPRINT',
  PREWARM_COMPLETE: 'PREWARM_COMPLETE',

  // Director control / errors
  DIRECTOR_CANCEL: 'DIRECTOR_CANCEL',
  DIRECTOR_ERROR: 'DIRECTOR_ERROR',
};

// SST v3.x — Memory Fragment trigger points (scroll %)
export const FRAGMENT_TRIGGERS = {
  genesis: 5,
  discipline: 20,
  neural: 35,
  velocity: 49,
  architecture: 63,
  harmony: 77,
  transcendence: 92,
};

// Stage → audio file mapping (example placeholders)
export const STAGE_AUDIO = {
  genesis: 'genesis-hum.mp3',
  discipline: 'discipline-march.mp3',
  neural: 'neural-synapse.mp3',
  velocity: 'velocity-thunder.mp3',
  architecture: 'architecture-build.mp3',
  harmony: 'harmony-flow.mp3',
  transcendence: 'transcendence-cosmos.mp3',
};

// Dev convenience: expose catalog for console use (source of truth remains ESM)
if (typeof window !== 'undefined') {
  try {
    const isDevHost = /^(localhost|127\.|0\.0\.0\.0)$/i.test(location.hostname);
    if (isDevHost) window.EVENTS = EVENTS;
  } catch {}
}

export default EVENTS;
