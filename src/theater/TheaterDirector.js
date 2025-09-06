// src/theater/TheaterDirector.js
// SST v3.3 BeatGlyph Theater Director — singleton (race-free opening)

import BeatBus from "@/theater/bus";
import { EVENTS } from "./events.js";
import ScrollOrchestrator from "./ScrollOrchestrator.js";

class TheaterDirector {
  constructor() {
    this.phase = "idle";
    this.cancelled = false;
    this.isRunning = false;
    this.hasRun = false;
    this.startTime = null;
    this.timeline = {};
    this.scrollOrchestrator = null;
  }

  async start() {
    if (this.isRunning) {
      console.log("🎬 Director: Already running, ignoring duplicate start");
      return;
    }

    this.isRunning = true;
    this.cancelled = false;
    this.phase = "starting";
    this.startTime = Date.now();

    console.log("🎬 Director: Starting SST v3.3 BeatGlyph show");

    try {
      // (Optional) Quick prewarm without blocking the opening timeline.
      await this.prewarm();

      // ───────────────── Phase 1: Black (2s)
      this.phase = "black";
      console.log("   Phase: Black screen (2s)");
      await this.sleep(2000);
      if (this.cancelled) return;

      // ───────────────── Phase 2: Cursor blinks
      this.phase = "cursor";
      console.log("   Phase: Cursor (blinks twice)");
      BeatBus.emit(EVENTS.CURSOR_SHOW);
      await this.sleep(500);
      BeatBus.emit(EVENTS.CURSOR_BLINK, { count: 2, interval: 500 });
      await this.sleep(2500);
      if (this.cancelled) return;

      // ───────────────── Phase 3: Terminal typing
      this.phase = "terminal";
      console.log("   Phase: Terminal typing");
      BeatBus.emit(EVENTS.TERMINAL_TYPE, {
        lines: ['READY.', '10 PRINT "HELLO CURTIS"', '20 GOTO 10', 'RUN'],
        typeSpeed: 100,
        lineDelay: 500
      });
      await this.sleep(3800);
      if (this.cancelled) return;

      // ───────────────── Phase 4: Fill
      this.phase = "fill";
      console.log("   Phase: Screen fill");
      BeatBus.emit(EVENTS.SCREEN_FILL, { text: "HELLO CURTIS ", scrollSpeed: 50 });
      await this.sleep(3000);
      if (this.cancelled) return;

      // ───────────────── Phase 5: Emergence (race-free)
      this.phase = "emergence";
      console.log("💥 Phase: Big Bang emergence");

      // 1) Build emergence now (Engine → emergence blueprint with mode:'emergence')
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, { sourceText: "HELLO CURTIS", count: 2000 });

      // 2) Begin overlay fade & small arrival easing in renderer (no emit here)
      BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);

      // 3) Wait only for the renderer fencepost:
      //    renderer emits PARTICLES_EMERGED after it binds the FIRST full genesis post-emergence
      await this.once(EVENTS.PARTICLES_EMERGED, 3000);
      if (this.cancelled) return;

      // ───────────────── Handoff: Stage-0 (genesis)
      BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: "genesis" });

      // ───────────────── Phase 6: Settle Stage-0 before scroll
      this.phase = "genesis";
      console.log("🧬 Phase: Genesis — narrative begins");
      BeatBus.emit(EVENTS.AUDIO_START_STAGE, { stage: "genesis" });
      BeatBus.emit(EVENTS.START_NARRATIVE, { stage: "genesis" });

      // Schedule BeatGlyph reveal (~30s into genesis)
      setTimeout(() => {
        BeatBus.emit(EVENTS.MORPH_TO_BEATGLYPH, { text: "HELLO CURTIS" });
        // drive morph 0→1 into glyph
        BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0 });
        this._easeMorphTo(1, 1500);
      }, 30000);

      // Ensure we start at top (avoid immediate stage jumps when orchestrator starts)
      try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch {}

      // Settle morph 0 → 1 (landing on constellation), then enable scroll
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0 });
      await this._easeMorphTo(1, 1400);
      BeatBus.emit(EVENTS.ENABLE_SCROLL);

      // ───────────────── Orchestrator (after opening)
      if (!this.scrollOrchestrator) this.scrollOrchestrator = new ScrollOrchestrator();
      this.scrollOrchestrator.start();

      this.monitorFragments();

      // ───────────────── Done
      this.phase = "complete";
      const elapsed = Date.now() - this.startTime;
      console.log("🎬 Director: Hand-off complete → user-driven experience");
      console.log(`   Total opening time: ${elapsed}ms`);

      this.hasRun = true;
      this.isRunning = false;
    } catch (error) {
      console.error("Director error:", error);
      this.isRunning = false;
      this.phase = "error";
    }
  }

  async prewarm() {
    // Keep non-blocking; audio may be muted in browsers until user gesture.
    // If your audio source is missing, this avoids waiting forever.
    try {
      BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
      await this.once(EVENTS.PREWARM_COMPLETE, 500);
    } catch {
      // non-fatal
    }
  }

  monitorFragments() {
    // Orchestrator owns fragment triggers; placeholder for future hooks
  }

  cancel() {
    if (!this.isRunning) return;
    console.log("🎬 Director: Cancelling show");
    this.cancelled = true;
    this.isRunning = false;
    this.phase = "cancelled";
    this.scrollOrchestrator?.stop();
    BeatBus.emit(EVENTS.DIRECTOR_CANCEL);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Smooth morph 0..1
  _easeMorphTo(target = 1, duration = 1400) {
    return new Promise((resolve) => {
      const start = performance.now();
      const ease = (t) => t * t * (3 - 2 * t);
      const step = (now) => {
        if (this.cancelled) return resolve();
        const k = Math.min(1, (now - start) / duration);
        const v = ease(k) * target;
        BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  once(event, timeout = 5000) {
    return new Promise((resolve) => {
      let timeoutId;
      const handler = (data) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(data);
      };
      const unsubscribe = BeatBus.on(event, handler);
      timeoutId = setTimeout(() => {
        console.warn(`⚠️ Director: ${event} timed out after ${timeout}ms`);
        unsubscribe();
        resolve(null);
      }, timeout);
    });
  }

  getStatus() {
    return {
      phase: this.phase,
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      cancelled: this.cancelled,
      isRunning: this.isRunning,
      hasRun: this.hasRun,
      timeline: this.timeline
    };
  }
}

const director = new TheaterDirector();
if (typeof window !== "undefined") {
  window.theaterDirector = director;
}
export default director;
