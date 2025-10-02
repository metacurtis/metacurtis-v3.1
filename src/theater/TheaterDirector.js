// SST v3.3 BeatGlyph Theater Director — Complete Clean Version
// Single source of timeline; Renderer stays single GPU writer; Engine writes blueprints.

import BeatBus from '@/theater/bus';

import { VC } from '@/config/visual-controls.js';
import { EVENTS } from '@/theater/events.js';
import ScrollOrchestrator from './ScrollOrchestrator.js';

// ── Throttled Morph Emitter (single-writer safe) ─────────────────────────────
let __lastMorph = -1;
let __lastMorphEmit = 0;

function __getMorphThrottleMs() {
  try {
    return Math.max(0, parseInt(localStorage.getItem('canonMorphThrottleMs') || '80', 10));
  } catch {
    return 80;
  }
}

function __emitMorphThrottled(BeatBus, EVENTS, v) {
  try {
    const EPS = 0.005; // 0.5% change threshold
    const now = performance.now();
    const MIN = __getMorphThrottleMs();
    
    if (typeof v !== 'number') return;
    if (Math.abs(v - __lastMorph) < EPS) return;
    if (now - __lastMorphEmit < MIN) return;
    
    __lastMorph = v;
    __lastMorphEmit = now;
    BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', { value: v });
  } catch {}
}

// ── Theater Director Class ───────────────────────────────────────────────────
class TheaterDirector {
  constructor() {
    this.reset();
    this.timeline = {};
    this.scrollOrchestrator = null;
  }

  async _ensureViewportHint(timeoutMs = 5000) {
    if (typeof window === 'undefined') return undefined;
    const sanitize = (hint) => {
      if (!hint) return hint;
      const w = Number(hint.width);
      const h = Number(hint.height);
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return hint;
      if (w >= h) {
        return { ...hint, width: w, height: h, aspect: w / h, orientation: 'landscape' };
      }
      return { ...hint, width: h, height: w, aspect: h / w, orientation: 'landscape' };
    };

    if (window.__viewportHint) return sanitize(window.__viewportHint);

    const pollInterval = 100;
    const attempts = Math.max(1, Math.floor(timeoutMs / pollInterval));
    for (let i = 0; i < attempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      if (window.__viewportHint) return sanitize(window.__viewportHint);
    }

    console.warn('🎬 Director: Viewport hint unavailable after wait, applying fallback');
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const aspect = canvas.height ? canvas.width / canvas.height : 16 / 9;
      const fallback = sanitize({ width: 120, height: 120 / aspect, aspect });
      window.__viewportHint = fallback;
      return fallback;
    }

