/**
 * OpeningSequenceController
 *
 * Manages the complete opening timeline:
 * Black → Cursor → Terminal → Fill → Chaos → Coalesce → Settle → Emergence
 *
 * Extracted from TheaterDirector for code splitting.
 * Controller relies on TheaterDirector infrastructure (sleep, waiters, emitters).
 */

import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import SST from '@/config/sst-loader.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';
import ScrollOrchestrator from '@/theater/ScrollOrchestrator.js';
import stateCommands from '@/state/commands/StateCommands.js';

const DEBUG_OPENING = true;

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

const DEFAULT_OPENING_EMERGENCE = {
  target: 'constellation',
  mode: 'emergence',
  source: 'viewportSpread',
};

const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

export class OpeningSequenceController {
  constructor(director) {
    this.director = director;
    this.running = false;
    this.cancelled = false;
    this.skipRequested = false;
    this._skipOrigin = null;

    if (DEBUG_OPENING) {
      console.log('🎬 [OpeningSequenceController] Module constructed');
    }
  }

  /**
   * Resolve opening configuration by merging defaults with SST timeline data.
   */
  getOpeningConfig() {
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

  /**
   * Calculate total typing duration for a typing config.
   */
  calculateTypingDuration(typingConfig) {
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

  /**
   * Request skip (controller-level).
   */
  requestSkip(origin = 'keyboard') {
    if (this.skipRequested) return;
    this.skipRequested = true;
    this._skipOrigin = origin;
    if (DEBUG_OPENING) {
      console.log(`🎬 [OpeningSequenceController] Skip requested via ${origin}`);
    }
  }

  /**
   * Cancel running sequence.
   */
  cancel() {
    if (!this.running) return;
    if (DEBUG_OPENING) {
      console.log('🎬 [OpeningSequenceController] Cancelling sequence');
    }
    this.cancelled = true;
    this.running = false;
  }

  /**
   * Run the complete opening sequence.
   */
  async runSequence() {
    if (DEBUG_OPENING) {
      console.log('🎬 [OpeningSequenceController] Starting sequence');
    }

    this.running = true;
    this.cancelled = false;
    this.skipRequested = false;

    const opening = this.getOpeningConfig();
    const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};

    // Phase configuration
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
    const cursorBlinkCount = Math.max(
      0,
      Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount),
    );
    const cursorIntervalMs = Math.max(
      0,
      Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs),
    );
    const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;

    const typingConfig = {
      ...DEFAULT_OPENING_TIMELINE.typing,
      ...(timeline?.typing ?? {}),
    };
    typingConfig.lines =
      Array.isArray(typingConfig.lines) && typingConfig.lines.length
        ? typingConfig.lines
        : DEFAULT_OPENING_TIMELINE.typing.lines;
    typingConfig.typeSpeed = Math.max(
      0,
      Number(typingConfig.typeSpeed ?? DEFAULT_OPENING_TIMELINE.typing.typeSpeed),
    );
    typingConfig.lineDelay = Math.max(
      0,
      Number(typingConfig.lineDelay ?? DEFAULT_OPENING_TIMELINE.typing.lineDelay),
    );
    typingConfig.completionDelayMs = Math.max(
      0,
      Number(
        typingConfig.completionDelayMs ??
          typingConfig.completionDelay ??
          DEFAULT_OPENING_TIMELINE.typing.completionDelayMs ??
          0,
      ),
    );
    const typingDuration = this.calculateTypingDuration(typingConfig);

    const fillConfig = {
      ...DEFAULT_OPENING_TIMELINE.fill,
      ...(timeline?.fill ?? {}),
    };
    fillConfig.durationMs = Math.max(
      0,
      Number(fillConfig.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs),
    );
    fillConfig.scrollSpeed = Math.max(
      0,
      Number(fillConfig.scrollSpeed ?? DEFAULT_OPENING_TIMELINE.fill.scrollSpeed),
    );
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
    const shouldWaitForFencepost = waitForFencepost && !this.director._openingPrebound;
    const stabilizeMs = Math.max(
      0,
      Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
    );
    const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
    const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
    const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;

