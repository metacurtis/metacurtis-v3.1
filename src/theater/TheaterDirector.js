// SST v3.5 BeatGlyph Theater Director — Complete Clean Version
// Single source of timeline; Renderer stays single GPU writer; Engine writes blueprints.

import BeatBus from '@/theater/bus';

import SST from '@/config/sst-loader.js';
import { VC } from '@/config/visual-controls.js';
import { EVENTS } from '@/theater/events.js';
import ScrollOrchestrator from './ScrollOrchestrator.js';

const DEFAULT_TYPING_LINES = ['READY.', '10 PRINT "HELLO CURTIS"', '20 GOTO 10', 'RUN'];

const DEFAULT_OPENING_TIMELINE = {
  blackout: { durationMs: 2000 },
  cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
  typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500 },
  fill: { text: 'HELLO CURTIS ', scrollSpeed: 50, durationMs: 2000 },
  emergence: { durationMs: 2000, waitForFencepost: true, maxWaitMs: 5000 },
};

const DEFAULT_OPENING_EMERGENCE = {
  target: 'constellation',
  mode: 'emergence',
  source: 'viewportSpread',
};

const LIFECYCLE_PHASE_EVENT = EVENTS.LIFECYCLE_PHASE || 'LIFECYCLE_PHASE';

const SKIP_KEY_MAP = {
  SPACE: { codes: ['Space'], keys: [' ', 'Spacebar'] },
  ENTER: { codes: ['Enter', 'NumpadEnter'], keys: ['Enter'] },
  ESCAPE: { codes: ['Escape'], keys: ['Escape', 'Esc'] },
};

function matchesSkipActivation(event, skipKey) {
  if (!skipKey || !event) return false;
  const lookup = SKIP_KEY_MAP[String(skipKey).toUpperCase()] ?? null;
  if (!lookup) return false;
  if (lookup.codes?.includes(event.code)) return true;
  if (lookup.keys?.includes(event.key)) return true;
  return false;
}

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

