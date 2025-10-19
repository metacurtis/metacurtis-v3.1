// src/theater/events-safe.js
// Safe subset of events for incremental testing

export const EVENTS_CORE = {
  // Critical opening sequence events
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  BLUEPRINT_READY: 'BLUEPRINT_READY',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',
};

export const EVENTS_OPENING = {
  // Opening sequence specific
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK',
  TERMINAL_TYPE: 'TERMINAL_TYPE',
  SCREEN_FILL: 'SCREEN_FILL',
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',
  ENABLE_SCROLL: 'ENABLE_SCROLL',
};

export const EVENTS_RUNTIME = {
  // Runtime events
  RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',
  MORPH_PROGRESS: 'MORPH_PROGRESS',
  RENDERER_TUNE: 'RENDERER_TUNE',
  SCROLL_PROGRESS: 'SCROLL_PROGRESS',
  CLIMAX_STEP: 'CLIMAX_STEP',
  START_CLIMAX: 'START_CLIMAX',
  TICK: 'TICK',
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
};

// Feature flag controlled expansion
export const EVENTS = (() => {
  const events = { ...EVENTS_CORE };
  
  // Always include opening events (they're working)
  Object.assign(events, EVENTS_OPENING);
  
  // Conditionally add runtime events
  if (typeof window !== 'undefined') {
    if (window.CANON_FEATURES?.runtimeEvents !== false) {
      Object.assign(events, EVENTS_RUNTIME);
    }
  }
  
  return events;
})();

export default EVENTS;