    const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
    const genesisCount = this.director._getGenesisParticleCount();
    const skipLabel = skipKey ?? 'SPACE';

    this.director._attachSkipListener?.(skipKey);

    let skipTriggered = false;
    const handleWaitResult = (result) => {
      if (result === 'cancelled' || this.director.cancelled || this.cancelled) return 'cancelled';
      if (result === 'skipped' || this.director.skipRequested || this.skipRequested) skipTriggered = true;
      return null;
    };

    const morphStage = 'genesis';
    let currentMorphValue = 0;
    const emitMorphSnapshot = (value, phase, target = value, durationMs = 0) => {
      this.director.morphAnimator?.emitSnapshot?.(value, phase, target, durationMs, morphStage);
    };
    const animateMorph = (from, to, durationMs, phase) =>
      this.director.morphAnimator?.animate({
        from,
        to,
        duration: durationMs,
        stage: morphStage,
        phase,
        skipSignal: () => skipTriggered || this.director.skipRequested || this.skipRequested || this.cancelled,
      });

    try {
      this.director.phase = 'black';
      console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
      if (blackoutDuration > 0) {
        const waitResult = await this.director.sleep(blackoutDuration);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }
      if (skipTriggered) {
        console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
      }

      if (!skipTriggered) {
        this.director.phase = 'cursor';
        console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
        BeatBus.emit(EVENTS.CURSOR_SHOW);
        BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
        if (cursorLeadInMs > 0) {
          const waitResult = await this.director.sleep(cursorLeadInMs);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
        if (!skipTriggered) {
          BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
          if (cursorSettleMs > 0) {
            const waitResult = await this.director.sleep(cursorSettleMs);
            if (handleWaitResult(waitResult) === 'cancelled') return;
          }
        }
      }

      if (!skipTriggered) {
        this.director.phase = 'terminal';
        console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
        BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
        if (typingDuration > 0) {
          const waitResult = await this.director.sleep(typingDuration);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
        if (typingConfig.completionDelayMs > 0) {
          const waitResult = await this.director.sleep(typingConfig.completionDelayMs);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
      }

      if (!skipTriggered) {
        this.director.phase = 'fill';
        console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
        BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
        if (fillConfig.durationMs > 0) {
          const waitResult = await this.director.sleep(fillConfig.durationMs);
          if (handleWaitResult(waitResult) === 'cancelled') return;
        }
      }

      if (!skipTriggered && chaosConfig?.enabled !== false) {
        console.log('🔍 [ABOUT TO START CHAOS]', {
          chaosConfig,
          currentMorph: currentMorphValue,
          timestamp: Date.now(),
        });
        if (!this.director._openingPrebound) {
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
            this.director._openingPrebound = true;
          } catch (bindError) {
            console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
          }
          const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
          if (bindSettleMs > 0) {
            const waitResult = await this.director.sleep(bindSettleMs);
            if (handleWaitResult(waitResult) === 'cancelled') return;
          }
        }

        if (!this.director._preChaosReady) {
          const readinessResult = await Promise.race([
            this.director
              ._waitForEvent(EVENTS.PARTICLES_EMERGED, {
                timeout: 1200,
                predicate: (payload = {}) => {
                  const stageName = payload?.stage || payload?.stageName;
                  return !payload || stageName === 'genesis';
                },
              })
              .then((payload) => ({ type: 'particles', payload })),
            this.director
              ._waitForEvent(EVENTS.BLUEPRINT_READY, {
                timeout: 1200,
                predicate: (payload = {}) => {
                  const blueprint = payload?.blueprint ?? payload;
                  const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
                  const mode = payload?.mode || blueprint?.mode;
                  return stageName === 'genesis' && mode !== 'emergence';
                },
              })
              .then((payload) => ({ type: 'blueprint', payload })),
          ]);

          if (!readinessResult) {
            console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
          } else {
            console.log('✅ Blueprint bound and particles ready', {
              via: readinessResult.type,
              timestamp: Date.now(),
            });
          }
          this.director._preChaosReady = true;
        }

        const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
        this.director.phase = 'chaos';
        console.log(`   Phase: Chaos (${chaosDuration}ms)`);
        BeatBus.emit(EVENTS.PARTICLE_PHASE, {
          name: 'chaos',
          duration: chaosDuration,
          rendererSpin: chaosConfig.rendererSpin || null,
        });
        const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
        const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
        if (chaosDuration > 0) {
          const waitResult = await this.director.sleep(chaosDuration);
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
        this.director.phase = 'coalesce';
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
          const waitResult = await this.director.sleep(coalesceDuration);
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
        this.director.phase = 'settle';
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
          const waitResult = await this.director.sleep(settleDuration);
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
        this.director.morphAnimator?.cancelAll?.();
      }

      this.director.phase = 'emergence';
      const reusePreboundBlueprint = this.director._openingPrebound === true;
      console.log(
        `   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`,
      );

      const viewportHint = await this.director._ensureViewportHint();

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

      this.director.emitTune({
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
        if (!this.director._fencepostReadyEmitted) {
          const readyPayload = {
            at: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
            phase: 'opening',
          };
          BeatBus.emit(EVENTS.FENCEPOST_LISTENERS_READY, readyPayload);
          this.director._fencepostReadyEmitted = true;
        }

        const fencepostFallbackMs = Math.min(1200, fencepostWaitMs);
        const fencepostReceived = await new Promise((resolve) => {
          let resolved = false;
          let fenceTimeoutId = null;
          let blueprintTimeoutId = null;

          const finish = (result) => {
            if (resolved) return;
            resolved = true;
            this.director._clearTimer?.(fenceTimeoutId);
            this.director._clearTimer?.(blueprintTimeoutId);
            fenceOff?.();
            blueprintOff?.();
            resolve(result);
          };

          const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
            console.log('   Received: PARTICLES_EMERGED');
            finish({ type: 'fencepost', payload });
          });

          fenceTimeoutId = this.director._trackTimer?.(() => {
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

          blueprintTimeoutId = this.director._trackTimer?.(() => {
            blueprintOff?.();
          }, fencepostFallbackMs);
        });

        if (!fencepostReceived) {
          console.warn('   Renderer fencepost timeout, continuing anyway');
        }
        if (this.director.cancelled || this.cancelled) return;
      }

      if (!skipTriggered && stabilizeMs > 0) {
        const waitResult = await this.director.sleep(stabilizeMs);
        if (handleWaitResult(waitResult) === 'cancelled') return;
      }

      const toStage = 'genesis';
      this.director.phase = 'genesis';
      const previousStage = this.director.currentStage ?? 'emergence';
      console.log('🧬 Phase: Genesis stage handoff');

      stateCommands.requestStageChange(toStage, {
        reason: 'opening_sequence_handoff',
        previousStage,
        skipBlueprint: skipGenesisBlueprint,
        preserveEmergence: true,
        targetState,
      });

      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {}

      await this.director._runVisualSchedule?.();

      this.director.emitTune({
        breathingAmp: 0.02,
        breathingPeriodSec: 4,
        flareProb: 0.02,
        flareGain: 1.3,
        tierSpeedScale: [1.0, 0.8, 0.6, 0.4],
        pulseOnce: 1,
      });

      BeatBus.emit(EVENTS.ENABLE_SCROLL);
      this.director._openingPrebound = false;

      if (!this.director.scrollOrchestrator) {
        this.director.scrollOrchestrator = new ScrollOrchestrator();
      }
      this.director.scrollOrchestrator.start?.();
      this.director.monitorFragments?.();

      this.director.phase = 'complete';

      if (DEBUG_OPENING && typeof performance !== 'undefined' && typeof performance.now === 'function') {
        const timestamp = performance.now();
        console.log('✅ [OPENING COMPLETE]', {
          nextStage: 'discipline',
          shouldAutoAdvance: true,
          timestamp,
        });
      }

      const elapsed = Date.now() - this.director.startTime;
      console.log('🎬 Director: Opening complete → enabling auto-advance');
      this.director.handleOpeningComplete?.({ skipTriggered, opening, elapsed });
    } finally {
      this.director._detachSkipListener?.();
      this.running = false;
    }
  }
}

export default OpeningSequenceController;
