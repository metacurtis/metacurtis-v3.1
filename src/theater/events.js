// SST v3.3 Complete Event Catalog — pinned contract (clean & safe)

export const EVENTS = {
  // Opening (overlay-only; driven by Director)
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK',                 // { count, interval }
  TERMINAL_TYPE: 'TERMINAL_TYPE',               // { lines[], typeSpeed, lineDelay }
  SCREEN_FILL: 'SCREEN_FILL',                   // { text, scrollSpeed }

  // Renderer/Theater gates
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT', // { width, height, aspect }

  // Emergence handoff
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT', // { sourceText, count }
  PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',                 // emitted ONCE by renderer

  // Renderer tuning & morph
  RENDERER_TUNE: 'RENDERER_TUNE',               // { driftAmp, vibeAmp, flutterAmp, verticalBias, rotZSpeedDegPerSec, trails, brightToward, dimAway, tierReveal, tierSpeedScale, breathingAmp, breathingPeriodSec, flareProb, flareGain, pulseOnce }
  PARTICLE_PHASE: 'PARTICLE_PHASE',             // { name: 'swirl_full' | 'constellation' | ... }
  MORPH_PROGRESS: 'MORPH_PROGRESS',             // { value: 0..1 }

  // Narrative & stage control (canonical shapes)
  START_NARRATIVE: 'START_NARRATIVE',           // { stage }
  NARRATIVE_STAGE_CHANGE: 'NARRATIVE_STAGE_CHANGE',
  NARRATIVE_LINE: 'NARRATIVE_LINE',
  STAGE_CHANGE: 'STAGE_CHANGE',                 // { from, to }  ← canonical (old `{stage}` is deprecated)
  QUALITY_CHANGE: 'QUALITY_CHANGE',             // { tier }      ← canonical (old `{quality}` is deprecated)
  BLUEPRINT_READY: 'BLUEPRINT_READY',           // { blueprint, stage?, quality?, mode? }

  // Scroll / fragments
  ENABLE_SCROLL: 'ENABLE_SCROLL',
  MEMORY_FRAGMENT_CHECK: 'MEMORY_FRAGMENT_CHECK',
  MEMORY_FRAGMENT_TRIGGER: 'MEMORY_FRAGMENT_TRIGGER', // canonical
  // Back-compat alias: keep, but map to canonical string (no self-reference to EVENTS)
  TRIGGER_FRAGMENT: 'MEMORY_FRAGMENT_TRIGGER',

  // Audio
  AUDIO_START_STAGE: 'AUDIO_START_STAGE',       // { stage }
  AUDIO_KEY_CLICK: 'AUDIO_KEY_CLICK',
  AUDIO_COMPUTER_HUM: 'AUDIO_COMPUTER_HUM',
  AUDIO_CROSSFADE: 'AUDIO_CROSSFADE',

  // Tiers (optional)
  TIER_BEHAVIOR_UPDATE: 'TIER_BEHAVIOR_UPDATE',

  // Prewarm
  PREWARM_GENESIS_BLUEPRINT: 'PREWARM_GENESIS_BLUEPRINT',
  PREWARM_COMPLETE: 'PREWARM_COMPLETE',

  // Director control
  DIRECTOR_CANCEL: 'DIRECTOR_CANCEL',
};

// SST v3.x Memory Fragment trigger points (scroll %)
export const FRAGMENT_TRIGGERS = {
  genesis: 5,
  discipline: 20,
  neural: 35,
  velocity: 49,
  architecture: 63,
  harmony: 77,
  transcendence: 92,
};

// Stage → audio file mapping
export const STAGE_AUDIO = {
  genesis: 'genesis-hum.mp3',
  discipline: 'discipline-march.mp3',
  neural: 'neural-synapse.mp3',
  velocity: 'velocity-thunder.mp3',
  architecture: 'architecture-build.mp3',
  harmony: 'harmony-flow.mp3',
  transcendence: 'transcendence-cosmos.mp3',
};

// Dev convenience: expose catalog to the console in dev builds
if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
  // Safe pointer for ad-hoc console usage: EVENTS.ENGINE_VIEWPORT_HINT, etc.
  // (ESM remains the source of truth in code)
  window.EVENTS = EVENTS;
}

export default EVENTS;
