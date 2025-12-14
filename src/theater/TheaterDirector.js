// SST v3.5 BeatGlyph Theater Director — Complete Clean Version
// Single source of timeline; Renderer stays single GPU writer; Engine writes blueprints.

import BeatBus from '@/theater/bus';
import stageAtom from '@/state/atoms/stageAtom.js';

import SST from '@/config/sst-loader.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { EVENTS } from '@/theater/events.js';
import ScrollOrchestrator from './ScrollOrchestrator.js';
import MorphAnimationController from '@/theater/controllers/MorphAnimationController.js';
import VisualOrchestrator from '@/theater/VisualOrchestrator.js';

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

const AUTOSTART_DISABLED =
  typeof globalThis !== 'undefined' && globalThis.__DISABLE_DIRECTOR_AUTOSTART__ === true;

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
  settle: { enabled: true, durationMs: 1200, morphTo: 1.0 },
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

// Breathing window after settle (HELLO CURTIS fully formed, gentle drift only)
const OPENING_SETTLE_HOLD_MS = 600;

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

const DIRECTOR_TIER_RATIOS = [0.7, 0.12, 0.13, 0.05];
const DIRECTOR_SIGMA_BASE = 2.5;
const DIRECTOR_SIGMA_PEAK = 3.8;
const DIRECTOR_POINT_KICK = 1.4;
const DIRECTOR_TIER_HI_PEAK = 1.0;
const DIRECTOR_TIER_HI_SETTLE = 0.25;
const DIRECTOR_MID_MORPH = 0.88;

const PHASE_DIRECTIVE_ENVELOPE = {
  chaos: {
    motionMode: 3,
    particlePhase: 2,
    flowTurbulence: 1.5,
    particleFlash: 1.2,
    opacity: [0.3, 1.0],
  },
  coalesce: {
    motionMode: 2,
    particlePhase: 3,
    flowTurbulence: 0.8,
    particleFlash: 0.8,
    opacity: [0.4, 0.9],
  },
  settle: {
    motionMode: 1,
    particlePhase: 1,
    flowTurbulence: 0.1,
    particleFlash: 0.2,
    opacity: [0.4, 0.8],
  },
  emergence: {
    motionMode: 3,
    particlePhase: 2,
    flowTurbulence: 1.0,
    particleFlash: 1.0,
    opacity: [0.6, 1.0],
  },
};

const OPENING_PHASE_VERBS = {
  chaos: 'opening_constellation_bloom',
  coalesce: 'opening_grid_converge',
  settle: 'opening_glyph_lock',
};

const openingPhaseEffectCache = new Map();

function resolveOpeningPhaseEffect(phase) {
  const verb = OPENING_PHASE_VERBS[phase] || null;
  if (!verb) return { verb: null, effect: null };
  if (!openingPhaseEffectCache.has(verb)) {
    const effect =
      typeof Canonical?.getVisualEffect === 'function' ? Canonical.getVisualEffect(verb) : null;
    openingPhaseEffectCache.set(verb, effect || null);
  }
  return { verb, effect: openingPhaseEffectCache.get(verb) || null };
}

const SKIP_KEY_MAP = {
  SPACE: { codes: ['Space'], keys: [' ', 'Spacebar'] },
  ENTER: { codes: ['Enter', 'NumpadEnter'], keys: ['Enter'] },
  ESCAPE: { codes: ['Escape'], keys: ['Escape', 'Esc'] },
};

const OPENING_MORPH_SOURCE = 'raf-timed';
let __openingToken = 0;
let __openingTimers = [];
let __openingActiveStage = null;

function _cancelOpeningSchedule() {
  for (const id of __openingTimers) clearTimeout(id);
  __openingTimers = [];
  __openingToken += 1;
  __openingActiveStage = null;
}

