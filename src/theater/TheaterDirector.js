// SST v3.5 BeatGlyph Theater Director — Complete Clean Version
// Single source of timeline; Renderer stays single GPU writer; Engine writes blueprints.

import BeatBus from '@/theater/bus';
import stageAtom from '@/state/atoms/stageAtom.js';

import SST from '@/config/sst-loader.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';
import { EVENTS } from '@/theater/events.js';
import { OpeningSequenceController } from './controllers/OpeningSequenceController.js';

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
    this.openingController = null;
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

    // Initialize opening sequence controller
    this.openingController = new OpeningSequenceController(this);

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
    return this.openingController?.getOpeningConfig?.() ?? {};
  }

  _getGenesisParticleCount() {
    const candidate = Number(SST?.performance?.particleCount?.genesis);
    if (Number.isFinite(candidate) && candidate > 0) return candidate;
    return 2000;
  }

  _calculateTypingDuration(typingConfig) {
    return this.openingController?.calculateTypingDuration?.(typingConfig) ?? 0;
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
    this.openingController?.requestSkip?.(origin);
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
    this.openingController?.cancel?.();

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
    const snapshotTyping = snapshotTimeline.typing ?? {};
    const snapshotTypingDuration = this._calculateTypingDuration(snapshotTyping);

    const segments = [
      `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
      `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
      `typing ~${snapshotTypingDuration}ms`,
      `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
      `emergence ${openingSnapshot?.emergence?.durationMs ?? 0}ms`,
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

  /**
   * Run opening sequence – delegate to OpeningSequenceController.
   */
  async _runSequence() {
    console.log('🎬 Director: Delegating to OpeningSequenceController');

    if (!this.openingController) {
      console.error('[Director] OpeningSequenceController not initialized!');
      return;
    }

    await this.openingController.runSequence();
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
    this.openingController?.cancel?.();
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
