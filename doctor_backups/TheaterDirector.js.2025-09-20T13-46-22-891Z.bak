// >>> Throttled Morph Emitter v1 <<<
let __lastMorph = -1;
let __lastMorphEmit = 0;
/** Local throttle config (ms) can be overridden by localStorage.canonMorphThrottleMs */
function __getMorphThrottleMs() {
  try {
    return Math.max(0, parseInt(localStorage.getItem('canonMorphThrottleMs') || '80', 10));
  } catch {
    return 80;
  }
}
function __emitMorphThrottled(BeatBus, EVENTS, v) {
  try {
    const EPS = 0.005; // 0.5% change
    const now = performance.now();
    const MIN = __getMorphThrottleMs(); // default 80ms
    if (typeof v !== 'number') return;
    if (Math.abs(v - __lastMorph) < EPS) return; // no change
    if (now - __lastMorphEmit < MIN) return; // too soon
    __lastMorph = v;
    __lastMorphEmit = now;
    BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', { value: v });
  } catch {}
}

// SST v3.3 BeatGlyph Theater Director — viewport-triggered with cancel guards

import BeatBus from '@/theater/bus';
import EVENTS from './events.js'; // default import is fine; named also available
import ScrollOrchestrator from './ScrollOrchestrator.js';

class TheaterDirector {
  reset() {
    try {
      this.scrollOrchestrator?.stop?.();
    } catch {}
    this.phase = 'idle';
    this.cancelled = false;
    this.isRunning = false;
    this.hasRun = false;
    this.startTime = null;
    this.viewportReady = false;
    this.waitingForViewport = false;
    this.currentStage = null;
    try {
      window.__canonFencepostSeen = false;
    } catch {}
    return this;
  }

  constructor() {
    this.phase = 'idle';
    this.cancelled = false;
    this.isRunning = false;
    this.hasRun = false;
    this.startTime = null;
    this.timeline = {};
    this.scrollOrchestrator = null;
    this.viewportReady = false;
    this.waitingForViewport = false;

    // Track canonical stage transitions for STAGE_CHANGE { from, to }
    this.currentStage = null;
  }

  async start() {
    // Prevent duplicate starts
    if (this.isRunning) {
      console.log('🎬 Director: Already running, ignoring duplicate start');
      return;
    }

    if (this.hasRun) {
      console.log('🎬 Director: Already completed, ignoring restart');
      return;
    }

    // Wait for viewport hint if not ready
    if (!this.viewportReady && !this.waitingForViewport) {
      console.log('🎬 Director: Waiting for ENGINE_VIEWPORT_HINT...');
      this.waitingForViewport = true;

      // Set up viewport listener
      const unsubscribe = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, data => {
        console.log('🎬 Director: Viewport ready', data);
        this.viewportReady = true;
        this.waitingForViewport = false;
        unsubscribe?.();

        // Now start for real
        this.start();
      });

      // Timeout fallback if viewport hint never comes
      setTimeout(() => {
        if (this.waitingForViewport) {
          console.warn('🎬 Director: Viewport hint timeout, starting anyway');
          this.viewportReady = true;
          this.waitingForViewport = false;
          unsubscribe?.();
          this.start();
        }
      }, 2000);

      return;
    }

    this.isRunning = true;
    this.cancelled = false;
    this.phase = 'starting';
    this.startTime = Date.now();

    console.log('🎬 Director: Starting SST v3.3 BeatGlyph show');
    console.log('   Timeline: 0s black → 2s cursor → 2.5s typing → 3s fill → 3.7s emergence');

