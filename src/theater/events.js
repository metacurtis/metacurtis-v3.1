// src/theater/events.js
// SST v3.3 — Complete Event Catalog (canonical, named export)

/**
 * BeatBus Contract (v3.5+ strict)
 *
 * MORPH_PROGRESS payload:
 *   { progress: number (0..1), source: string, timestamp?: number }
 *
 * STAGE_CHANGE payload:
 *   { from: string|null, to: string, source: string, timestamp?: number }
 *
 * Guardrail:
 *   - source is REQUIRED for both events
 *   - progress is the ONLY morph progress field (no value/morphProgress)
 *   - stage change is ONLY {from,to} (no {stage} / {to} alone)
 */

export const EVENTS = {
  // Opening (overlay-only; Director-driven)
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK',
  TERMINAL_TYPE: 'TERMINAL_TYPE',                // { lines[], typeSpeed, lineDelay }
  SCREEN_FILL: 'SCREEN_FILL',                    // { text, scrollSpeed }
  DIRECTOR_OPENING_MODE: 'DIRECTOR_OPENING_MODE',// { mode, stage }
  OPENING_COMPLETE: 'OPENING_COMPLETE',          // Overlay fade + scan-bloat contract

  // Renderer/Theater gates
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',  // { width, height, aspect }

  // Emergence / blueprint handoff
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
  BLUEPRINT_READY: 'BLUEPRINT_READY',            // { blueprint, stage?, quality?, mode? }
  BLUEPRINT_INVALIDATED: 'BLUEPRINT_INVALIDATED',// guard fallback notification
  PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',        // fencepost (emit once)
  FENCEPOST_LISTENERS_READY: 'FENCEPOST_LISTENERS_READY',

  // Renderer tuning & morph
  RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer directives (intent → GPU writes)
  RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
  PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { progress: 0..1 }
  TEXT_MORPH: 'TEXT_MORPH',                      // { word, stage?, particles?, transitionDuration?, source? }
  TEXT_POSITIONS_READY: 'TEXT_POSITIONS_READY',  // { positions, word, stage?, count? }
  GLYPH_MAP_READY: 'GLYPH_MAP_READY',            // { word, stage?, glyphs[], source }

  // Stage / narrative control
  START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
  NARRATIVE_LINE: 'NARRATIVE_LINE',
  NARRATION_STOPPED: 'NARRATION_STOPPED',
  NARRATION_CLEANUP: 'NARRATION_CLEANUP',
  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
  START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence

  // Quality/tier (canonical: tier)
  QUALITY_CHANGE: 'QUALITY_CHANGE',              // { tier }

  // Scroll / fragments
  ENABLE_SCROLL: 'ENABLE_SCROLL',
  MEMORY_FRAGMENT_CHECK: 'MEMORY_FRAGMENT_CHECK',
  SCROLL_PROGRESS: 'SCROLL_PROGRESS',
  PARTICLE_CLICK_REQUEST: 'PARTICLE_CLICK_REQUEST',
  PARTICLE_CLICK_HIT: 'PARTICLE_CLICK_HIT',
  CLIMAX_STEP: 'CLIMAX_STEP',

  // Audio cues
  AUDIO_COMPUTER_HUM: 'AUDIO_COMPUTER_HUM',

  // Prewarm lifecycle
  PREWARM_GENESIS_BLUEPRINT: 'PREWARM_GENESIS_BLUEPRINT',
  PREWARM_COMPLETE: 'PREWARM_COMPLETE',

  // Director control / errors
  DIRECTOR_CANCEL: 'DIRECTOR_CANCEL',
  DIRECTOR_ERROR: 'DIRECTOR_ERROR',
};

// Contract envelope:
//   • Every emitted contract event SHOULD include { source: string, channel: 'renderer'|'engine'|'director', timestamp?: number }
//     so waiters can filter by producer/origin.
//
// RENDER_DIRECTIVE payload contract (high-level intent that the renderer maps to GPU writes):
// {
//   source: 'opening_sequence' | 'narration' | 'diagnostic' | ...,
//   channel?: 'renderer',              // renderer may add when re-emitting fenceposts
//   phase?: 'chaos'|'coalesce'|'settle'|'emergence',
//   stage?: string,
//   uMotionMode?: number,
//   uParticlePhase?: number,
//   uFlowTurbulence?: number,
//   uParticleFlash?: number,
//   uOpacityMin?: number,
//   uOpacityMax?: number,
//   uMorphProgress?: number,           // renderer maps to the uniform
//   uStageProgress?: number,
//   pointSize?: number,                // renderer maps to uPointSize
//   activeCount?: number,              // renderer maps to geometry.setDrawRange
//   gaussianSigma?: number,
//   tierHighlight?: number[],
//   uniforms?: Record<string, number[]|number>,
// }

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