function __emitMorphThrottled(BeatBus, EVENTS, v, { force = false } = {}) {
  try {
    const EPS = 0.005; // 0.5% change threshold
    const now = performance.now();
    const MIN = __getMorphThrottleMs();
    
    if (typeof v !== 'number') return;
    if (!force && Math.abs(v - __lastMorph) < EPS) return;
    if (!force && now - __lastMorphEmit < MIN) return;

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

  _getOpeningConfig() {
    const opening = SST?.narrative?.opening ?? {};
    const openingTimeline = opening.timeline ?? {};

    const timeline = {
      blackout: { ...DEFAULT_OPENING_TIMELINE.blackout, ...(openingTimeline.blackout ?? {}) },
      cursor: { ...DEFAULT_OPENING_TIMELINE.cursor, ...(openingTimeline.cursor ?? {}) },
      typing: { ...DEFAULT_OPENING_TIMELINE.typing, ...(openingTimeline.typing ?? {}) },
      fill: { ...DEFAULT_OPENING_TIMELINE.fill, ...(openingTimeline.fill ?? {}) },
      emergence: { ...DEFAULT_OPENING_TIMELINE.emergence, ...(openingTimeline.emergence ?? {}) },
    };

    const fallbackSkipKey = 'SPACE';

    return {
      skipKey:
        opening.skipKey ??
        SST?.narrative?.orchestration?.skipKey ??
        fallbackSkipKey,
      totalDurationMs: opening.totalDurationMs,
      timeline,
      emergence: { ...DEFAULT_OPENING_EMERGENCE, ...(opening.emergence ?? {}) },
    };
  }

  _getGenesisParticleCount() {
    const candidate = Number(SST?.performance?.particleCount?.genesis);
    if (Number.isFinite(candidate) && candidate > 0) return candidate;
    return 2000;
  }

  _calculateTypingDuration(typingConfig) {
    if (!typingConfig) return 0;
    const lines = Array.isArray(typingConfig.lines) ? typingConfig.lines : [];
    const typeSpeed = Number(typingConfig.typeSpeed) || 0;
    const lineDelay = Number(typingConfig.lineDelay) || 0;

    if (!lines.length || !typeSpeed) return 0;

    let total = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = typeof lines[i] === 'string' ? lines[i] : '';
      total += line.length * typeSpeed;
      if (i < lines.length - 1) total += lineDelay;
    }
    return total;
  }

  _attachSkipListener(skipKey) {
    if (typeof window === 'undefined') return;
    this._detachSkipListener();
    if (!skipKey) return;

    this._skipKey = skipKey;
    const handler = (event) => {
      if (this.skipRequested || this.cancelled) return;
      if (!matchesSkipActivation(event, skipKey)) return;
      try {
        event.preventDefault?.();
      } catch {}
      this._requestSkip('keyboard');
    };

    window.addEventListener('keydown', handler, { passive: false });
    this._skipListener = handler;
  }

  _detachSkipListener() {
    if (typeof window === 'undefined') return;
    if (this._skipListener) {
      window.removeEventListener('keydown', this._skipListener);
      this._skipListener = null;
    }
    this._skipKey = null;
  }

  _wakeSleepWaiters(reason = 'interrupted') {
    if (!this._sleepWaiters || this._sleepWaiters.size === 0) return;
    for (const resolve of Array.from(this._sleepWaiters)) {
      try {
        resolve(reason);
      } catch {}
    }
    this._sleepWaiters.clear();
  }

  _trackTimer(callback, delay = 0) {
    if (typeof callback !== 'function') return null;
    const safeDelay = Number.isFinite(delay) && delay > 0 ? delay : 0;
    const id = setTimeout(() => {
      this._activeTimers?.delete(id);
      try {
        callback();
      } catch (err) {
        if (import.meta?.env?.DEV) {
          console.warn('[Director] timer callback failed', err);
        }
      }
    }, safeDelay);
    if (!this._activeTimers) this._activeTimers = new Set();
    this._activeTimers.add(id);
    return id;
  }

  _clearTimer(id) {
    if (id == null) return;
    clearTimeout(id);
    this._activeTimers?.delete(id);
  }

  _requestSkip(origin = 'keyboard') {
    if (this.skipRequested) return;
    this.skipRequested = true;
    this._skipOrigin = origin;
    console.log(`🎬 Director: Opening skip requested via ${origin}`);
    this._wakeSleepWaiters('skipped');
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
    try {
      if (this.isRunning) this.cancel();
    } catch (err) {
      if (import.meta?.env?.DEV) {
        console.warn('[Director] reset cancel failed', err);
      }
    }

    this._wakeSleepWaiters('reset');
    this._detachSkipListener();

    if (this._activeTimers?.size) {
      for (const id of this._activeTimers) {
        clearTimeout(id);
      }
    }
    this._activeTimers = new Set();

    try {
      this.scrollOrchestrator?.stop?.();
    } catch {}

    this.phase = 'idle';
    this.cancelled = false;
    this.completed = false;
    this.isRunning = false;
    this.hasRun = false;
    this.startTime = null;
    this.viewportReady = false;
    this.waitingForViewport = false;
    this.currentStage = null;
    this.skipRequested = false;
    this._skipOrigin = null;
    this._sleepWaiters = new Set();
    this._fencepostReadyEmitted = false;

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
        this._trackTimer(() => {
          if (!this.isRunning && !this.hasRun) this.start();
        }, 0);
      });

      // Fallback if viewport hint never arrives
      this._trackTimer(() => {
        if (this.waitingForViewport) {
          console.warn('🎬 Director: Viewport hint timeout, starting anyway');
          this.viewportReady = true;
          this.waitingForViewport = false;
          unsubscribe?.();
          this._trackTimer(() => {
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
    this._fencepostReadyEmitted = false;

    const openingSnapshot = this._getOpeningConfig();
    const snapshotTimeline = openingSnapshot?.timeline ?? {};
    const snapshotTyping = {
      ...DEFAULT_OPENING_TIMELINE.typing,
      ...(snapshotTimeline.typing ?? {}),
    };
    snapshotTyping.lines =
      Array.isArray(snapshotTyping.lines) && snapshotTyping.lines.length
        ? snapshotTyping.lines
        : DEFAULT_OPENING_TIMELINE.typing.lines;
    const snapshotTypingDuration = this._calculateTypingDuration(snapshotTyping);

    const segments = [
      `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
      `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
        ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
      `typing ~${snapshotTypingDuration}ms`,
      `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
      `emergence ${snapshotTimeline?.emergence?.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs}ms`,
    ];

    console.log('🎬 Director: Starting SST v3.5 opening sequence');
    console.log(`   Skip key: ${openingSnapshot?.skipKey ?? 'SPACE'}`);
    console.log(`   SST timeline: ${segments.join(' → ')}`);

    try {
      await this._runSequence();
    } catch (error) {
      console.error('🎬 Director error:', error);
      this.phase = 'error';
      BeatBus.emit(EVENTS.DIRECTOR_ERROR, { error });
    } finally {
      this._detachSkipListener();
      this.isRunning = false;
      if (this.phase !== 'cancelled' && this.phase !== 'error') {
        this.hasRun = true;
        this.completed = true;
      }
    }
  }

  async _runSequence() {
    // Optional prewarm (disabled during debugging to avoid stale cache)
    // await this.prewarm();

    const opening = this._getOpeningConfig();
    const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};

    const blackoutDuration = Math.max(
      0,
      Number(timeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs),
    );

    const cursorConfig = {
      ...DEFAULT_OPENING_TIMELINE.cursor,
      ...(timeline?.cursor ?? {}),
    };
    const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
    const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
    const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
    const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
    const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;

    const typingConfig = {
      ...DEFAULT_OPENING_TIMELINE.typing,
      ...(timeline?.typing ?? {}),
    };
    typingConfig.lines =
      Array.isArray(typingConfig.lines) && typingConfig.lines.length
        ? typingConfig.lines
        : DEFAULT_OPENING_TIMELINE.typing.lines;
    typingConfig.typeSpeed = Math.max(0, Number(typingConfig.typeSpeed ?? DEFAULT_OPENING_TIMELINE.typing.typeSpeed));
    typingConfig.lineDelay = Math.max(0, Number(typingConfig.lineDelay ?? DEFAULT_OPENING_TIMELINE.typing.lineDelay));
    const typingDuration = this._calculateTypingDuration(typingConfig);

    const fillConfig = {
      ...DEFAULT_OPENING_TIMELINE.fill,
      ...(timeline?.fill ?? {}),
    };
    fillConfig.durationMs = Math.max(0, Number(fillConfig.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs));
    fillConfig.scrollSpeed = Math.max(0, Number(fillConfig.scrollSpeed ?? DEFAULT_OPENING_TIMELINE.fill.scrollSpeed));
    if (typeof fillConfig.text !== 'string' || !fillConfig.text.trim()) {
      fillConfig.text = DEFAULT_OPENING_TIMELINE.fill.text;
    }

    const emergenceTimeline = {
      ...DEFAULT_OPENING_TIMELINE.emergence,
      ...(timeline?.emergence ?? {}),
    };
    emergenceTimeline.durationMs = Math.max(
      0,
      Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
    );
    emergenceTimeline.maxWaitMs = Math.max(
      0,
      Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
    );
    const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
    const waitForFencepost = emergenceTimeline.waitForFencepost !== false;

    const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
    const genesisCount = this._getGenesisParticleCount();
    const skipLabel = skipKey ?? 'SPACE';

    this._attachSkipListener(skipKey);

    let skipTriggered = false;

    const handleWaitResult = (result) => {
      if (result === 'cancelled' || this.cancelled) return 'cancelled';
      if (result === 'skipped' || this.skipRequested) skipTriggered = true;
      return null;
    };

    try {
      // ───────────────── Phase 1: Black
      this.phase = 'black';
      console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
      if (blackoutDuration > 0) {
        const waitResult = await this.sleep(blackoutDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }
      if (skipTriggered) {
        console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
      }

      // ───────────────── Phase 2: Cursor
      if (!skipTriggered) {
        this.phase = 'cursor';
        console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
        BeatBus.emit(EVENTS.CURSOR_SHOW);
        BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
        if (cursorLeadInMs > 0) {
          const waitResult = await this.sleep(cursorLeadInMs);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
        if (!skipTriggered) {
          BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
          if (cursorSettleMs > 0) {
            const waitResult = await this.sleep(cursorSettleMs);
            if (handleWaitResult(waitResult) === 'cancelled') return;
          }
        }
      }

      // ───────────────── Phase 3: Terminal typing
      if (!skipTriggered) {
        this.phase = 'terminal';
        console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
        BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
        if (typingDuration > 0) {
          const waitResult = await this.sleep(typingDuration);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
      }

      // ───────────────── Phase 4: Fill
      if (!skipTriggered) {
        this.phase = 'fill';
        console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
        BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
        if (fillConfig.durationMs > 0) {
          const waitResult = await this.sleep(fillConfig.durationMs);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
      }

      if (skipTriggered) {
        console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
      }

      // ───────────────── Phase 5: Emergence (viewport → constellation)
      this.phase = 'opening';
      BeatBus.emit(LIFECYCLE_PHASE_EVENT, { phase: 'opening', source: 'director' });
      console.log('   Phase: Particle emergence (SST governed)');

      const viewportHint = await this._ensureViewportHint();

      await Promise.resolve();
      if (this.cancelled) return;

      this.phase = 'emergence';
      BeatBus.emit(LIFECYCLE_PHASE_EVENT, { phase: 'emergence', source: 'director' });

      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
        mode: emergenceConfig.mode,
        source: emergenceConfig.source,
        target: emergenceConfig.target,
        count: genesisCount,
        tierRatios: VC?.TIER_RATIOS,
        viewportHint,
        fastForward: skipTriggered,
      });

      BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);

      this.emitTune({
        particleFlash: 1.3,
        opacityMin: 0.7,
        opacityMax: 1.0,
        driftAmp: 1.0,
        vibeAmp: 0.2,
        flutterAmp: 0.6,
        verticalBias: 0.1,
      });

      const morphDuration = emergenceTimeline.durationMs || VC.IMPLODE_MS;
      await this._easeMorphTo(VC.MID_MORPH /* 0.85 */, morphDuration);

      if (waitForFencepost) {
        console.log(`   Waiting for renderer fencepost (<=${fencepostWaitMs}ms)`);
        if (!this._fencepostReadyEmitted) {
          const readyPayload = {
            at: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            phase: 'opening',
          };
          BeatBus.emit(EVENTS.FENCEPOST_LISTENERS_READY, readyPayload);
          this._fencepostReadyEmitted = true;
        }
        const fencepostReceived = await this.once(EVENTS.PARTICLES_EMERGED, fencepostWaitMs);
        if (!fencepostReceived) {
          console.warn('   Renderer fencepost timeout, continuing anyway');
        }
        if (this.cancelled) return;
      }

      // ───────────────── Phase 6: Genesis handoff
      const toStage = 'genesis';
      
      this.phase = 'genesis';
      const previousStage = this.currentStage ?? 'emergence';
      this.currentStage = toStage;
      console.log('🧬 Phase: Genesis stage handoff');

      BeatBus.emit(EVENTS.STAGE_CHANGE, { from: previousStage, to: toStage });
      BeatBus.emit(EVENTS.AUDIO_START_STAGE, { stage: toStage });

      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {}

      await this._easeMorphTo(1, VC.SETTLE_MS /* 900 */);

      await this._runVisualSchedule();

      BeatBus.emit(EVENTS.START_NARRATIVE, { stage: toStage });
      this.emitTune({
        breathingAmp: 0.02,
        breathingPeriodSec: 4,
        flareProb: 0.02,
        flareGain: 1.3,
        tierSpeedScale: [1.0, 0.8, 0.6, 0.4],
        pulseOnce: 1,
      });

      this.phase = 'runtime';
      BeatBus.emit(LIFECYCLE_PHASE_EVENT, { phase: 'runtime', source: 'director' });
      BeatBus.emit(EVENTS.ENABLE_SCROLL);
      
      if (!this.scrollOrchestrator) {
        this.scrollOrchestrator = new ScrollOrchestrator();
      }
      this.scrollOrchestrator.start();
      this.monitorFragments();

      this.phase = 'complete';
      BeatBus.emit(LIFECYCLE_PHASE_EVENT, { phase: 'complete', source: 'director' });
      const elapsed = Date.now() - this.startTime;
      console.log('🎬 Director: Opening complete → user-driven experience');
      if (typeof opening?.totalDurationMs === 'number') {
        console.log(`   Expected (SST): ~${opening.totalDurationMs}ms, Actual: ${elapsed}ms`);
      } else {
        console.log(`   Total opening time: ${elapsed}ms`);
      }
      if (skipTriggered) {
        console.log('   Opening was user-skipped; actual duration shortened.');
      }
    } finally {
      this._detachSkipListener();
    }
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
    this._wakeSleepWaiters('cancelled');
    this._detachSkipListener();
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
    if (!Number.isFinite(ms) || ms <= 0) return Promise.resolve('elapsed');
    if (this.cancelled) return Promise.resolve('cancelled');
    if (this.skipRequested) return Promise.resolve('skipped');

    if (!this._sleepWaiters) this._sleepWaiters = new Set();

    return new Promise((resolve) => {
      let settled = false;
      let timeoutId;

      const complete = (reason = 'elapsed') => {
        if (settled) return;
        settled = true;
        this._clearTimer(timeoutId);
        this._sleepWaiters.delete(complete);
        resolve(reason);
      };

      timeoutId = this._trackTimer(() => complete('elapsed'), ms);
      this._sleepWaiters.add(complete);
    });
  }

  _easeMorphTo(target = 1, duration = 1400) {
    const clampedTarget = Math.max(0, Math.min(1, Number(target) || 0));

    if (this.cancelled) {
      return Promise.resolve();
    }

    if (this.skipRequested || !Number.isFinite(duration) || duration <= 0) {
      __emitMorphThrottled(BeatBus, EVENTS, clampedTarget, { force: true });
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const start = performance.now();
      const ease = t => t * t * (3 - 2 * t); // Smooth cubic ease

      const step = now => {
        if (this.cancelled) return resolve();

        if (this.skipRequested) {
          __emitMorphThrottled(BeatBus, EVENTS, clampedTarget, { force: true });
          return resolve();
        }

        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const easedValue = ease(progress) * clampedTarget;

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
        this._clearTimer(timeoutId);
        unsubscribe?.();
        console.log(`   Received: ${event}`);
        resolve(data);
      };

      const unsubscribe = BeatBus.on(event, handler);

      timeoutId = this._trackTimer(() => {
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
    director._trackTimer(() => {
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
