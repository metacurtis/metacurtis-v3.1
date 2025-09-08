// src/theater/TheaterDirector.js
// SST v3.3 BeatGlyph Theater Director — singleton (race-free opening, min-fill protected)

import BeatBus from "@/theater/bus";                                    // 01: Event bus (single source of truth)
import { EVENTS } from "./events.js";                                   // 02: Canonical event names
import ScrollOrchestrator from "./ScrollOrchestrator.js";               // 03: Scroll owner (starts after opening)

// --- Tunables (kept tight; visible in logs for diagnosis) ---
const BLACK_MS               = 2000;                                    // 04: Phase 1: black hold
const CURSOR_BLINK_COUNT     = 2;                                       // 05: Phase 2: cursor blinks exactly N
const CURSOR_BLINK_INTERVAL  = 500;                                     // 06: Blink interval (ms)
const TYPE_SPEED_MS          = 100;                                     // 07: Terminal typing speed (ms/char)
const LINE_DELAY_MS          = 500;                                     // 08: Delay between printed lines
const FILL_DWELL_MS          = 3000;                                    // 09: Canon fill dwell
const MIN_FILL_VISIBLE_MS    = 1200;                                    // 10: Hard minimum "feel" (Vision v1)
const EMERGENCE_TIMEOUT_MS   = 3000;                                    // 11: Fencepost wait for PARTICLES_EMERGED
const SETTLE_MS              = 1400;                                    // 12: Morph 0→1 settle time (Stage-0)

// Terminal lines (text-first)
const DEFAULT_LINES = [                                                // 13: Terminal text; OpeningSequence renders
  'READY.',                                                            // 14
  '10 PRINT "HELLO CURTIS"',                                          // 15
  '20 GOTO 10',                                                        // 16
  'RUN'                                                                // 17
];                                                                     // 18

class TheaterDirector {                                                // 19
  constructor() {                                                      // 20
    this.phase = "idle";                                               // 21: State machine phase
    this.cancelled = false;                                            // 22: Cancellation latch
    this.isRunning = false;                                            // 23: Re-entrancy guard
    this.hasRun = false;                                               // 24: One-shot opening
    this.startTime = null;                                             // 25: Wall clock ms at start()
    this.timeline = {};                                                // 26: Markers for ATS / vision
    this.scrollOrchestrator = null;                                    // 27: Late start after ENABLE_SCROLL
    this._disposables = [];                                            // 28: Cleanups (timeouts/listeners/raf)
  }                                                                    // 29

  // --- Helpers -------------------------------------------------------
  _mark(k, v = performance.now()) {                                    // 30: Timeline marker
    this.timeline[k] = v;                                              // 31
  }                                                                    // 32
  _emit(ev, payload) {                                                 // 33: Typed emit wrapper
    try { BeatBus.emit(ev, payload); } catch (e) {                     // 34
      console.warn("Director emit failed:", ev, e?.message);           // 35
    }                                                                  // 36
  }                                                                    // 37
  _on(ev, fn) {                                                        // 38: Sub with auto-unsubscribe
    const off = BeatBus.on(ev, fn);                                    // 39
    this._disposables.push(off);                                       // 40
    return off;                                                        // 41
  }                                                                    // 42
  _after(ms, fn) {                                                     // 43: Timeout with tracking
    const id = setTimeout(() => { try { fn(); } finally {              // 44
      this._disposables = this._disposables.filter(x => x !== id);     // 45
    }}, ms);                                                           // 46
    this._disposables.push(id);                                        // 47
    return id;                                                         // 48
  }                                                                    // 49
  _sleep(ms) {                                                         // 50: Awaitable sleep (respects cancel)
    return new Promise(res => {                                        // 51
      const id = this._after(ms, res);                                 // 52
      if (this.cancelled) { clearTimeout(id); res(); }                 // 53
    });                                                                // 54
  }                                                                    // 55