function normalizeOpeningTimeline(opening) {
  if (!opening) return [];
  const raw =
    opening.timeline?.steps ??
    opening.timeline ??
    opening.steps ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s, idx) => {
      const atMs = Number(s.atMs ?? s.at ?? s.timeMs ?? 0);
      if (!Number.isFinite(atMs)) return null;
      return {
        id: s.id ?? null,
        atMs,
        verb: s.verb ?? s.visualVerb ?? s.cue ?? null,
        camera: s.camera ?? null,
        handoff: s.handoff ?? null,
        meta: s.meta ?? null,
        order: idx,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.atMs - b.atMs || (a.order - b.order));
}

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
    this._renderDirectiveContext = null;
    this._ownsOpeningMorph = false;
    this._pendingDirectorFencepost = null;
    this._directorFencepostSent = false;
    this._lastMorphValue = 0;
    this._latestRendererFence = null;
    this._latestRendererParticles = null;
    this._latestRendererBlueprint = null;
    this._openingModeAnnounced = false;
    this._morphAnimationController = new MorphAnimationController();
    this._isOpeningSequence = false;
    this._openingMorphListener = null;
    this._stageBlueprintUnsubscribe = null;
    this._handleBlueprintReadyBound = null;
    this._climaxStepUnsubscribe = null;
    this._beatScheduleToken = 0;
    this._beatTimers = [];
    this._currentVisualDemo = null;
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
      const targetStage = payload?.to ?? null;
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

    this._handleRendererFenceReady = (payload = {}) => {
      const channel = payload?.channel;
      if (channel && channel !== 'renderer') return;
      this._latestRendererFence = { type: 'listeners', payload };
    };

    this._handleRendererParticlesReady = (payload = {}) => {
      const channel = payload?.channel;
      if (channel && channel !== 'renderer') return;
      const stageName = payload?.stage || payload?.stageName;
      if (stageName && stageName !== 'genesis') return;
      this._latestRendererParticles = { type: 'particles', payload };
    };

    this._handleRendererBlueprintReady = (payload = {}) => {
      const blueprint = payload?.blueprint ?? payload;
      const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
      const mode = payload?.mode || blueprint?.mode;
      const channel = payload?.channel || blueprint?.channel;
      const isOpening = mode === 'opening_chaos' || payload?.opening === true || blueprint?.opening === true;
      if (stageName !== 'genesis' || !isOpening) return;
      if (channel && channel !== 'renderer') return;
      this._latestRendererBlueprint = { type: 'blueprint', payload };
    };

    this._handleBlueprintReady = (payload = {}) => {
      const blueprint = payload?.blueprint ?? payload;
      const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
      const mode = payload?.mode || blueprint?.mode;
      const channel = payload?.channel || blueprint?.channel;
      if (channel && channel !== 'renderer') return;
      if (!stageName) return;
      // Skip opening/emergence blueprints
      if (mode === 'emergence' || mode === 'opening_chaos') return;
      // Skip climax/qr specialty blueprints
      if (mode && (mode.includes('climax') || mode.includes('qr'))) return;
      // Do not start stage-entry morph while opening is in progress
      if (typeof this.isOpeningInProgress === 'function' && this.isOpeningInProgress()) return;
      this._startStageEntryMorph(stageName);
    };
    // Use a safe wrapper so we never blow up if the handler is temporarily undefined
    this._handleBlueprintReadyBound = (payload) => {
      if (typeof this._handleBlueprintReady === 'function') {
        this._handleBlueprintReady(payload);
      }
    };
    this._handleClimaxStepForMorph = (payload = {}) => this._driveClimaxMorph(payload);

    if (typeof BeatBus?.on === 'function') {
      this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
      this._rendererFenceUnsubscribe = BeatBus.on(
        EVENTS.FENCEPOST_LISTENERS_READY,
        this._handleRendererFenceReady
      );
      this._rendererParticlesUnsubscribe = BeatBus.on(
        EVENTS.PARTICLES_EMERGED,
        this._handleRendererParticlesReady
      );
      this._rendererBlueprintUnsubscribe = BeatBus.on(
        EVENTS.BLUEPRINT_READY,
        this._handleRendererBlueprintReady
      );
      this._stageBlueprintUnsubscribe = BeatBus.on(
        EVENTS.BLUEPRINT_READY,
        this._handleBlueprintReadyBound,
      );
      this._climaxStepUnsubscribe = BeatBus.on(
        EVENTS.CLIMAX_STEP,
        this._handleClimaxStepForMorph,
      );
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
    BeatBus.emit('DIRECTOR:MORPH_STATE', payload);
    this._lastMorphValue = clampedValue;
    if (this._ownsOpeningMorph) {
      this._emitRenderDirectiveFrame(clampedValue, {
        stage: stageName,
        phase,
        durationMs,
        target: clampedTarget,
      });
    }
  }

  _buildRenderDirectiveContext(particleCount = 0) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const smooth = (t) => t * t * (3 - 2 * t);
    const count = Math.max(1, Math.floor(particleCount) || 1);
    const pointSizeBase = Canonical?.features?.pointSizeDefault ?? 48;
    const sigmaBase = DIRECTOR_SIGMA_BASE;
    const sigmaPeak = DIRECTOR_SIGMA_PEAK;
    const pointKick = DIRECTOR_POINT_KICK;
    const tierPeak = DIRECTOR_TIER_HI_PEAK;
    const tierSettle = DIRECTOR_TIER_HI_SETTLE;
    const midValue = clamp(DIRECTOR_MID_MORPH, 0.05, 0.95);
    return {
      particleCount: count,
      pointSizeBase,
      sigmaBase,
      sigmaPeak,
      pointKick,
      tierPeak,
      tierSettle,
      midValue,
      clamp,
      smooth,
      source: 'opening_sequence',
    };
  }

  _attachOpeningMorphListener() {
    if (this._openingMorphListener) return;
    if (typeof BeatBus?.on !== 'function') return;
    this._openingMorphListener = BeatBus.on(EVENTS.MORPH_PROGRESS, (payload = {}) => {
      if (!this._ownsOpeningMorph) return;
      const value = typeof payload.progress === 'number' ? payload.progress : null;
      if (value == null) return;
      const target = typeof payload.target === 'number' ? payload.target : value;
      const phase = this.phase || payload.phase || 'opening';
      const stage = this.currentStage || 'genesis';
      this._emitRenderDirectiveFrame(value, { stage, phase, target });
    });
  }

  _detachOpeningMorphListener() {
    if (this._openingMorphListener) {
      try {
        this._openingMorphListener();
      } catch {}
    }
    this._openingMorphListener = null;
  }

  _cancelBeatSchedule() {
    this._beatScheduleToken += 1;
    if (Array.isArray(this._beatTimers)) {
      this._beatTimers.forEach((id) => clearTimeout(id));
    }
    this._beatTimers = [];
  }

  _runOpeningSchedule({ stage, source = 'TheaterDirector' } = {}) {
    _cancelOpeningSchedule();
    if (!stage) return;
    const token = __openingToken;
    __openingActiveStage = stage;

    const opening =
      (typeof Canonical?.getOpeningTimeline === 'function' && Canonical.getOpeningTimeline(stage)) ||
      Canonical?.opening?.timeline ||
      Canonical?.stages?.[stage]?.openingTimeline ||
      null;

    const timeline = normalizeOpeningTimeline(opening);
    if (!timeline.length) {
      if (DEBUG_NARRATION) {
        console.log('[OpeningSchedule] No timeline for stage', stage);
      }
      return;
    }

    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let handoffDone = false;
    __openingTimers = [];

    if (DEBUG_NARRATION) {
      console.log('[OpeningSchedule] start', { stage, steps: timeline.length, source });
    }

    timeline.forEach((step, idx) => {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const delay = Math.max(0, step.atMs - (now - t0));
      const id = setTimeout(() => {
        if (token !== __openingToken) return;
        if (__openingActiveStage !== stage) return;

        if (step.verb) {
          VisualOrchestrator.applyVerb?.({
            stage,
            verb: step.verb,
            phase: 'opening',
            source: 'visual_orchestrator',
            overrides: {
              beatIndex: idx,
              beatId: step.id ?? `opening:${stage}:${idx}`,
              ...(step.meta ? { meta: step.meta } : {}),
            },
          });
        }

        if (step.camera) {
          VisualOrchestrator.applyCamera?.({
            stage,
            camera: step.camera,
            cueId: step.id ?? `camera:${stage}:${idx}`,
            source: 'visual_orchestrator',
          });
        }

        if (!handoffDone && step.handoff === 'ENABLE_SCROLL') {
          handoffDone = true;
          BeatBus.emit(EVENTS.ENABLE_SCROLL, {
            source: 'OpeningSchedule',
            timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
          });
          BeatBus.emit(EVENTS.OPENING_COMPLETE, {
            stage,
            source: 'OpeningSchedule',
            timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
          });
          if (DEBUG_NARRATION) {
            console.log('[OpeningSchedule] handoff ENABLE_SCROLL', { stage });
          }
        }
      }, delay);
      __openingTimers.push(id);
    });
  }

  _startBeatScheduleForStage(stage, source = 'director') {
    this._cancelBeatSchedule();
    if (!stage) return;
    const token = ++this._beatScheduleToken;
    const beatSheet =
      (typeof Canonical?.getBeatSheet === 'function' && Canonical.getBeatSheet(stage)) ||
      Canonical?.narrative?.beatSheets?.[stage] ||
      null;
    const beats = Array.isArray(beatSheet?.beats) ? beatSheet.beats : [];
    if (!beats.length) {
      if (DEBUG_NARRATION) {
        console.log('[BeatScheduler] No beat sheet for stage', stage);
      }
      return;
    }
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const timers = [];
    beats.forEach((beat, idx) => {
      const atMs = Number(beat?.time ?? beat?.at ?? beat?.atMs ?? 0);
      const verb = beat?.visual ?? beat?.verb ?? beat?.cue ?? null;
      if (!verb || !Number.isFinite(atMs)) return;
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const delay = Math.max(0, atMs - (now - t0));
      const id = setTimeout(() => {
        if (token !== this._beatScheduleToken) return;
        try {
          VisualOrchestrator.applyVerb?.({
            stage,
            verb,
            phase: 'narration',
            source: 'visual_orchestrator',
            overrides: {
              beatIndex: idx,
              beatId: beat?.id ?? `${stage}:${idx}`,
              metadata: beat?.metadata ?? beat?.meta ?? {},
            },
          });
        } catch (e) {
          console.error('[BeatScheduler] applyVerb failed', { stage, verb, idx, e });
        }
      }, delay);
      timers.push(id);
    });
    this._beatTimers = timers;
    if (DEBUG_NARRATION) {
      console.log('[BeatScheduler] Scheduled beats', { stage, count: timers.length, source });
    }
  }

  _cancelCurrentVisualDemo(reason = 'replaced') {
    const current = this._currentVisualDemo;
    if (!current) return;

    current.timers?.forEach((id) => clearTimeout(id));
    if (current.doneTimer) {
      clearTimeout(current.doneTimer);
    }

    if (current.scrollLocked && typeof document !== 'undefined' && document.body) {
      try {
        document.body.style.overflow = current.bodyOverflowPrev ?? '';
      } catch {
        // noop
      }
    }

    this._currentVisualDemo = null;
    if (DEBUG_NARRATION) {
      console.log(`[DEMO] cancel ${current.id}`, { reason });
    }
  }

  runVisualDemo(demoId) {
    this._cancelCurrentVisualDemo('cancel');

    const demo = Canonical?.visualDemos?.[demoId];
    if (!demo) {
      console.error(`[TheaterDirector] visual demo not found: ${demoId}`);
      return;
    }

    const timers = [];
    const startedAt =
      (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    let scrollLocked = false;
    let bodyOverflowPrev;
    if (demo.scroll?.lock && typeof document !== 'undefined' && document.body) {
      try {
        bodyOverflowPrev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        scrollLocked = true;
      } catch {
        scrollLocked = false;
      }
    }

    const beats = Array.isArray(demo.beats) ? demo.beats : [];
    beats.forEach((beat) => {
      if (!beat || !beat.verb) return;
      const atMs = Number(beat.atMs ?? beat.at ?? beat.time ?? 0);
      if (!Number.isFinite(atMs)) return;
      const delay = Math.max(0, atMs);
      const id = setTimeout(() => {
        const source =
          beat.id ? `visual_demo:${demoId}:${beat.id}` : `visual_demo:${demoId}`;
        VisualOrchestrator.applyVerb?.({
          verb: beat.verb,
          phase: 'visual_demo',
          source,
          overrides: {
            _extended: {
              visualDemo: demoId,
              beatId: beat.id ?? null,
              easing: beat.easing ?? null,
              durationMs: beat.durationMs ?? null,
              params: beat.params ?? null,
            },
          },
        });
      }, delay);
      timers.push(id);
    });

    const durationMs = Number(demo.durationMs ?? 0);
    const doneTimer = setTimeout(() => {
      if (scrollLocked && typeof document !== 'undefined' && document.body) {
        try {
          document.body.style.overflow = bodyOverflowPrev ?? '';
        } catch {
          // noop
        }
      }
      this._currentVisualDemo = null;
      if (DEBUG_NARRATION) {
        const finishedAt =
          (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        console.log(`[DEMO] done ${demoId}`, { elapsedMs: Math.round(finishedAt - startedAt) });
      }
    }, Math.max(0, durationMs));

    this._currentVisualDemo = {
      id: demoId,
      timers,
      doneTimer,
      scrollLocked,
      bodyOverflowPrev,
    };

    if (DEBUG_NARRATION) {
      console.log(`[DEMO] start ${demoId}`, {
        durationMs: durationMs || null,
        beats: beats.length,
        scrollLocked,
      });
    }
  }

  _emitRenderDirectiveFrame(value, { stage, phase, target }) {
    if (!this._ownsOpeningMorph) return;
    let ctx = this._renderDirectiveContext;
    if (!ctx) {
      const fallbackCount = this._latestRendererParticles?.count ?? this._getGenesisParticleCount();
      this._renderDirectiveContext = this._buildRenderDirectiveContext(fallbackCount);
      ctx = this._renderDirectiveContext;
      if (!ctx) {
        if (!this._loggedMissingDirectiveContext) {
          console.warn('[Director] Missing render directive context in opening');
          this._loggedMissingDirectiveContext = true;
        }
        return;
      }
    }
    const morph = clamp01(value);
    const stageName = stage || this.currentStage || 'genesis';
    const { pointSizeBase, pointKick, sigmaBase, sigmaPeak, tierPeak, tierSettle, particleCount, midValue, smooth, clamp } = ctx;
    const directiveSource = ctx.source || 'director:morph';

    const mid = midValue || 0.5;
    const implNorm = mid > 0 ? clamp(morph / mid, 0, 1) : 1;
    const settleNorm = (1 - mid) > 0 ? clamp((morph - mid) / (1 - mid), 0, 1) : 1;
    const easeImpl = smooth(implNorm);
    const easeSettle = smooth(Math.max(0, settleNorm));
    const inImplosion = morph < mid;

    const drawCount = inImplosion
      ? Math.max(1, Math.round(particleCount * Math.max(easeImpl, 0.05)))
      : Math.max(1, Math.round(particleCount));
    const pointSize = inImplosion
      ? pointSizeBase * (1 + (pointKick - 1) * easeImpl)
      : pointSizeBase * (pointKick - (pointKick - 1) * easeSettle);
    const gaussianSigma = inImplosion
      ? sigmaBase + (sigmaPeak - sigmaBase) * easeImpl
      : sigmaPeak - (sigmaPeak - sigmaBase) * easeSettle;
    const tierHi = inImplosion
      ? tierPeak
      : tierPeak - (tierPeak - tierSettle) * easeSettle;

    const directive = {
      source: directiveSource,
      channel: 'renderer',
      phase,
      stage: stageName,
      uMorphProgress: morph,
      morphProgress: morph, // legacy compatibility
      drawCount,
      activeCount: drawCount,
      pointSize,
      gaussianSigma,
      tierHighlight: [1, 1, 1, tierHi],
      timestamp: (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now(),
    };

    const { verb: phaseVerb, effect: phaseEffect } = resolveOpeningPhaseEffect(phase);
    directive.verb = phaseVerb || null;
    directive.effect = phaseEffect || null;

    const envelope = phase ? PHASE_DIRECTIVE_ENVELOPE[phase] : null;
    if (envelope) {
      if (envelope.motionMode !== undefined) {
        directive.uMotionMode = envelope.motionMode;
      }
      if (envelope.particlePhase !== undefined) {
        directive.uParticlePhase = envelope.particlePhase;
      }
      if (envelope.flowTurbulence !== undefined) {
        directive.uFlowTurbulence = envelope.flowTurbulence;
      }
      if (envelope.particleFlash !== undefined) {
        directive.uParticleFlash = envelope.particleFlash;
      }
      if (Array.isArray(envelope.opacity)) {
        const [minOpacity, maxOpacity] = envelope.opacity;
        directive.uOpacityMin = minOpacity;
        directive.uOpacityMax = maxOpacity;
      }
    }

    if (morph >= 0.999) {
      directive.uniforms = { uChaosSpin: 0, uTrailIntensity: 0, uTrailPersistence: 0 };
    }

    VisualOrchestrator.updateFromOpening(directive);
    console.log(
      "%c[OPENING-DIR→VO]",
      "color:#4dc9ff;font-weight:bold",
      {
        phase: directive.phase,
        verb: directive.verb,
        hasEffect: !!directive.effect,
        effect: directive.effect
      }
    );

    if (morph >= 0.995) {
      this._pendingDirectorFencepost = {
        at: directive.timestamp,
        stage: stageName,
        morph,
        phase,
        source: 'director:morph',
      };
    }
  }

  _driveOpeningMorph({ from, to, duration, source }) {
    if (!this._morphAnimationController) return;
    const safeDuration = Math.max(1, Number(duration) || 1);
    this._morphAnimationController.stop();
    this._morphAnimationController.start({
      from: clamp01(from ?? 0),
      to: clamp01(to ?? 1),
      duration: safeDuration,
      source,
    });
  }

  _animateMorphPhase({ from, to, durationMs, stage, phase, skipSignal }) {
    if (this._isOpeningSequence) {
      console.log(`🚫 [_animateMorphPhase] Disabled during opening (phase=${phase || 'unknown'})`);
      return Promise.resolve();
    }
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

    // Route stage-entry morph through MorphAnimationController (canonical MORPH_PROGRESS emitter)
    this._morphAnimationController?.stop();
    this._morphAnimationController?.start({
      from: startValue,
      to: endValue,
      duration: duration,
      // Use the same source tag as opening to satisfy single-emitter guard
      source: 'raf-timed',
    });

    // No Promise resolution needed for callers; keep signature consistent
    return Promise.resolve();
  }

  _startStageEntryMorph(stageName) {
    if (!stageName || this.isOpeningInProgress()) return;
    const entryConfig = Canonical?.scrollAndMorph?.stageEntry || {};
    const stageConfig = entryConfig?.[stageName] || {};
    const durationMs =
      Number.isFinite(stageConfig.durationMs)
        ? Math.max(0, stageConfig.durationMs)
        : Number.isFinite(entryConfig.durationMs)
          ? Math.max(0, entryConfig.durationMs)
          : 2000;
    const startValue =
      Number.isFinite(stageConfig.start)
        ? clamp01(stageConfig.start)
        : Number.isFinite(entryConfig.start)
          ? clamp01(entryConfig.start)
          : 0;
    const targetValue =
      Number.isFinite(stageConfig.target)
        ? clamp01(stageConfig.target)
        : Number.isFinite(entryConfig.target)
          ? clamp01(entryConfig.target)
          : 1;

    this._cancelMorphAnimation();
    this._animateMorphPhase({
      from: startValue,
      to: targetValue,
      durationMs,
      stage: stageName,
      phase: 'stage_entry',
      skipSignal: () => this.cancelled || this.skipRequested,
    });
  }

  _driveClimaxMorph(payload = {}) {
    const step = payload?.step || payload?.name;
    if (!step || step === 'complete') return;
    if (typeof this.isOpeningInProgress === 'function' && this.isOpeningInProgress()) return;

    const stageName = this.currentStage || payload.to || null;
    if (stageName && stageName !== 'transcendence') return;

    const durationMs = Math.max(
      1,
      Number(payload.transitionDuration) || Number(payload.duration) || 1500
    );

    this._cancelMorphAnimation();
    this._morphAnimationController?.stop();
    this._morphAnimationController?.start({
      from: 0,
      to: 1,
      duration: durationMs,
      source: OPENING_MORPH_SOURCE,
    });

    if (DEBUG_NARRATION) {
      console.log('🎬 [CLIMAX] Driving morph via MorphAnimationController', {
        step,
        durationMs,
        stage: stageName,
      });
    }
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
    this._startBeatScheduleForStage(newStage, 'stage_change');

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
    this._openingModeAnnounced = false;
    this._latestRendererFence = null;
    this._latestRendererParticles = null;
    this._latestRendererBlueprint = null;
    this._morphAnimationController?.stop();
    this._isOpeningSequence = false;

    try {
      window.__canonFencepostSeen = false;
    } catch {}

    // Unsubscribe stage blueprint listener if any
    try {
      this._stageBlueprintUnsubscribe?.();
    } catch {}
    this._stageBlueprintUnsubscribe = null;
    try {
      this._climaxStepUnsubscribe?.();
    } catch {}
    this._climaxStepUnsubscribe = null;

    return this;
  }

  async start() {
    console.log('🚀 [DIRECTOR START] Called', {
      isRunning: this.isRunning,
      hasRun: this.hasRun,
      phase: this.phase,
      timestamp: Date.now(),
    });
    this._morphAnimationController?.stop();
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

    // Proceed immediately; viewport hint will be applied when available.
    if (!this.viewportReady) {
      console.log('🎬 Director: Proceeding without waiting for ENGINE_VIEWPORT_HINT (renderer will adjust).');
      this.viewportReady = true;
      this.waitingForViewport = false;
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

    this._isOpeningSequence = true;
    try {
      await this._runSequence();
    } catch (error) {
      console.error('🎬 Director error:', error);
      this.phase = 'error';
      BeatBus.emit(EVENTS.DIRECTOR_ERROR, { error });
    } finally {
      this._isOpeningSequence = false;
      this._openingInProgress = false;
      this._detachSkipListener();
      this.isRunning = false;
      this._ownsOpeningMorph = false;
      this._renderDirectiveContext = null;
      this._detachOpeningMorphListener();
      this._pendingDirectorFencepost = null;
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
    this._renderDirectiveContext = this._buildRenderDirectiveContext(genesisCount);
    this._ownsOpeningMorph = true;
    this._attachOpeningMorphListener();
    this._pendingDirectorFencepost = null;
    this._directorFencepostSent = false;
    this._lastMorphValue = 0;
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
          if (!this._openingModeAnnounced) {
            BeatBus.emit(EVENTS.DIRECTOR_OPENING_MODE, {
              mode: 'opening_chaos',
              stage: 'genesis',
              source: 'director:opening',
              timestamp: Date.now(),
            });
            this._openingModeAnnounced = true;
          }
          BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
            mode: 'opening_chaos',
            source: 'director:opening',
            stage: 'genesis',
            target: 'genesis_opening',
            count: genesisCount,
            tierRatios: Array.isArray(Canonical?.stages?.genesis?.tierMix)
              ? Canonical.stages.genesis.tierMix
              : DIRECTOR_TIER_RATIOS,
            skipMorphAnimation: false,
            fastForward: false,
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
        const readinessResult =
          this._latestRendererFence ||
          this._latestRendererParticles ||
          this._latestRendererBlueprint ||
          null;
        console.log('✅ Skipping pre-chaos readiness wait; proceeding with chaos', {
          via:
            readinessResult?.type ||
            (this._latestRendererParticles ? 'particles' : null) ||
            (this._latestRendererBlueprint ? 'blueprint' : null) ||
            'none',
          timestamp: Date.now(),
        });
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
        : 0.3;
      if (chaosDuration > 0) {
        this._driveOpeningMorph({
          from: currentMorphValue,
          to: chaosTarget,
          duration: chaosDuration,
          source: OPENING_MORPH_SOURCE,
        });
        console.log(`🎯 [Opening Chaos] Animator owns morph (${chaosDuration}ms)`);
      }
      if (chaosDuration > 0) {
        const waitResult = await this.sleep(chaosDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
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
      const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : 0.6;
      if (coalesceDuration > 0 && hasCoalesceTarget) {
        this._driveOpeningMorph({
          from: currentMorphValue,
          to: coalesceTarget,
          duration: coalesceDuration,
          source: OPENING_MORPH_SOURCE,
        });
      }
      if (hasCoalesceTarget && coalesceDuration > 0) {
        this._driveOpeningMorph({
          from: currentMorphValue,
          to: coalesceTarget,
          duration: coalesceDuration,
          source: OPENING_MORPH_SOURCE,
        });
        console.log(`🎯 [Opening Coalesce] Animator owns morph (${coalesceDuration}ms)`);
      } else {
        emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
      }
      if (coalesceDuration > 0) {
        const waitResult = await this.sleep(coalesceDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
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
      const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : 1.0;
      if (settleDuration > 0 && hasSettleTarget) {
        this._driveOpeningMorph({
          from: currentMorphValue,
          to: settleTarget,
          duration: settleDuration,
          source: OPENING_MORPH_SOURCE,
        });
        console.log(`🎯 [Opening Settle] Animator owns morph (${settleDuration}ms)`);
      } else {
        emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
      }
      if (settleDuration > 0) {
        const waitResult = await this.sleep(settleDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }
      currentMorphValue = settleTarget;
    }

    // ───────────────── Post-settle breathing window (HELLO CURTIS locked + gentle drift)
    if (!skipTriggered && OPENING_SETTLE_HOLD_MS > 0) {
      this.phase = 'settle_hold';
      console.log(
        `   Phase: Settle hold (${OPENING_SETTLE_HOLD_MS}ms breathing window before emergence)`
      );
      const waitResult = await this.sleep(OPENING_SETTLE_HOLD_MS);
      if (handleWaitResult(waitResult) === 'cancelled') return;
    }

    if (this._ownsOpeningMorph) {
      this._ownsOpeningMorph = false;
      this._renderDirectiveContext = null;
      this._detachOpeningMorphListener();
    }

    if (skipTriggered) {
      console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
      this._morphAnimationController?.stop();
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
          : DIRECTOR_TIER_RATIOS,
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

        const fencepostFallbackMs = Math.min(2200, fencepostWaitMs);
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

          // Pattern S + single-writer: renderer emits PARTICLES_EMERGED.
          // If we have a pending payload, treat it only as diagnostic context.
          if (this._pendingDirectorFencepost && import.meta?.env?.DEV) {
            const pendingPayload = this._pendingDirectorFencepost;
            this._pendingDirectorFencepost = null;
            console.log('🎬 [Director] Waiting for renderer PARTICLES_EMERGED fencepost', {
              stage: pendingPayload?.stage,
              mode: pendingPayload?.mode,
              source: 'opening_emergence',
            });
          }

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
      console.log('🧬 Phase: Genesis stage handoff', { from: previousStage, to: toStage });

      // Pattern S + Single Writer: Director NEVER emits STAGE_CHANGE directly.
      // Director only asks the navigation layer to move stages.
      const nav =
        typeof window !== 'undefined' && window.unifiedNav && typeof window.unifiedNav.navigateToStage === 'function'
          ? window.unifiedNav
          : null;

      if (nav) {
        try {
          await nav.navigateToStage(toStage, {
            smooth: false,
            skipNarration: false,
            source: 'director_opening_handoff',
            settleMs: 450,
          });
        } catch (err) {
          console.warn('[Director] unifiedNav navigation failed; falling back', err);
        }
      } else if (typeof window !== 'undefined' && window.stageControls?.jumpToStage) {
        console.warn(
          '[Director] unifiedNav missing; using stageControls.jumpToStage fallback for genesis handoff',
        );
        window.stageControls.jumpToStage(toStage);
      } else {
        console.warn(
          '[Director] No unifiedNav or stageControls; cannot complete genesis handoff via navigation',
        );
      }

      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {}

      await this._runOpeningSchedule({ stage: toStage, source: 'opening_handoff' });

      // 🔓 Opening is officially over before we start Genesis narration.
      // NarrationController uses isOpeningInProgress() to suppress beats;
      // flip this to false so Genesis beats can flow.
      this._openingInProgress = false;

      if (!this.scrollOrchestrator) {
        this.scrollOrchestrator = new ScrollOrchestrator();
      }

      // Respect opening fencepost order: ENABLE_SCROLL → START_NARRATIVE
      BeatBus.emit(EVENTS.ENABLE_SCROLL);

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

      this._morphAnimationController?.stop();
      BeatBus.emit(EVENTS.OPENING_COMPLETE, {
        stage: 'genesis',
        source: 'director:opening',
        timestamp: Date.now(),
      });
      this._openingPrebound = false;
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

  async _runVisualSchedule({ stage = 'genesis', source = 'TheaterDirector' } = {}) {
    this._runOpeningSchedule({ stage, source });
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
    this._morphAnimationController?.stop();
    this._cancelBeatSchedule();
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

  if (!AUTOSTART_DISABLED) {
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
  } else if (import.meta?.env?.DEV) {
    console.log('🎬 Director: Auto-start disabled via __DISABLE_DIRECTOR_AUTOSTART__ flag');
  }
}

export default director;

// ── Event Contracts ──────────────────────────────────────────────────────────
export const CANON_CONTRACTS = {
  version: '1.0.1',
  events: {
    STAGE_CHANGE: {
      required: ['from', 'to', 'source'],
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
  deprecations: {},
};