    return undefined;
  }

  reset() {
    // Clean up
    try {
      this.scrollOrchestrator?.stop?.();
    } catch {}
    
    // Reset state
    this.phase = 'idle';
    this.cancelled = false;
    this.isRunning = false;
    this.hasRun = false;
    this.startTime = null;
    this.viewportReady = false;
    this.waitingForViewport = false;
    this.currentStage = null;
    
    // Reset global flags
    try {
      window.__canonFencepostSeen = false;
    } catch {}
    
    return this;
  }

  async start() {
    // Strong duplicate protection
    if (this.isRunning) {
      console.log('🎬 Director: Already running, ignoring duplicate start');
      return;
    }
    
    if (this.hasRun) {
      console.log('🎬 Director: Already completed, ignoring restart');
      return;
    }

    // Wait for viewport (non-recursive)
    if (!this.viewportReady && !this.waitingForViewport) {
      console.log('🎬 Director: Waiting for ENGINE_VIEWPORT_HINT...');
      this.waitingForViewport = true;

      const unsubscribe = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, (data) => {
        console.log('🎬 Director: Viewport ready', data);
        this.viewportReady = true;
        this.waitingForViewport = false;
        unsubscribe?.();
        // Deferred start to avoid recursion
        setTimeout(() => {
          if (!this.isRunning && !this.hasRun) this.start();
        }, 0);
      });

      // Fallback if viewport hint never arrives
      setTimeout(() => {
        if (this.waitingForViewport) {
          console.warn('🎬 Director: Viewport hint timeout, starting anyway');
          this.viewportReady = true;
          this.waitingForViewport = false;
          unsubscribe?.();
          setTimeout(() => {
            if (!this.isRunning && !this.hasRun) this.start();
          }, 0);
        }
      }, 2000);
      
      return;
    }

    // Begin execution
    this.isRunning = true;
    this.cancelled = false;
    this.phase = 'starting';
    this.startTime = Date.now();

    console.log('🎬 Director: Starting SST v3.3 BeatGlyph show');
    console.log('   Timeline: 0s black → 2s cursor → 2.5s typing → 3s fill → 3.7s emergence');

    try {
      await this._runSequence();
    } catch (error) {
      console.error('🎬 Director error:', error);
      this.phase = 'error';
      BeatBus.emit(EVENTS.DIRECTOR_ERROR, { error });
    } finally {
      this.isRunning = false;
      if (this.phase !== 'cancelled' && this.phase !== 'error') {
        this.hasRun = true;
      }
    }
  }

  async _runSequence() {
    // Optional prewarm (disabled during debugging to avoid stale cache)
    // await this.prewarm();

    // ───────────────── Phase 1: Black (2s)
    this.phase = 'black';
    console.log('   Phase: Black screen (2s)');
    await this.sleep(2000);
    if (this.cancelled) return;

    // ───────────────── Phase 2: Cursor (0.5s + 1s)
    this.phase = 'cursor';
    console.log('   Phase: Cursor (blinks twice)');
    BeatBus.emit(EVENTS.CURSOR_SHOW);
    BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: 0.25 });
    await this.sleep(500);
    BeatBus.emit(EVENTS.CURSOR_BLINK, { count: 2, interval: 250 });
    await this.sleep(1000);
    if (this.cancelled) return;

    // ───────────────── Phase 3: Terminal typing (3.7s)
    this.phase = 'terminal';
    console.log('   Phase: Terminal typing');
    BeatBus.emit(EVENTS.TERMINAL_TYPE, {
      lines: ['READY.', '10 PRINT "HELLO CURTIS"', '20 GOTO 10', 'RUN'],
      typeSpeed: 50,
      lineDelay: 300,
    });
    await this.sleep(3700);
    if (this.cancelled) return;

    // ───────────────── Phase 4: Fill (1.5s)
    this.phase = 'fill';
    console.log('   Phase: Screen fill');
    BeatBus.emit(EVENTS.SCREEN_FILL, { text: 'HELLO CURTIS ', scrollSpeed: 50 });
    await this.sleep(1500);
    if (this.cancelled) return;

    // ───────────────── Phase 5: Emergence (viewport → constellation)
    this.phase = 'emergence';
    console.log('   Phase: Particle emergence');

    // Build emergence with CORRECTED contract
    const viewportHint = await this._ensureViewportHint();

    BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      mode: 'emergence',
      source: 'viewportSpread',
      target: 'constellation',
      count: 2000,
      tierRatios: VC?.TIER_RATIOS,
      viewportHint,
    });

    // Signal overlay to fade
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

    // Drive morph 0 → 0.75 during emergence
    await this._easeMorphTo(VC.MID_MORPH /* 0.85 */, VC.IMPLODE_MS /* 1000 */);

    // Wait for renderer confirmation
    console.log('   Waiting for renderer fencepost...');
    const fencepostReceived = await this.once(EVENTS.PARTICLES_EMERGED, 5000);
    if (!fencepostReceived) {
      console.warn('   Renderer fencepost timeout, continuing anyway');
    }
    if (this.cancelled) return;

    // ───────────────── Phase 6: Genesis handoff
    const toStage = 'genesis';
    
    this.phase = 'genesis';
    const previousStage = this.currentStage ?? 'emergence';
    this.currentStage = toStage;
    console.log('🧬 Phase: Genesis stage handoff');

    // canonical STAGE_CHANGE shape { from, to }
    BeatBus.emit(EVENTS.STAGE_CHANGE, { from: previousStage, to: toStage });
    BeatBus.emit(EVENTS.AUDIO_START_STAGE, { stage: toStage });

    // Reset scroll position
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {}

    // Continue morph from 0.75 → 1.0 (NO RESET!)
    await this._easeMorphTo(1, VC.SETTLE_MS /* 900 */);

    // ───────────────── Visual choreography
    await this._runVisualSchedule();

    // ───────────────── Enable scroll and narrative
    BeatBus.emit(EVENTS.START_NARRATIVE, { stage: toStage });
    this.emitTune({
      breathingAmp: 0.02,
      breathingPeriodSec: 4,
      flareProb: 0.02,
      flareGain: 1.3,
      tierSpeedScale: [1.0, 0.8, 0.6, 0.4],
      pulseOnce: 1,
    });

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
  }

  async _runVisualSchedule() {
    // Visual schedule disabled for VC/band opening (renderer is passive)
    return;
  }

  cancel() {
    if (!this.isRunning) {
      console.log('🎬 Director: Not running, cancel ignored');
      return;
    }

    // Warn about early cancellation in development
    if (import.meta?.env?.DEV) {
      if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
        console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
        console.warn('   This may be caused by HMR or effect cleanup');
        console.trace('Cancel call stack');
      }
    }

    console.log('🎬 Director: Cancelling show at phase:', this.phase);
    this.cancelled = true;
    this.isRunning = false;
    this.phase = 'cancelled';
    this.scrollOrchestrator?.stop();
    BeatBus.emit(EVENTS.DIRECTOR_CANCEL);
  }

  async prewarm() {
    try {
      console.log('   Prewarming genesis blueprint...');
      BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
      await this.once(EVENTS.PREWARM_COMPLETE, 1500);
      console.log('   Prewarm complete');
    } catch {
      console.log('   Prewarm timeout (non-fatal)');
    }
  }

  monitorFragments() {
    console.log('   Fragment monitoring enabled');
    // Fragment monitoring implementation would go here
  }

  emitTune(payload) {
    console.log('   RENDERER_TUNE:', payload);
    BeatBus.emit(EVENTS.RENDERER_TUNE, payload || {});
  }

  // Utility methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _easeMorphTo(target = 1, duration = 1400) {
    return new Promise(resolve => {
      const start = performance.now();
      const ease = t => t * t * (3 - 2 * t); // Smooth cubic ease

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
      currentStage: this.currentStage,
    };
  }

  forceStart() {
    console.log('🎬 Director: Force starting (bypassing viewport wait)');
    this.viewportReady = true;
    this.waitingForViewport = false;
    return this.start();
  }
}

