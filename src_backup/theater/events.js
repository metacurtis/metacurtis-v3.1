import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
// src/theater/events.js
// SST v3.0 Complete Event Catalog - All requirements included

export const EVENTS = {
  // Opening phases (SST v3.0 compliant)
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK', // Controls exact blink count
  TERMINAL_TYPE: 'TERMINAL_TYPE',
  SCREEN_FILL: 'SCREEN_FILL',

  // Critical emergence handoff
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
  PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',

  // Narrative control
  START_NARRATIVE: 'START_NARRATIVE',
  NARRATIVE_STAGE_CHANGE: 'NARRATIVE_STAGE_CHANGE',
  NARRATIVE_LINE: 'NARRATIVE_LINE',

  // Memory fragments (SST v3.0 scroll percentages)
  ENABLE_SCROLL: 'ENABLE_SCROLL',
  MEMORY_FRAGMENT_CHECK: 'MEMORY_FRAGMENT_CHECK',
  TRIGGER_FRAGMENT: 'TRIGGER_FRAGMENT',

  // Audio system (SST v3.0 requirements)
  AUDIO_START_STAGE: 'AUDIO_START_STAGE',
  AUDIO_KEY_CLICK: 'AUDIO_KEY_CLICK',
  AUDIO_COMPUTER_HUM: 'AUDIO_COMPUTER_HUM',
  AUDIO_CROSSFADE: 'AUDIO_CROSSFADE',

  // Tier behaviors (SST v3.0 specifications)
  TIER_BEHAVIOR_UPDATE: 'TIER_BEHAVIOR_UPDATE',

  // Stage management
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  BLUEPRINT_READY: 'BLUEPRINT_READY',

  // Prewarm
  PREWARM_GENESIS_BLUEPRINT: 'PREWARM_GENESIS_BLUEPRINT',
  PREWARM_COMPLETE: 'PREWARM_COMPLETE',

  // Director control
  DIRECTOR_CANCEL: 'DIRECTOR_CANCEL',
};

// SST v3.0 Memory Fragment trigger points
export const FRAGMENT_TRIGGERS = {
  genesis: 5, // Commodore 64 at 5%
  discipline: 20, // Marine emblem at 20%
  neural: 35, // Chat interface at 35%
  velocity: 49, // GitHub graph at 49%
  architecture: 63, // FPS counter at 63%
  harmony: 77, // Live code at 77%
  transcendence: 92, // Particle count at 92%
};

// SST v3.0 Stage audio mappings
export const STAGE_AUDIO = {
  genesis: 'genesis-hum.mp3', // 1980s computer hum
  discipline: 'discipline-march.mp3', // Military rhythm
  neural: 'neural-synapse.mp3', // Digital awakening
  velocity: 'velocity-thunder.mp3', // Electronic acceleration
  architecture: 'architecture-build.mp3', // Construction sounds
  harmony: 'harmony-flow.mp3', // Flow state tones
  transcendence: 'transcendence-cosmos.mp3', // Cosmic harmony
};

export default EVENTS;