  // --- Entry ---------------------------------------------------------
  async start() {                                                      // 56
    if (this.isRunning) {                                              // 57
      console.log("🎬 Director: Already running, ignoring duplicate start"); // 58
      return;                                                          // 59
    }                                                                  // 60
    this.isRunning = true;                                             // 61
    this.cancelled = false;                                            // 62
    this.phase = "starting";                                           // 63
    this.startTime = Date.now();                                       // 64
    this.timeline = {};                                                // 65
    this._mark('tStart');                                              // 66

    console.log("🎬 Director: Starting SST v3.3 BeatGlyph show");      // 67

    try {                                                              // 68
      await this.prewarm();                                            // 69
      if (this.cancelled) return this._finalizeCancel();               // 70

      // Phase 1: black hold                                           
      this.phase = "black";                                            // 71
      console.log("   Phase: Black screen (2s)");                      // 72
      this._mark('tBlack');                                            // 73
      await this._sleep(BLACK_MS);                                     // 74
      if (this.cancelled) return this._finalizeCancel();               // 75

      // Phase 2: cursor blinks                                         
      this.phase = "cursor";                                           // 76
      console.log("   Phase: Cursor (blinks twice)");                  // 77
      this._emit(EVENTS.CURSOR_SHOW);                                  // 78
      await this._sleep(CURSOR_BLINK_INTERVAL);                        // 79
      this._emit(EVENTS.CURSOR_BLINK, {                                // 80
        count: CURSOR_BLINK_COUNT, interval: CURSOR_BLINK_INTERVAL     // 81
      });                                                              // 82
      await this._sleep(CURSOR_BLINK_INTERVAL * CURSOR_BLINK_COUNT * 2);// 83
      if (this.cancelled) return this._finalizeCancel();               // 84

      // Phase 3: terminal typing                                       
      this.phase = "terminal";                                         // 85
      console.log("   Phase: Terminal typing");                        // 86
      this._mark('tType');                                             // 87
      this._emit(EVENTS.TERMINAL_TYPE, {                               // 88
        lines: DEFAULT_LINES,                                          // 89
        typeSpeed: TYPE_SPEED_MS,                                      // 90
        lineDelay: LINE_DELAY_MS                                       // 91
      });                                                              // 92
      // Estimate duration (safe margin; the overlay does the real work)
      const estChars = DEFAULT_LINES.reduce((n,s)=>n+s.length,0);      // 93
      const estTyping = estChars*TYPE_SPEED_MS +                       // 94
                        (DEFAULT_LINES.length-1)*LINE_DELAY_MS + 200;  // 95
      await this._sleep(estTyping);                                    // 96
      if (this.cancelled) return this._finalizeCancel();               // 97

      // Phase 4: fill (progressive; min-fill guard enforced)           
      this.phase = "fill";                                             // 98
      console.log("   Phase: Screen fill");                            // 99
      this._mark('tFill');                                             // 100
      this._emit(EVENTS.SCREEN_FILL, {                                 // 101
        text: "HELLO CURTIS ", scrollSpeed: 50                         // 102
      });                                                              // 103
      await this._sleep(FILL_DWELL_MS);                                // 104
      if (this.cancelled) return this._finalizeCancel();               // 105

      // Phase 5: emergence (race-free; min-fill enforced)              
      this.phase = "emergence";                                        // 106
      console.log("   Phase: Particle emergence");                     // 107

      // Enforce min fill visibility even if we arrive early            
      const now = performance.now();                                   // 108
      const sinceFill = now - (this.timeline.tFill || now);            // 109
      if (sinceFill < MIN_FILL_VISIBLE_MS) {                           // 110
        await this._sleep(MIN_FILL_VISIBLE_MS - sinceFill);            // 111
        if (this.cancelled) return this._finalizeCancel();             // 112
      }                                                                // 113

      // 1) Build emergence (Engine emits BLUEPRINT_READY with mode:'emergence')
      this._emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {                   // 114
        sourceText: "HELLO CURTIS", count: 2000                        // 115
      });                                                              // 116

      // 2) Signal overlay fade & renderer arrival-ease (no fencepost here)
      this._emit(EVENTS.PARTICLES_START_EMERGING);                     // 117

      // 3) Wait for renderer fencepost (emit-once)                     
      await this.once(EVENTS.PARTICLES_EMERGED, EMERGENCE_TIMEOUT_MS); // 118
      if (this.cancelled) return this._finalizeCancel();               // 119

      // Handoff: Stage-0 genesis                                       
      this._emit(EVENTS.STAGE_CHANGE, { stage: "genesis" });           // 120

      // Phase 6: settle Stage-0 before enabling scroll                 
      this.phase = "genesis";                                          // 121
      console.log("🧬 Phase: Genesis — narrative begins");              // 122
      this._emit(EVENTS.AUDIO_START_STAGE, { stage: "genesis" });      // 123
      this._emit(EVENTS.START_NARRATIVE,   { stage: "genesis" });      // 124

      try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch {} // 125
      this._emit(EVENTS.MORPH_PROGRESS, { value: 0 });                 // 126
      await this._easeMorphTo(1, SETTLE_MS);                           // 127
      if (this.cancelled) return this._finalizeCancel();               // 128

      this._emit(EVENTS.ENABLE_SCROLL);                                // 129

      // Orchestrator (after opening)                                   
      if (!this.scrollOrchestrator) this.scrollOrchestrator = new ScrollOrchestrator(); // 130
      try { this.scrollOrchestrator.start(); } catch (e) {             // 131
        console.warn('Orchestrator start failed:', e?.message);        // 132
      }                                                                // 133

      this._mark('tHandoffComplete');                                  // 134
      this.monitorFragments();                                         // 135

      // Done                                                           
      this.phase = "complete";                                         // 136
      const elapsed = Date.now() - this.startTime;                     // 137
      console.log("🎬 Director: Hand-off complete → user-driven experience"); // 138
      console.log(`   Total opening time: ${elapsed}ms`);              // 139

      this.hasRun = true;                                              // 140
      this.isRunning = false;                                          // 141
    } catch (error) {                                                  // 142
      console.error("Director error:", error);                         // 143
      this.isRunning = false;                                          // 144
      this.phase = "error";                                            // 145
    }                                                                   // 146
  }                                                                      // 147

  async prewarm() {                                                     // 148
    // Non-blocking: emit prewarm, await PREWARM_COMPLETE briefly       
    try {                                                               // 149
      this._emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);                     // 150
      await this.once(EVENTS.PREWARM_COMPLETE, 500);                    // 151
    } catch { /* non-fatal */ }                                         // 152
  }                                                                      // 153

  monitorFragments() { /* Orchestrator owns triggers; reserved hook */ } // 154

  cancel() {                                                            // 155
    if (!this.isRunning) return;                                        // 156
    console.log("🎬 Director: Cancelling show");                        // 157
    this.cancelled = true;                                              // 158
    this.isRunning = false;                                             // 159
    this.phase = "cancelled";                                           // 160
    try { this.scrollOrchestrator?.stop?.(); } catch {}                 // 161
    this._emit(EVENTS.DIRECTOR_CANCEL);                                 // 162
    this._finalizeCancel();                                             // 163
  }                                                                      // 164

  _finalizeCancel() {                                                   // 165
    // Clear timeouts/listeners                                         
    for (const d of this._disposables) {                                // 166
      if (typeof d === 'function') { try { d(); } catch {} }            // 167
      else { try { clearTimeout(d); } catch {} }                        // 168
    }                                                                   // 169
    this._disposables.length = 0;                                       // 170
  }                                                                      // 171

  sleep(ms) { return this._sleep(ms); }                                  // 172

  _easeMorphTo(target = 1, duration = SETTLE_MS) {                      // 173
    return new Promise((resolve) => {                                    // 174
      const start = performance.now();                                   // 175
      const ease  = (t) => t * t * (3 - 2 * t);                          // 176
      const step  = (now) => {                                           // 177
        if (this.cancelled) return resolve();                            // 178
        const k = Math.min(1, (now - start) / duration);                 // 179
        const v = ease(k) * target;                                      // 180
        this._emit(EVENTS.MORPH_PROGRESS, { value: v });                 // 181
        if (k < 1) requestAnimationFrame(step); else resolve();          // 182
      };                                                                 // 183
      requestAnimationFrame(step);                                       // 184
    });                                                                  // 185
  }                                                                      // 186

  once(event, timeout = 5000) {                                          // 187
    return new Promise((resolve) => {                                     // 188
      let timeoutId;                                                     // 189
      const handler = (data) => {                                        // 190
        clearTimeout(timeoutId); unsubscribe(); resolve(data);           // 191
      };                                                                 // 192
      const unsubscribe = this._on(event, handler);                      // 193
      timeoutId = setTimeout(() => {                                     // 194
        console.warn(`⚠️ Director: ${event} timed out after ${timeout}ms`); // 195
        try { unsubscribe(); } catch {}                                   // 196
        resolve(null);                                                    // 197
      }, timeout);                                                        // 198
      this._disposables.push(timeoutId);                                  // 199
    });                                                                   // 200
  }                                                                       // 201

  getStatus() {                                                           // 202
    return {                                                              // 203
      phase: this.phase,                                                  // 204
      elapsed: this.startTime ? Date.now() - this.startTime : 0,          // 205
      cancelled: this.cancelled,                                          // 206
      isRunning: this.isRunning,                                          // 207
      hasRun: this.hasRun,                                                // 208
      timeline: this.timeline                                              // 209
    };                                                                     // 210
  }                                                                        // 211
}                                                                          // 212

const director = new TheaterDirector();                                    // 213
if (typeof window !== "undefined") {                                       // 214
  window.theaterDirector = director;                                       // 215
}                                                                           // 216
export default director;                                                    // 217