    try {
      // Optional prewarm
      await this.prewarm();

      // ───────────────── Phase 1: Black (2s)
      this.phase = 'black';
      console.log('   Phase: Black screen (2s)');
      await this.sleep(2000);
      if (this.cancelled) {
        console.log('   Director cancelled during black phase');
        return;
      }

      // ───────────────── Phase 2: Cursor blinks
      this.phase = 'cursor';
      console.log('   Phase: Cursor (blinks twice)');
      BeatBus.emit(EVENTS.CURSOR_SHOW);
      BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: 0.25 });
      await this.sleep(500);
      BeatBus.emit(EVENTS.CURSOR_BLINK, { count: 2, interval: 250 });
      await this.sleep(1000);
      if (this.cancelled) {
        console.log('   Director cancelled during cursor phase');
        return;
      }

      // ───────────────── Phase 3: Terminal typing
      this.phase = 'terminal';
      console.log('   Phase: Terminal typing');
      BeatBus.emit(EVENTS.TERMINAL_TYPE, {
        lines: ['READY.', '10 PRINT "HELLO CURTIS"', '20 GOTO 10', 'RUN'],
        typeSpeed: 50,
        lineDelay: 300,
      });
      await this.sleep(3700);
      if (this.cancelled) {
        console.log('   Director cancelled during terminal phase');
        return;
      }

      // ───────────────── Phase 4: Fill
      this.phase = 'fill';
      console.log('   Phase: Screen fill');
      BeatBus.emit(EVENTS.SCREEN_FILL, { text: 'HELLO CURTIS ', scrollSpeed: 50 });
      await this.sleep(1500);
      if (this.cancelled) {
        console.log('   Director cancelled during fill phase');
        return;
      }

      // ───────────────── Phase 5: Emergence
      this.phase = 'emergence';
      console.log('   Phase: Particle emergence');

      // Build emergence blueprint
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
        sourceText: 'HELLO CURTIS',
        count: 2000,
      });

      // Start overlay fade
      BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);

      // Initial visual tune
      this.emitTune({
        particleFlash: 1.3,
        opacityMin: 0.7,
        opacityMax: 1.0,
        driftAmp: 1.0,
        vibeAmp: 0.2,
        flutterAmp: 0.6,
        verticalBias: 0.1,
      });

      // Wait for renderer fencepost (extended timeout)
      console.log('   Waiting for renderer fencepost...');
      const fencepostReceived = await this.once(EVENTS.PARTICLES_EMERGED, 5000);

      if (this.cancelled) {
        console.log('   Director cancelled during emergence phase');
        return;
      }

      if (!fencepostReceived) {
        console.warn('   Renderer fencepost timeout, continuing anyway');
      }

      // ───────────────── Phase 6: Stage-0 Genesis
      const fromStage = this.currentStage ?? 'emergence';
      const toStage = 'genesis';

      this.phase = 'genesis';
      this.currentStage = toStage;

      console.log('🧬 Phase: Genesis stage handoff');

      // Canonical stage-change payload { from, to }
      BeatBus.emit(EVENTS.STAGE_CHANGE, { from: fromStage, to: toStage });
      BeatBus.emit(EVENTS.AUDIO_START_STAGE, { stage: toStage });

      // Reset scroll position
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        /* noop */
      }

      // Initial morph to constellation
      __emitMorphThrottled(BeatBus, EVENTS, 0);
      await this._easeMorphTo(1, 1400);

      // ───────────────── Visual schedule (4.5s - 7.5s)

      // T+4.5s: Swirl start
      this.emitTune({
        rotZSpeedDegPerSec: 15,
        trails: 0.12,
        brightToward: 1.1,
        dimAway: 0.95,
      });
      BeatBus.emit(EVENTS.PARTICLE_PHASE, { name: 'swirl_start' });
      await this.sleep(1000);

      // T+5.5s: Swirl full
      this.emitTune({
        rotZSpeedDegPerSec: 12,
        trails: 0.15,
        brightToward: 1.15,
        dimAway: 0.9,
      });
      BeatBus.emit(EVENTS.PARTICLE_PHASE, { name: 'swirl_full' });
      await this.sleep(500);

      // T+6.0s: Deceleration
      this.emitTune({
        rotZSpeedDegPerSec: 8,
        driftAmp: 0.8,
        flutterAmp: 0.4,
      });
      BeatBus.emit(EVENTS.PARTICLE_PHASE, { name: 'swirl_decel' });
      await this.sleep(500);

      // T+6.5s: Tier emergence
      this.emitTune({
        tierReveal: 1,
        rotZSpeedDegPerSec: 3,
      });
      __emitMorphThrottled(BeatBus, EVENTS, 1.0);
      BeatBus.emit(EVENTS.PARTICLE_PHASE, { name: 'tier_emergence' });
      await this.sleep(500);

      // T+7.0s: Constellation stable
      this.emitTune({
        rotZSpeedDegPerSec: 1,
        driftAmp: 0.3,
        flutterAmp: 0.15,
      });
      BeatBus.emit(EVENTS.PARTICLE_PHASE, { name: 'constellation' });
      await this.sleep(500);

      // T+7.5s: Narrative start with breathing and pulse
      BeatBus.emit(EVENTS.START_NARRATIVE, { stage: toStage });
      this.emitTune({
        breathingAmp: 0.02,
        breathingPeriodSec: 4,
        flareProb: 0.02,
        flareGain: 1.3,
        tierSpeedScale: [1.0, 0.8, 0.6, 0.4],
        pulseOnce: 1,
      });

      // Enable scroll
      BeatBus.emit(EVENTS.ENABLE_SCROLL);

      // Start scroll orchestrator
      if (!this.scrollOrchestrator) {
        this.scrollOrchestrator = new ScrollOrchestrator();
      }
      this.scrollOrchestrator.start();
      this.monitorFragments();

      // Complete
      this.phase = 'complete';
      const elapsed = Date.now() - this.startTime;
      console.log('🎬 Director: Opening complete → user-driven experience');
      console.log(`   Total opening time: ${elapsed}ms`);
      console.log(`   Expected: ~8000ms, Actual: ${elapsed}ms`);

      this.hasRun = true;
      this.isRunning = false;
    } catch (error) {
      console.error('🎬 Director error:', error);
      this.isRunning = false;
      this.phase = 'error';
      BeatBus.emit(EVENTS.DIRECTOR_CANCEL);
    }
  }

  emitTune(payload) {
    console.log('   RENDERER_TUNE:', payload);
    BeatBus.emit(EVENTS.RENDERER_TUNE, payload || {});
  }

  async prewarm() {
    try {
      console.log('   Prewarming genesis blueprint...');
      BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
      await this.once(EVENTS.PREWARM_COMPLETE, 500);
      console.log('   Prewarm complete');
    } catch {
      // Non-fatal if prewarm times out
      console.log('   Prewarm timeout (non-fatal)');
    }
  }

  monitorFragments() {
    // Fragment monitoring placeholder
    console.log('   Fragment monitoring enabled');
  }

  cancel() {
    // Guard against cancellation during critical phases
    if (!this.isRunning) {
      console.log('🎬 Director: Not running, cancel ignored');
      return;
    }

    // In development, warn about early cancellation
    if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
      console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
      console.warn('   This may be caused by HMR or effect cleanup');
      console.trace('Cancel call stack');
    }

    console.log('🎬 Director: Cancelling show at phase:', this.phase);
    this.cancelled = true;
    this.isRunning = false;
    this.phase = 'cancelled';
    this.scrollOrchestrator?.stop();
    BeatBus.emit(EVENTS.DIRECTOR_CANCEL);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _easeMorphTo(target = 1, duration = 1400) {
    return new Promise(resolve => {
      const start = performance.now();
      const ease = t => t * t * (3 - 2 * t);

      const step = now => {
        if (this.cancelled) return resolve();

        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const easedValue = ease(progress) * target;

        __emitMorphThrottled(BeatBus, EVENTS, easedValue);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  once(event, timeout = 5000) {
    return new Promise(resolve => {
      let timeoutId;

      const handler = data => {
        clearTimeout(timeoutId);
        unsubscribe?.();
        console.log(`   Received: ${event}`);
        resolve(data);
      };

      const unsubscribe = BeatBus.on(event, handler);

      timeoutId = setTimeout(() => {
        console.warn(`⚠️ Director: ${event} timed out after ${timeout}ms`);
        unsubscribe?.();
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
      viewportReady: this.viewportReady,
      timeline: this.timeline,
      currentStage: this.currentStage,
    };
  }

  // Manual start method for debugging
  forceStart() {
    console.log('🎬 Director: Force starting (bypassing viewport wait)');
    this.viewportReady = true;
    this.waitingForViewport = false;
    return this.start();
  }
}

// Create singleton instance
const director = new TheaterDirector();

// Expose to window for debugging / dev ergonomics
if (typeof window !== 'undefined') {
  window.theaterDirector = director;

  if (import.meta?.env?.DEV) {
    // Install cancel wrapper to track who's calling cancel
    const originalCancel = director.cancel.bind(director);
    director.cancel = function (...args) {
      console.warn('🎬 Director: cancel() called - tracking caller');
      console.trace('Cancel caller stack trace');
      return originalCancel(...args);
    };

    // Status shortcut
    window.theaterStatus = () => director.getStatus();

    // BeatBus helpers (avoid ESM import friction in DevTools)
    window.emit = (e, p) => BeatBus.emit(e, p);
    window.on = (e, h) => BeatBus.on(e, h);

    // Viewport helper
    window.emitViewportHint = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, { width: w, height: h, aspect: w / h });
    };

    console.log('🎬 Director: Development helpers installed');
    console.log('   Commands available:');
    console.log('   - window.theaterDirector.start()       // Start with viewport wait');
    console.log('   - window.theaterDirector.forceStart()  // Start immediately');
    console.log('   - window.theaterStatus()               // Get current status');
    console.log("   - emit('ENGINE_VIEWPORT_HINT', {...})  // Emit any event");
    console.log('   - emitViewportHint()                   // Emit current viewport hint');
  }

  // Listen for viewport hint to auto-start (once)
  let viewportListenerInstalled = false;
  const installViewportListener = () => {
    if (viewportListenerInstalled) return;
    viewportListenerInstalled = true;

    console.log('🎬 Director: Installing viewport listener for auto-start');

    const unsubscribe = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, data => {
      if (!director.hasRun && !director.isRunning) {
        console.log('🎬 Director: Viewport hint received, auto-starting', data);
        director.viewportReady = true;
        director.start();
      }
      unsubscribe?.();
    });

    // Fallback: start after 3 seconds if no viewport hint
    setTimeout(() => {
      if (!director.hasRun && !director.isRunning && !director.viewportReady) {
        console.warn('🎬 Director: No viewport hint after 3s, starting anyway');
        director.forceStart();
      }
    }, 3000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installViewportListener);
  } else {
    installViewportListener();
  }
}

export default director;

// __CANON_INSTALLED__
// Canon event contracts (versioned)
export const CANON_CONTRACTS = {
  version: '1.0.1',
  events: {
    STAGE_CHANGE: {
      required: ['from', 'to'],
      notes:
        'Canonical shape. Old `{stage}` payload is deprecated and should be mapped to { from, to }.',
    },
    QUALITY_CHANGE: {
      required: ['tier'],
      notes: 'Canonical shape. Old `{quality}` payload is deprecated.',
    },
    BLUEPRINT_READY: {
      required: ['stage', 'quality', 'blueprint'],
      optional: ['cached'],
      notes: 'Renderer consumes stage/quality/blueprint; `cached` is informative.',
    },
  },
  deprecations: {
    STAGE_CHANGE: { stage: 'deprecated' },
    QUALITY_CHANGE: { quality: 'deprecated' },
  },
};