// ── Singleton Instance & Dev Tools ───────────────────────────────────────────
const director = new TheaterDirector();

if (typeof window !== 'undefined') {
  window.theaterDirector = director;

  if (import.meta?.env?.DEV) {
    // Wrap cancel to track callers in development
    const originalCancel = director.cancel.bind(director);
    director.cancel = function (...args) {
      console.warn('🎬 Director: cancel() called - tracking caller');
      console.trace('Cancel caller stack trace');
      return originalCancel(...args);
    };

    // Development shortcuts
    window.theaterStatus = () => director.getStatus();
    window.emit = (e, p) => BeatBus.emit(e, p);
    window.on = (e, h) => BeatBus.on(e, h);
    window.emitViewportHint = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, { width: w, height: h, aspect: w / h });
    };

    console.log('🎬 Director: Development helpers installed');
    console.log('   Commands available:');
    console.log('   - window.theaterDirector.start()       // Start with viewport wait');
    console.log('   - window.theaterDirector.forceStart()  // Start immediately');
    console.log('   - window.theaterStatus()               // Get current status');
    console.log('   - emit("ENGINE_VIEWPORT_HINT", {...})  // Emit any event');
    console.log('   - emitViewportHint()                   // Emit current viewport hint');
  }

  // Auto-start listener (once)
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

// ── Event Contracts ──────────────────────────────────────────────────────────
export const CANON_CONTRACTS = {
  version: '1.0.1',
  events: {
    STAGE_CHANGE: {
      required: ['from', 'to'],
      notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
    },
    QUALITY_CHANGE: {
      required: ['tier'],
      notes: 'Canonical shape. Old `{quality}` payload is deprecated.',
    },
    BLUEPRINT_READY: {
      required: ['stage', 'quality', 'blueprint'],
      optional: ['cached', 'mode'],
      notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
    },
    BUILD_EMERGENCE_BLUEPRINT: {
      required: ['mode', 'source', 'target', 'count'],
      optional: ['tierRatios', 'viewportHint'],
      notes: 'Corrected contract for viewport spread → constellation emergence.',
    },
  },
  deprecations: {
    STAGE_CHANGE: { stage: 'deprecated' },
    QUALITY_CHANGE: { quality: 'deprecated' },
  },
};
