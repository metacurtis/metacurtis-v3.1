// SST v3.5 BeatGlyph Theater Director — Complete Clean Version
// Single source of timeline; Renderer stays single GPU writer; Engine writes blueprints.

import BeatBus from '@/theater/bus';
import stageAtom from '@/state/atoms/stageAtom.js';

import SST from '@/config/sst-loader.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';
import { EVENTS } from '@/theater/events.js';
import ScrollOrchestrator from './ScrollOrchestrator.js';

// 🔬 DIAGNOSTIC: Auto-advance initialization tracking
if (typeof window !== 'undefined') {
  window.__autoAdvanceDiagnostic = {
    initialized: false,
    openingComplete: false,
    autoAdvanceEnabled: false,
    events: [],
    log: function (event, data) {
      const entry = {
        time: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
        event,
        data,
        timestamp: new Date().toISOString(),
      };
      this.events.push(entry);
      console.log(`🔬 [AUTO-ADVANCE] ${event}:`, data);
    },
  };
}

const DEBUG_NARRATION = true;

const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
const DEFAULT_TYPING_LINES = [
  'READY.',
  `10 PRINT "${GENESIS_STAGE_WORD}"`,
  '20 GOTO 10',
  'RUN',
];

const DEFAULT_OPENING_TIMELINE = {
  blackout: { durationMs: 2000 },
  cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
  typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
  fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
  chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
  coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
  settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
  emergence: {
    durationMs: 2000,
    waitForFencepost: true,
    maxWaitMs: 5000,
    stabilizeMs: 500,
    skipMorphAnimation: false,
    skipGenesisBlueprint: true,
    targetState: 'genesis_initial',
  },
};

const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

const DEFERRED_OPENING_DELAY = 120;

function hideInstantLoader() {
  if (typeof document === 'undefined') return;
  const loader = document.getElementById('instant-loader');
  if (!loader) return;
  if (!loader.classList.contains('hidden')) {
    loader.classList.add('hidden');
  }
}

const DEFAULT_OPENING_EMERGENCE = {
  target: 'constellation',
  mode: 'emergence',
  source: 'viewportSpread',
};

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

// ── Theater Director Class ───────────────────────────────────────────────────
class TheaterDirector {
  constructor() {
    this.reset();
    this.timeline = {};
    this.scrollOrchestrator = null;
    this.narrationController = null;
    const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
    if (autoDiag) {
      autoDiag.initialized = true;
      autoDiag.log?.('DIRECTOR_INITIALIZED', {
        timestamp: new Date().toISOString(),
      });
    }

    if (DEBUG_NARRATION) {
      const stageKeys = Object.keys(SST?.narrative?.beatSheets || {});
      console.log('🎬 [TheaterDirector] Initializing');
      console.log('🎬 [TheaterDirector] SST stages:', stageKeys);
    }

    try {
      const openingProbe = this._getOpeningConfig();
      console.log('📋 [OPENING TIMELINE]', {
        hasTimeline: !!openingProbe?.timeline,
        chaos: openingProbe?.timeline?.chaos,
        coalesce: openingProbe?.timeline?.coalesce,
        settle: openingProbe?.timeline?.settle,
        hasChaosConfig: !!openingProbe?.timeline?.chaos,
      });
    } catch (timelineError) {
      console.warn('⚠️ [OPENING TIMELINE] Unable to resolve opening configuration', timelineError);
    }

    this._handleStageChangeBound = (payload = {}) => {
      const targetStage = payload?.to ?? payload?.stage ?? null;
      if (!targetStage) return;
      if (targetStage === 'genesis' && this.currentStage) {
        const isOpeningHandoff = payload?.preserveEmergence === true;
        const source = payload?.source;
        const isManualJump = source === 'manual' || source === 'keyboard';

        if (!isOpeningHandoff && !isManualJump && this.currentStage !== 'genesis') {
          console.log('🎬 Director: Ignoring stale genesis transition', {
            currentStage: this.currentStage,
            targetStage,
            payloadFlags: {
              preserveEmergence: !!payload?.preserveEmergence,
              source,
            },
          });
          return;
        }
      }
      this.handleStageChange(targetStage, payload);
    };

    if (typeof BeatBus?.on === 'function') {
      this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
    }
  }

