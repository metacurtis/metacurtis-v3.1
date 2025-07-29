// src/orchestration/BeatBus.js
// Central event bus for SST v3.0 with timeline integration

export const Events = Object.freeze({
  // Clock events
  STAGE_CLOCK: 'stageClock',
  STAGE_CHANGE: 'stage:change',

  // Narrative events
  SEGMENT_START: 'segment:start',
  SEGMENT_END: 'segment:end',

  // Fragment events
  FRAGMENT_TRIGGER: 'fragment:trigger',
  FRAGMENT_SHOW: 'fragment:show',
  FRAGMENT_DISMISS: 'fragment:dismiss',

  // Visual effect events
  SHADER_UPDATE: 'shader:update',
  SHADER_TWEEN: 'shader:tween',
  CAMERA_MOVE: 'camera:move',
  CAMERA_PRESET: 'camera:preset',
  PARTICLES_EFFECT: 'particles:effect',

  // Performance events
  QUALITY_CHANGE: 'quality:change',
  FPS_WARNING: 'fps:warning',
});

class BeatBus extends EventTarget {
  constructor() {
    super();
    this.debug = import.meta.env.DEV;
    this.eventLog = [];
    this.maxLogSize = 100;
  }

  emit(type, detail) {
    if (this.debug) {
      console.log(`🎵 BeatBus: ${type}`, detail);
      this.eventLog.push({ type, detail, timestamp: Date.now() });
      if (this.eventLog.length > this.maxLogSize) {
        this.eventLog.shift();
      }
    }

    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, handler) {
    const wrappedHandler = event => handler(event.detail);
    this.addEventListener(type, wrappedHandler);
    return;
    return () => this.removeEventListener(type, wrappedHandler);
  }

  once(type, handler) {
    const wrappedHandler = event => {
      handler(event.detail);
      this.removeEventListener(type, wrappedHandler);
    };
    this.addEventListener(type, wrappedHandler);
    return;
  }

  getEventLog() {
    return [...this.eventLog];
  }

  clearEventLog() {
    this.eventLog = [];
  }
}

// Create singleton
export const beatBus = new BeatBus();

// Dev helpers
if (import.meta.env.DEV) {
  window.beatBus = beatBus;
  window.Events = Events;
}

export default beatBus;
