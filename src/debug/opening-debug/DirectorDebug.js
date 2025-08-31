import BeatBus from "@/modules/orchestration/core/BeatBus.js";
import { EVENTS } from "@/theater/events.js";

export class DirectorDebug {
  constructor(opts = {}) {
    this.opts = {
      emergenceCount: 2000,
      morphHold: 1.0,           // keep text fully formed at start
      autoAdvanceTo: "genesis", // advance to first stage you want post-text
      autoAdvanceDelayMs: 1200, // pause while the text is visible
      ...opts,
    };
    this._tick = this._tick.bind(this);
    this._raf = null;
    this._start = 0;
    this._phase = "idle";
  }

  play() {
    BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
    BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      sourceText: "HELLO CURTIS",
      count: this.opts.emergenceCount,
    });
    this._phase = "emergence";
    this._start = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  _tick(now) {
    const t = (now - this._start) / 1000;

    if (this._phase === "emergence") {
      // smoothstep to morphHold
      const k = Math.min(1, t / 0.9);
      const v = k*k*(3-2*k) * this.opts.morphHold;
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });

      if (k >= 1) {
        this._phase = "hold";
        this._start = performance.now();
        BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);
      }
    } else if (this._phase === "hold") {
      if (now - this._start > this.opts.autoAdvanceDelayMs) {
        BeatBus.emit(EVENTS.PARTICLES_EMERGED);
        // re-emit stage so tint uniforms reapply immediately
        BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: this.opts.autoAdvanceTo });
        this._phase = "done";
      }
    }

    if (this._phase !== "done") this._raf = requestAnimationFrame(this._tick);
  }

  stop() { if (this._raf) cancelAnimationFrame(this._raf); }
}