  _getOpeningConfig() {
    const opening = SST?.narrative?.opening ?? {};
    const openingTimeline = opening.timeline ?? {};
    const stageTimeline = SST?.stages?.genesis?.openingTimeline ?? {};

    const timeline = {
      blackout: {
        ...DEFAULT_OPENING_TIMELINE.blackout,
        ...(openingTimeline.blackout ?? {}),
        ...(stageTimeline.blackout ?? {}),
      },
      cursor: {
        ...DEFAULT_OPENING_TIMELINE.cursor,
        ...(openingTimeline.cursor ?? {}),
        ...(stageTimeline.cursor ?? {}),
      },
      typing: {
        ...DEFAULT_OPENING_TIMELINE.typing,
        ...(openingTimeline.typing ?? {}),
        ...(stageTimeline.typing ?? {}),
      },
      fill: {
        ...DEFAULT_OPENING_TIMELINE.fill,
        ...(openingTimeline.fill ?? {}),
        ...(stageTimeline.fill ?? {}),
      },
      chaos: {
        ...DEFAULT_OPENING_TIMELINE.chaos,
        ...(openingTimeline.chaos ?? {}),
        ...(stageTimeline.chaos ?? {}),
      },
      coalesce: {
        ...DEFAULT_OPENING_TIMELINE.coalesce,
        ...(openingTimeline.coalesce ?? {}),
        ...(stageTimeline.coalesce ?? {}),
      },
      settle: {
        ...DEFAULT_OPENING_TIMELINE.settle,
        ...(openingTimeline.settle ?? {}),
        ...(stageTimeline.settle ?? {}),
      },
      profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
      narration: stageTimeline.narration ?? openingTimeline.narration ?? null,
      beatGlyph: stageTimeline.beatGlyph ?? openingTimeline.beatGlyph ?? null,
    };

    const emergenceTimeline = stageTimeline.emergence ?? openingTimeline.emergence ?? {};

    const fallbackSkipKey = 'SPACE';

    return {
      skipKey:
        stageTimeline.skipKey ??
        opening.skipKey ??
        SST?.narrative?.orchestration?.skipKey ??
        fallbackSkipKey,
      totalDurationMs: stageTimeline.totalDurationMs ?? opening.totalDurationMs ?? null,
      timeline,
      emergence: { ...DEFAULT_OPENING_EMERGENCE, ...emergenceTimeline },
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

  _resolveNarrationController() {
    if (this.narrationController) return this.narrationController;
    if (typeof window !== 'undefined' && window.narrationController) {
      this.narrationController = window.narrationController;
      return this.narrationController;
    }
    return this.narrationController;
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

  _cancelMorphAnimation() {
    if (typeof this._activeMorphCancel === 'function') {
      try {
        this._activeMorphCancel();
      } catch (error) {
        if (import.meta?.env?.DEV) {
          console.warn('[Director] morph cancel failed', error);
        }
      }
    }
    this._activeMorphCancel = null;
  }

  _emitMorphProgress(value, { target, stage, phase, durationMs, source }) {
    const stageName = stage || this.currentStage || 'genesis';
    const clampedValue = clamp01(value);
    const clampedTarget = clamp01(Number.isFinite(target) ? target : clampedValue);
    const payload = {
      morphProgress: clampedValue,
      value: clampedValue,
      target: clampedTarget,
      morphTarget: clampedTarget,
      stage: stageName,
      phase,
      durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0,
      schemaVersion: '3.5',
      source: source || 'director',
    };
    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
  }

  _animateMorphPhase({ from, to, durationMs, stage, phase, skipSignal }) {
    const startValue = clamp01(Number.isFinite(from) ? from : 0);
    const endValue = clamp01(Number.isFinite(to) ? to : startValue);
    const duration = Math.max(0, Number(durationMs) || 0);
    const shouldSkip = typeof skipSignal === 'function' ? skipSignal : () => false;

    this._cancelMorphAnimation();

    console.log(`🎯 [_animateMorphPhase] Starting ${phase || 'unknown'}`, {
      config: { from: startValue, to: endValue, duration },
      stage,
      phase,
      timestamp: Date.now(),
    });

    if (duration === 0 || Math.abs(endValue - startValue) < 1e-4) {
      this._emitMorphProgress(endValue, {
        target: endValue,
        stage,
        phase,
        durationMs: 0,
        source: 'director/morph-immediate',
      });
      return Promise.resolve();
    }

    const requestFrame =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (cb) => setTimeout(() => cb(Date.now()), 16);
    const cancelFrame =
      typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
        ? window.cancelAnimationFrame.bind(window)
        : clearTimeout;

    const getNow =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? () => performance.now()
        : () => Date.now();

    return new Promise((resolve) => {
      const startTime = getNow();
      let rafHandle = null;
      let settled = false;

      const finalize = () => {
        if (settled) return;
        settled = true;
        this._emitMorphProgress(endValue, {
          target: endValue,
          stage,
          phase,
          durationMs,
          source: 'director/morph-finalize',
        });
        resolve();
      };

      const step = () => {
        if (shouldSkip() || this.cancelled) {
          finalize();
          return;
        }

        const elapsed = getNow() - startTime;
        const ratio = Math.min(1, elapsed / duration);
        const value = startValue + (endValue - startValue) * ratio;
        console.log(`⏱️ [RAF ${phase || 'unknown'}] tick`, {
          elapsed,
          targetDuration: duration,
          currentMorph: value,
          stage,
        });
        this._emitMorphProgress(value, {
          target: endValue,
          stage,
          phase,
          durationMs,
          source: 'director/raf',
        });

        if (ratio >= 1) {
          finalize();
          return;
        }
        rafHandle = requestFrame(step);
      };

      rafHandle = requestFrame(step);

      this._activeMorphCancel = () => {
        if (rafHandle != null) {
          cancelFrame(rafHandle);
          rafHandle = null;
        }
        finalize();
      };
    }).finally(() => {
      if (this._activeMorphCancel) {
        this._activeMorphCancel = null;
      }
    });
  }

  handleStageChange(newStage, payload = {}) {
    if (!newStage) {
      if (DEBUG_NARRATION) {
        console.warn('🎬 [STAGE CHANGE] Ignored invalid stage payload', payload);
      }
      return;
    }

    const previousStage = this.currentStage;
    if (previousStage === newStage) {
      if (DEBUG_NARRATION) {
        console.log('🎬 [STAGE CHANGE IGNORED] Duplicate stage event', {
          stage: newStage,
          payload,
        });
      }
      return;
    }
    const narrationController = this._resolveNarrationController();
    const beatSheet = SST?.narrative?.beatSheets?.[newStage];

    if (DEBUG_NARRATION) {
      console.log('🎬 [STAGE CHANGE]', {
        from: previousStage,
        to: newStage,
        hasBeatSheet: !!beatSheet,
        narrationControllerExists: !!narrationController,
      });
    }

    this.currentStage = newStage;

    if (beatSheet) {
      if (DEBUG_NARRATION) {
        console.log('🎬 [BEAT SHEET FOUND]', {
          stage: newStage,
          beatCount: beatSheet?.beats?.length || 0,
          duration: beatSheet?.totalDuration || 'unknown',
        });
      }

      const openingInProgress = this.isOpeningInProgress();
      if (DEBUG_NARRATION) {
        console.log('🎬 [TRIGGERING NARRATION]', newStage, {
          openingInProgress,
        });
      }
      if (openingInProgress) {
        if (DEBUG_NARRATION) {
          console.log('🎬 Director: Opening in progress; suppressing stage-change narration trigger');
        }
        return;
      }

      BeatBus.emit(EVENTS.START_NARRATIVE, {
        stage: newStage,
        source: 'director_stage_change',
        timestamp:
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now(),
      });
    } else if (DEBUG_NARRATION) {
      console.warn('⚠️ [NO BEAT SHEET]', newStage);
    }
  }

  _requestSkip(origin = 'keyboard') {
    if (this.skipRequested) return;
    this.skipRequested = true;
    this._skipOrigin = origin;
    console.log(`🎬 Director: Opening skip requested via ${origin}`);
    this._cancelMorphAnimation();
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

    this._cancelMorphAnimation();
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
    this._openingInProgress = false;
    this._openingPrebound = false;
    this._preChaosReady = false;

    try {
      window.__canonFencepostSeen = false;
    } catch {}

    return this;
  }

  async start() {
    console.log('🚀 [DIRECTOR START] Called', {
      isRunning: this.isRunning,
      hasRun: this.hasRun,
      phase: this.phase,
      timestamp: Date.now(),
    });
    // Strong duplicate protection
    if (this.isRunning) {
      console.log('⚠️ [DIRECTOR START] Already running, returning');
      return;
    }

    if (this.phase === 'complete' && this.currentStage) {
      if (DEBUG_NARRATION) {
        console.log('🎬 Director: Opening already complete, ignoring restart request', {
          currentStage: this.currentStage,
        });
      }
      return;
    }
    
    if (this.hasRun) {
      console.log('🎬 Director: Already completed, ignoring restart');
      return;
    }

    hideInstantLoader();

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
    this._openingInProgress = true;

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
      this._openingInProgress = false;
      this._detachSkipListener();
      this.isRunning = false;
      if (this.phase !== 'cancelled' && this.phase !== 'error') {
        this.hasRun = true;
        this.completed = true;
      }
    }
  }

  async _runSequence() {
    console.log('🎬 [RUN SEQUENCE] Starting', {
      phase: this.phase,
      currentStage: this.currentStage,
      timestamp: Date.now(),
    });
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
    typingConfig.completionDelayMs = Math.max(
      0,
      Number(
        typingConfig.completionDelayMs ??
          typingConfig.completionDelay ??
          DEFAULT_OPENING_TIMELINE.typing.completionDelayMs ??
          0,
      ),
    );
    const typingDuration = this._calculateTypingDuration(typingConfig);

    const fillConfig = {
      ...DEFAULT_OPENING_TIMELINE.fill,
      ...(timeline?.fill ?? {}),
    };
    fillConfig.durationMs = Math.max(0, Number(fillConfig.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs));
    fillConfig.scrollSpeed = Math.max(0, Number(fillConfig.scrollSpeed ?? DEFAULT_OPENING_TIMELINE.fill.scrollSpeed));
    if (typeof fillConfig.text !== 'string' || !fillConfig.text.trim()) {
      const canonicalFillWord = Canonical?.visual?.letterGeometry?.genesis?.word || GENESIS_STAGE_WORD;
      fillConfig.text = `${canonicalFillWord} `;
    }

    const chaosConfig = timeline?.chaos || {};
    const coalesceConfig = timeline?.coalesce || {};
    const settleConfig = timeline?.settle || {};

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
    const shouldWaitForFencepost = waitForFencepost && !this._openingPrebound;
    const stabilizeMs = Math.max(
      0,
      Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
    );
    const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
    const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
    const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;

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
    const morphStage = 'genesis';
    let currentMorphValue = 0;
    const emitMorphSnapshot = (value, phase, target = value, durationMs = 0) => {
      this._emitMorphProgress(value, {
        target,
        stage: morphStage,
        phase,
        durationMs,
        source: 'director/snapshot',
      });
    };
    const animateMorph = (from, to, durationMs, phase) =>
      this._animateMorphPhase({
        from,
        to,
        durationMs,
        stage: morphStage,
        phase,
        skipSignal: () => skipTriggered || this.skipRequested || this.cancelled,
      });

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
        if (typingConfig.completionDelayMs > 0) {
          const waitResult = await this.sleep(typingConfig.completionDelayMs);
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

    if (!skipTriggered && chaosConfig?.enabled !== false) {
      console.log('🔍 [ABOUT TO START CHAOS]', {
        chaosConfig,
        currentMorph: currentMorphValue,
        timestamp: Date.now(),
      });
      if (!this._openingPrebound) {
        try {
          console.log('   Phase: Pre-chaos blueprint bind');
          BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
            mode: 'opening_chaos',
            source: 'director:opening',
            stage: 'genesis',
            target: 'genesis_opening',
            count: genesisCount,
            tierRatios: Array.isArray(Canonical?.stages?.genesis?.tierMix)
              ? Canonical.stages.genesis.tierMix
              : (Array.isArray(VC?.TIER_RATIOS) ? VC.TIER_RATIOS : undefined),
            skipMorphAnimation: true,
            fastForward: true,
          });
          this._openingPrebound = true;
        } catch (bindError) {
          console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
        }
        const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
        if (bindSettleMs > 0) {
          const waitResult = await this.sleep(bindSettleMs);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
      }

      if (!this._preChaosReady) {
        const readinessResult = await Promise.race([
          this._waitForEvent(EVENTS.PARTICLES_EMERGED, {
            timeout: 1200,
            predicate: (payload = {}) => {
              const stageName = payload?.stage || payload?.stageName;
              return !payload || stageName === 'genesis';
            },
          }).then((payload) => ({ type: 'particles', payload })),
          this._waitForEvent(EVENTS.BLUEPRINT_READY, {
            timeout: 1200,
            predicate: (payload = {}) => {
              const blueprint = payload?.blueprint ?? payload;
              const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
              const mode = payload?.mode || blueprint?.mode;
              return stageName === 'genesis' && mode !== 'emergence';
            },
          }).then((payload) => ({ type: 'blueprint', payload })),
        ]);

        if (!readinessResult) {
          console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
        } else {
          console.log('✅ Blueprint bound and particles ready', {
            via: readinessResult.type,
            timestamp: Date.now(),
          });
        }
        this._preChaosReady = true;
      }

      const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
      this.phase = 'chaos';
      console.log(`   Phase: Chaos (${chaosDuration}ms)`);
      BeatBus.emit(EVENTS.PARTICLE_PHASE, {
        name: 'chaos',
        duration: chaosDuration,
        rendererSpin: chaosConfig.rendererSpin || null,
      });
      const chaosTarget = Number.isFinite(chaosConfig.morphTo)
        ? clamp01(chaosConfig.morphTo)
        : 0.0;
      const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
      if (chaosDuration > 0) {
        const waitResult = await this.sleep(chaosDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }
      if (chaosAnimation) {
        await chaosAnimation;
      }
      currentMorphValue = chaosTarget;
    }

    if (!skipTriggered && coalesceConfig?.enabled !== false) {
      console.log('🔍 [ABOUT TO START COALESCE]', {
        coalesceConfig,
        currentMorph: currentMorphValue,
        timestamp: Date.now(),
      });
      const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
      this.phase = 'coalesce';
      console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
      BeatBus.emit(EVENTS.PARTICLE_PHASE, {
        name: 'coalesce',
        duration: coalesceDuration,
        morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
      });
      const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
      const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
      let coalesceAnimation = null;
      if (hasCoalesceTarget) {
        coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
      } else {
        emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
      }
      if (coalesceDuration > 0) {
        const waitResult = await this.sleep(coalesceDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }
      if (coalesceAnimation) {
        await coalesceAnimation;
      }
      currentMorphValue = coalesceTarget;
    }

    if (!skipTriggered && settleConfig?.enabled !== false) {
      console.log('🔍 [ABOUT TO START SETTLE]', {
        settleConfig,
        currentMorph: currentMorphValue,
        timestamp: Date.now(),
      });
      const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
      this.phase = 'settle';
      console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
      BeatBus.emit(EVENTS.PARTICLE_PHASE, {
        name: 'settle',
        duration: settleDuration,
        morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
      });
      const hasSettleTarget = typeof settleConfig.morphTo === 'number';
      const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
      let settleAnimation = null;
      if (hasSettleTarget) {
        settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
      } else {
        emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
      }
      if (settleDuration > 0) {
        const waitResult = await this.sleep(settleDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }
      if (settleAnimation) {
        await settleAnimation;
      }
      currentMorphValue = settleTarget;
    }

    if (skipTriggered) {
      console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
      if (currentMorphValue < 1) {
        emitMorphSnapshot(1, 'skip-fast-forward', 1, 0);
        currentMorphValue = 1;
      }
      this._cancelMorphAnimation();
    }

    // ───────────────── Phase 5: Emergence (viewport → constellation)
    this.phase = 'emergence';
    const reusePreboundBlueprint = this._openingPrebound === true;
    console.log(`   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`);

    const viewportHint = await this._ensureViewportHint();

    if (!reusePreboundBlueprint) {
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
        mode: emergenceConfig.mode,
        source: emergenceConfig.source,
        target: emergenceConfig.target,
        count: genesisCount,
        tierRatios: Array.isArray(Canonical?.stages?.genesis?.tierMix)
          ? Canonical.stages.genesis.tierMix
          : VC?.TIER_RATIOS,
        viewportHint,
        fastForward: skipTriggered || skipMorphAnimation,
        skipMorphAnimation,
        targetState,
      });
    } else {
      emitMorphSnapshot(currentMorphValue, 'emergence', 1, emergenceTimeline.durationMs);
    }

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

      if (shouldWaitForFencepost && !reusePreboundBlueprint) {
        console.log(`   Waiting for renderer fencepost (<=${fencepostWaitMs}ms)`);
        if (!this._fencepostReadyEmitted) {
          const readyPayload = {
            at: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            phase: 'opening',
          };
          BeatBus.emit(EVENTS.FENCEPOST_LISTENERS_READY, readyPayload);
          this._fencepostReadyEmitted = true;
        }

        const fencepostFallbackMs = Math.min(1200, fencepostWaitMs);
        const fencepostReceived = await new Promise((resolve) => {
          let resolved = false;
          let fenceTimeoutId = null;
          let blueprintTimeoutId = null;

          const finish = (result) => {
            if (resolved) return;
            resolved = true;
            this._clearTimer(fenceTimeoutId);
            this._clearTimer(blueprintTimeoutId);
            fenceOff?.();
            blueprintOff?.();
            resolve(result);
          };

          const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
            console.log('   Received: PARTICLES_EMERGED');
            finish({ type: 'fencepost', payload });
          });

          fenceTimeoutId = this._trackTimer(() => {
            console.warn(`⚠️ Director: ${EVENTS.PARTICLES_EMERGED} timed out after ${fencepostWaitMs}ms`);
            finish(null);
          }, fencepostWaitMs);

          const blueprintOff = BeatBus.on(EVENTS.BLUEPRINT_READY, (payload = {}) => {
            const blueprint = payload?.blueprint ?? payload;
            const stage = payload?.stage || blueprint?.stage || blueprint?.stageName;
            const mode = payload?.mode || blueprint?.mode;
            const isGenesis = stage === 'genesis';
            const isEmergenceMode = mode === 'emergence';
            if (!isGenesis || isEmergenceMode) return;
            console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
            finish({ type: 'blueprint', payload });
          });

          blueprintTimeoutId = this._trackTimer(() => {
            blueprintOff?.();
          }, fencepostFallbackMs);
        });

        if (!fencepostReceived) {
          console.warn('   Renderer fencepost timeout, continuing anyway');
        }
        if (this.cancelled) return;
      }

      if (!skipTriggered && stabilizeMs > 0) {
        const waitResult = await this.sleep(stabilizeMs);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }

      // ───────────────── Phase 6: Genesis handoff
      const toStage = 'genesis';
      
      this.phase = 'genesis';
      const previousStage = this.currentStage ?? 'emergence';
      console.log('🧬 Phase: Genesis stage handoff');

      BeatBus.emit(EVENTS.STAGE_CHANGE, {
        from: previousStage,
        to: toStage,
        skipBlueprint: skipGenesisBlueprint,
        preserveEmergence: true,
        targetState,
      });

      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {}

      await this._runVisualSchedule();

      BeatBus.emit(EVENTS.START_NARRATIVE, {
        stage: toStage,
        source: 'opening_complete',
      });
      this.emitTune({
        breathingAmp: 0.02,
        breathingPeriodSec: 4,
        flareProb: 0.02,
        flareGain: 1.3,
        tierSpeedScale: [1.0, 0.8, 0.6, 0.4],
        pulseOnce: 1,
      });

      BeatBus.emit(EVENTS.ENABLE_SCROLL);
      this._openingPrebound = false;
      
      if (!this.scrollOrchestrator) {
        this.scrollOrchestrator = new ScrollOrchestrator();
      }
      this.scrollOrchestrator.start();
      this.monitorFragments();

      this.phase = 'complete';

      if (DEBUG_NARRATION) {
        const timestamp =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        console.log('✅ [OPENING COMPLETE]', {
          nextStage: 'discipline',
          shouldAutoAdvance: true,
          timestamp,
        });

        setTimeout(() => {
          const win = typeof window !== 'undefined' ? window : undefined;
          const currentStageSnapshot = this.currentStage;
          const scrollLocked =
            (win?.scrollOrchestrator && win.scrollOrchestrator.scrollLocked === true) ||
            (win?.__scrollOrchestrator && win.__scrollOrchestrator.scrollLocked === true) ||
            false;
          const narrationController = this._resolveNarrationController();
          console.log('🔍 [POST-OPENING STATE]', {
            currentStage: currentStageSnapshot,
            scrollLocked,
            narrationPlaying: !!narrationController?.isPlaying,
          });
        }, 100);
      }

      const elapsed = Date.now() - this.startTime;
      console.log('🎬 Director: Opening complete → enabling auto-advance');
      this.handleOpeningComplete({ skipTriggered, opening, elapsed });
    } finally {
      this._detachSkipListener();
    }
  }

