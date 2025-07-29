// src/core/CentralStageClock.js
// -------------------------------------------------------------
// Unified Stage Clock - SST v3.x
// -------------------------------------------------------------
//  • start(stage)   : begin ticking for a stage
//  • pause() / resume()
//  • seek(ms)       : jump within current stage
//  • dispose()      : stop rAF
//  • dispatches CustomEvent('stageClock', { detail:{ ... } }) each frame
// -------------------------------------------------------------

import TIMELINE from '../config/sst3/narrative-timeline.json';

class CentralStageClock extends EventTarget {
  constructor() {
    super();

    this.currentStage = 'genesis';
    this.stageStartTime = Date.now();
    this.lastTickTime = 0;

    this.isPaused = false;
    this.rafId = null;
    this.debug = import.meta.env.DEV;

    this.stageDurations = this._computeStageDurations();
  }

  /* -------------------------------------------------- */
  /* Public controls                                    */
  /* -------------------------------------------------- */
  start(stage) {
    this.currentStage = stage;
    this.stageStartTime = Date.now();
    this.lastTickTime = 0;
    this.isPaused = false;

    if (this.debug) console.log(`⏰ Stage Clock | start "${stage}"`);
    this._tick();
  }

  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.stageStartTime = Date.now() - this.lastTickTime;
    this._tick();
  }

  /** Jump to an absolute ms offset inside the current stage. */
  seek(ms) {
    this.stageStartTime = Date.now() - ms;
    this.lastTickTime = ms;
    this._emit(ms);
  }

  /** Stop forever - used on hot-module dispose. */
  dispose() {
    this.pause(); // stopping rAF is enough for GC.
  }

  /* -------------------------------------------------- */
  /* Internal helpers                                   */
  /* -------------------------------------------------- */
  _computeStageDurations() {
    const out = {};
    for (const [stage, segs] of Object.entries(TIMELINE)) {
      const last = segs[segs.length - 1];
      out[stage] = last.at + last.dur + 2000; // +2 s buffer
    }
    return out;
  }

  _tick = () => {
    if (this.isPaused) return;

    const elapsed = Date.now() - this.stageStartTime;
    this.lastTickTime = elapsed;
    this._emit(elapsed);

    this.rafId = requestAnimationFrame(this._tick);
  };

  _emit(elapsed) {
    const stage = this.currentStage;
    const duration = this.stageDurations[stage] || 1; // guard division by 0

    this.dispatchEvent(
      new CustomEvent('stageClock', {
        detail: {
          stage,
          t: elapsed,
          timeline: TIMELINE[stage],
          duration,
          progress: elapsed / duration,
        },
      })
    );
  }
}

/* ------------------------------------------------------ */
/* Singleton export                                       */
/* ------------------------------------------------------ */
export const stageClock = new CentralStageClock();
export default stageClock;

/* ------------------------------------------------------ */
/* Developer helpers (DEV only)                           */
/* ------------------------------------------------------ */
if (import.meta.env.DEV) {
  window.stageClock = stageClock;
  window.timelineTools = {
    seek: ms => stageClock.seek(ms),
    nudge: s => stageClock.seek(stageClock.lastTickTime + s * 1000),
    pause: () => stageClock.pause(),
    resume: () => stageClock.resume(),
    jumpTo: stg => stageClock.start(stg),
    getTimeline: () => TIMELINE,
  };

  console.log('⏰ Stage Clock ready - timelineTools.* available in DevTools');
}
