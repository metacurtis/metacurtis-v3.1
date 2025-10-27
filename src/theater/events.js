// src/theater/events.js
// SST v3.3 — Complete Event Catalog (canonical, named export)

export const EVENTS = {
  // Opening (overlay-only; Director-driven)
  /**
   * Emitted by TheaterDirector during the opening blackout to show the terminal cursor.
   * Listeners: OpeningSequence.jsx (cursor overlay).
   */
  CURSOR_SHOW: 'CURSOR_SHOW',
  /**
   * Emitted by TheaterDirector to blink the terminal cursor twice before typing begins.
   * Listeners: OpeningSequence.jsx.
   */
  CURSOR_BLINK: 'CURSOR_BLINK',
  /**
   * Emitted by TheaterDirector while typing the SST intro copy.
   * Listeners: OpeningSequence.jsx render the terminal text.
   */
  TERMINAL_TYPE: 'TERMINAL_TYPE',                // { lines[], typeSpeed, lineDelay }
  /**
   * Emitted when the terminal fills the screen prior to emergence.
   * Listeners: OpeningSequence.jsx handles the overlay fade.
   */
  SCREEN_FILL: 'SCREEN_FILL',                    // { text, scrollSpeed }

  // Renderer/Theater gates
  /**
   * Emitted by WebGLBackground/ConsciousnessTheater when the renderer resolves dimensions.
   * Listeners: TheaterDirector (start gate), ConsciousnessTheater (initialization guard).
   */
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',  // { width, height, aspect }

  // Emergence / blueprint handoff
  /**
   * Emitted by TheaterDirector (and manual state tools) to request a fresh emergence blueprint.
   * Listeners: ConsciousnessEngine._onBuildEmergence.
   */
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
  /**
   * Emitted by ConsciousnessEngine whenever a blueprint is built or loaded from cache.
   * Listeners: WebGLBackground (bind geometry), diagnostics hooks.
   */
  BLUEPRINT_READY: 'BLUEPRINT_READY',            // { blueprint, stage?, quality?, mode? }
  BLUEPRINT_INVALIDATED: 'BLUEPRINT_INVALIDATED',// guard fallback notification
  /**
   * Emitted by TheaterDirector when the renderer should begin the emergence morph.
   * Listeners: OpeningSequence.jsx (overlay state), WebGLBackground (timeline prime).
   */
  PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
  /**
   * Emitted by WebGLBackground once emergence morph reaches the renderer fencepost.
   * Listeners: TheaterDirector waits on this before handing off to genesis.
   */
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',        // fencepost (emit once)
  /**
   * Emitted by TheaterDirector to announce readiness for fencepost acknowledgements.
   * Listeners: WebGLBackground flushes any queued fencepost payloads.
   */
  FENCEPOST_LISTENERS_READY: 'FENCEPOST_LISTENERS_READY',

  // Renderer tuning & morph
  /**
   * Primary renderer command channel emitted by ConsciousnessEngine (morphs, draw counts, effects).
   * Listeners: WebGLBackground applies uniforms and draw ranges.
   */
  RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer draw/morph directives
  RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
  /**
   * Emitted by TheaterDirector during phases (chaos/coalesce/settle) to annotate diagnostics.
   * Listeners: WebGLBackground traces the active phase for probes.
   */
  PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
  /**
   * Emitted by ScrollOrchestrator and the emergence timeline to broadcast morph progress (0..1).
   * Listeners: WebGLBackground updates shader uniform uMorphProgress.
   */
  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }

  // Stage / narrative control
  /**
   * Emitted by TheaterDirector and navigation utilities when a stage’s narration should play.
   * Listeners: NarrationController, NarrationOverlayBus, ConsciousnessTheater.
   */
  START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
  NARRATIVE_LINE: 'NARRATIVE_LINE',
  NARRATION_STOPPED: 'NARRATION_STOPPED',
  NARRATION_CLEANUP: 'NARRATION_CLEANUP',
  /**
   * Canonical stage transition signal emitted by TheaterDirector (opening) and state bridges.
   * Listeners: ConsciousnessEngine, qualityAtom, UnifiedNavigationAPI observers.
   */
  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
  START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence

  // Quality/tier (canonical: tier)
  /**
   * Emitted by StateCommands when the quality atom changes tiers.
   * Listeners: ConsciousnessEngine adjusts particle budgets.
   */
  QUALITY_CHANGE: 'QUALITY_CHANGE',              // { tier }

  // Scroll / fragments
  ENABLE_SCROLL: 'ENABLE_SCROLL',
  MEMORY_FRAGMENT_CHECK: 'MEMORY_FRAGMENT_CHECK',
  /**
   * Emitted continuously by ScrollOrchestrator to broadcast scroll percentage and morph targets.
   * Listeners: narrative overlays and diagnostics.
   */
  SCROLL_PROGRESS: 'SCROLL_PROGRESS',
  /**
   * Emitted by WebGLCanvas when the user requests a raycast against particles.
   * Listeners: WebGLBackground handles the hit test.
   */
  PARTICLE_CLICK_REQUEST: 'PARTICLE_CLICK_REQUEST',
  /**
   * Emitted by WebGLBackground after a particle raycast succeeds.
   * Listeners: overlays/diagnostics respond to hotspot interactions.
   */
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