  handleOpeningComplete({ skipTriggered, opening, elapsed }) {
    const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
    const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
    const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
    const autoAdvanceBefore =
      stageAtom?.isAutoAdvanceEnabled?.() ??
      currentState.autoAdvanceEnabled ??
      false;

    if (autoDiag) {
      autoDiag.openingComplete = true;
      autoDiag.log('OPENING_COMPLETE', {
        stage: currentStage,
        autoAdvanceBefore,
      });
    }

    let autoEnabled = false;
    let failureReason = null;

    if (typeof window !== 'undefined' && window.stageControls?.setAutoAdvanceEnabled) {
      const alreadyEnabled =
        typeof window.stageControls.isAutoAdvanceEnabled === 'function'
          ? window.stageControls.isAutoAdvanceEnabled()
          : window.stageControls.getState?.()?.autoAdvanceEnabled;

      if (alreadyEnabled) {
        console.log('   Auto-advance already active');
        autoEnabled = true;
      } else {
        window.stageControls.setAutoAdvanceEnabled(true);
        console.log('✅ Auto-advance enabled for narration-driven progression');
        autoEnabled = true;
      }
    } else {
      failureReason = 'setAutoAdvanceEnabled not found';
      console.warn('⚠️ stageControls.setAutoAdvanceEnabled unavailable; attempting direct stageAtom enable');
    }

    if (!autoEnabled && typeof stageAtom?.setAutoAdvanceEnabled === 'function') {
      stageAtom.setAutoAdvanceEnabled(true);
      console.log('✅ Auto-advance enabled via stageAtom fallback');
      autoEnabled = true;
    } else if (!autoEnabled) {
      failureReason = failureReason ?? 'stageAtom.setAutoAdvanceEnabled not available';
    }

    const autoAdvanceAfter =
      stageAtom?.isAutoAdvanceEnabled?.() ??
      stageAtom?.getState?.()?.autoAdvanceEnabled ??
      false;

    if (autoDiag) {
      autoDiag.autoAdvanceEnabled = autoAdvanceAfter;
      if (autoEnabled) {
        autoDiag.log('AUTO_ADVANCE_ENABLED', {
          success: true,
          autoAdvanceAfter,
        });
      } else {
        autoDiag.log('AUTO_ADVANCE_FAILED', {
          reason: failureReason ?? 'Unable to enable auto-advance',
          autoAdvanceAfter,
        });
      }
    }

    if (typeof opening?.totalDurationMs === 'number') {
      console.log(`   Expected (SST): ~${opening.totalDurationMs}ms, Actual: ${elapsed}ms`);
    } else {
      console.log(`   Total opening time: ${elapsed}ms`);
    }
    if (skipTriggered) {
      console.log('   Opening was user-skipped; actual duration shortened.');
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
    this._cancelMorphAnimation();
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

  _waitForEvent(event, { timeout = 5000, predicate } = {}) {
    if (!event) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      let timeoutId = null;

      const finish = (result) => {
        if (settled) return;
        settled = true;
        this._clearTimer(timeoutId);
        off?.();
        resolve(result);
      };

      const handler = (payload) => {
        try {
          if (typeof predicate === 'function' && !predicate(payload)) {
            return;
          }
        } catch (err) {
          console.warn(`⚠️ Director: predicate for ${event} threw`, err);
          return;
        }
        finish(payload);
      };

      const off = typeof BeatBus?.on === 'function'
        ? BeatBus.on(event, handler)
        : null;

      timeoutId = this._trackTimer(() => {
        console.warn(`⚠️ Director: ${event} timed out after ${timeout}ms`);
        finish(null);
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

  isOpeningInProgress() {
    return this._openingInProgress === true;
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

let deferredStartHandle = null;

const scheduleDeferredDirectorStart = (
  reason = 'auto',
  { ensureViewportReady = false, delay = DEFERRED_OPENING_DELAY } = {}
) => {
  if (director.hasRun || director.isRunning || director.phase === 'complete') {
    hideInstantLoader();
    return;
  }

  if (ensureViewportReady) {
    director.viewportReady = true;
    director.waitingForViewport = false;
  }

  if (deferredStartHandle != null) {
    return;
  }

  const startSequence = () => {
    deferredStartHandle = null;
    console.log('🎬 Director: Deferred start scheduled', { reason, delay });
    hideInstantLoader();
    director.start();
  };

  const schedule = () => {
    deferredStartHandle = director._trackTimer(startSequence, delay);
  };

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(schedule);
  } else {
    schedule();
  }
};

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
      if (!director.hasRun && !director.isRunning && director.phase !== 'complete') {
        console.log('🎬 Director: Viewport hint received, auto-starting', data);
        scheduleDeferredDirectorStart('viewport-hint', { ensureViewportReady: true });
      } else if (DEBUG_NARRATION) {
        console.log('🎬 Director: Viewport hint received but start skipped', {
          hasRun: director.hasRun,
          isRunning: director.isRunning,
          phase: director.phase,
        });
      }
      unsubscribe?.();
    });

    // Fallback: start after 3 seconds if no viewport hint
    director._trackTimer(() => {
      if (!director.hasRun && !director.isRunning && !director.viewportReady && director.phase !== 'complete') {
        console.warn('🎬 Director: No viewport hint after 3s, starting anyway');
        scheduleDeferredDirectorStart('viewport-timeout', { ensureViewportReady: true, delay: 0 });
      } else if (DEBUG_NARRATION) {
        console.log('🎬 Director: Auto-start fallback skipped', {
          hasRun: director.hasRun,
          isRunning: director.isRunning,
          viewportReady: director.viewportReady,
          phase: director.phase,
        });
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
