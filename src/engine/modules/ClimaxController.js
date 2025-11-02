import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import {
  generatePortraitPositions,
  generateQRPositions,
  generateScatterPositions,
} from '@/utils/portraitPositions.js';
import { emitBlueprintReady } from '../utils/blueprintUtils.js';
import qrCurtis from '@/assets/climax/qr-curtis.json';

const QR_SCALE = 40;

const CURATED_QR_POINTS = (() => {
  if (Array.isArray(qrCurtis?.points)) return new Float32Array(qrCurtis.points);
  if (Array.isArray(qrCurtis?.positions)) return new Float32Array(qrCurtis.positions);
  return null;
})();

const CURATED_QR_META = {
  moduleCount: Number.isFinite(qrCurtis?.moduleCount)
    ? qrCurtis.moduleCount
    : Number.isFinite(qrCurtis?.size)
      ? qrCurtis.size
      : undefined,
  moduleSize: Number.isFinite(qrCurtis?.moduleSize) ? qrCurtis.moduleSize : undefined,
  quietZone: Number.isFinite(qrCurtis?.quietZone) ? qrCurtis.quietZone : undefined,
};

const clamp = (value, min, max) => {
  const bounded = value < min ? min : value > max ? max : value;
  return Number.isFinite(bounded) ? bounded : min;
};

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

function createInitialState() {
  return {
    active: false,
    currentStep: null,
    stepIndex: -1,
    stepStartTime: 0,
    stepTransitionStart: 0,
    holdDuration: 0,
    transitionDuration: 0,
    progress: 0,
    phase: 'idle',
    previousPositions: null,
    rafId: null,
    usesRAF: false,
    lastMorphValue: null,
    holdStartTime: 0,
  };
}

class ClimaxController {
  #engine;
  #state;
  #steps;
  #pendingQrMetadata;

  constructor(engine) {
    this.#engine = engine;
    this.#state = createInitialState();
    this.#steps = [];
    this.#pendingQrMetadata = null;
    console.log('🎬 [ClimaxController] Module loaded');
  }

  startClimaxSequence() {
    if (typeof window === 'undefined') return;

    if (this.#engine.currentStage !== 'transcendence') {
      console.warn(`🎬 Climax trigger ignored — current stage is "${this.#engine.currentStage}"`);
      return;
    }

    if (this.#state.active) {
      console.warn('🎬 Climax already active, ignoring duplicate trigger');
      return;
    }

    this.#stopLoop();

    const transitions = Canonical?.visual?.transitions || {};
    const transitionTimings = {
      dissolveDuration: Number(transitions?.dissolveDuration) || 1500,
      reformDuration: Number(transitions?.reformDuration) || 1500,
      silenceDuration: Number(transitions?.silenceDuration) || 500,
    };

    const canonicalSequence = Canonical?.stages?.transcendence?.memoryFragments?.climax?.sequence;
    const fallbackSequence = [
      { action: 'dissolve', duration: 2000 },
      { action: 'formPortrait', duration: 3000 },
      { action: 'reformText', text: 'CURTIS WHORTON', duration: 2000 },
      { action: 'reformText', text: 'AI-NATIVE ENGINEER', duration: 2000 },
      { action: 'formQRCode', url: 'https://curtiswhorton.com', duration: 3000 },
    ];

    const sourceSequence =
      Array.isArray(canonicalSequence) && canonicalSequence.length
        ? canonicalSequence
        : fallbackSequence;

    this.#steps = sourceSequence.map((entry, index) => {
      const actionType = entry.action || entry.name || `step_${index}`;
      const holdDuration = Number(entry.duration) || transitionTimings.silenceDuration;
      const transitionDuration =
        actionType === 'dissolve'
          ? transitionTimings.dissolveDuration
          : transitionTimings.reformDuration;

      let name = actionType;
      switch (actionType) {
        case 'formPortrait':
          name = 'portrait';
          break;
        case 'reformText': {
          const upper = (entry.text || '').toUpperCase();
          name = upper.includes('ENGINEER') ? 'title' : 'name';
          break;
        }
        case 'formQRCode':
          name = 'qr';
          break;
        case 'dissolve':
          name = 'dissolve';
          break;
        default:
          name = actionType;
      }

      return {
        name,
        action: actionType,
        holdDuration,
        transitionDuration,
        text: entry.text ?? null,
        url: entry.url ?? null,
      };
    });

    console.log('🎬 ConsciousnessEngine: Starting climax sequence');

    const state = this.#state;
    Object.assign(state, createInitialState());
    state.active = true;
    state.stepIndex = 0;
    state.stepStartTime = now();
    state.stepTransitionStart = state.stepStartTime;

    this.#log('climax_start', { steps: this.#steps.length });
    this.#prepareStep(0, state.stepStartTime);
    this.#scheduleFrame();
  }

  stopClimaxSequence({ emitComplete = false } = {}) {
    this.#finalizeSequence({ emitComplete, reason: 'user-stop' });
  }

  getState() {
    const state = this.#state;
    return {
      active: state.active,
      currentStep: state.currentStep,
      totalSteps: this.#steps.length,
      morphProgress: state.progress,
    };
  }

  #prepareStep(stepIndex, timestamp) {
    const state = this.#state;
    if (!state.active) return;

    if (stepIndex >= this.#steps.length) {
      this.#finalizeSequence({ emitComplete: true, reason: 'sequence-complete' });
      return;
    }

    const step = this.#steps[stepIndex];
    const holdDuration = Math.max(0, Number(step.holdDuration) || 0);
    const transitionDuration = Math.max(1, Number(step.transitionDuration) || 1);
    const startTime = timestamp ?? now();

    state.stepIndex = stepIndex;
    state.currentStep = step.name;
    state.stepStartTime = startTime;
    state.stepTransitionStart = startTime;
    state.holdDuration = holdDuration;
    state.transitionDuration = transitionDuration;
    state.phase = 'transition';
    state.progress = 0;
    state.lastMorphValue = null;
    state.holdStartTime = 0;

    this.#log('climax_step', {
      step: step.name,
      hold: holdDuration,
      transition: transitionDuration,
      index: stepIndex,
    });

    BeatBus.emit(EVENTS.CLIMAX_STEP, {
      step: step.name,
      holdDuration,
      transitionDuration,
      text: step.text ?? null,
      url: step.url ?? null,
      stepIndex,
    });

    this.#buildStepBlueprint(step);
    this.#emitProgress(0, step, stepIndex);
  }

  #emitProgress(progress, step, stepIndex) {
    const state = this.#state;
    if (!state.active) return;

    const clamped = clamp(progress, 0, 1);
    if (state.lastMorphValue != null && clamped < 1 && Math.abs(state.lastMorphValue - clamped) < 1e-3) {
      return;
    }
    state.lastMorphValue = clamped;

    const stageLabel = this.#engine.currentStage || 'transcendence';
    const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : null;
    const stageIndex = stageOrder ? stageOrder.indexOf(stageLabel) : -1;

    const stateCommands = typeof window !== 'undefined' ? window.stateCommands : null;
    if (stateCommands?.setMorphProgress) {
      stateCommands.setMorphProgress(clamped, {
        origin: 'climax-transition',
        stage: stageLabel,
        stageIndex: stageIndex >= 0 ? stageIndex : undefined,
        postMorphFreeze: clamped >= 1 ? 1 : 0,
        step: step?.name,
        stepIndex,
      });
    } else {
      console.warn('[ClimaxController] StateCommands not available, cannot emit MORPH_PROGRESS');
    }
  }

  #runFrame() {
    const state = this.#state;
    if (!state.active) return;

    const step = this.#steps[state.stepIndex];
    if (!step) {
      this.#finalizeSequence({ emitComplete: true, reason: 'sequence-missing-step' });
      return;
    }

    const currentTime = now();

    if (state.phase === 'transition') {
      const raw = Math.min((currentTime - state.stepTransitionStart) / state.transitionDuration, 1);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      state.progress = eased;

      if (raw < 1) {
        this.#emitProgress(eased, step, state.stepIndex);
      } else {
        this.#emitProgress(1, step, state.stepIndex);
        const nextIndex = state.stepIndex + 1;
        if (state.holdDuration > 0) {
          state.phase = 'postHold';
          state.holdStartTime = currentTime;
        } else if (nextIndex >= this.#steps.length) {
          this.#finalizeSequence({ emitComplete: true, reason: 'sequence-complete' });
          return;
        } else {
          this.#prepareStep(nextIndex, currentTime);
        }
      }
    } else if (state.phase === 'postHold') {
      const holdElapsed = currentTime - state.holdStartTime;
      if (holdElapsed >= state.holdDuration) {
        const nextIndex = state.stepIndex + 1;
        if (nextIndex >= this.#steps.length) {
          this.#finalizeSequence({ emitComplete: true, reason: 'sequence-complete' });
          return;
        }
        this.#prepareStep(nextIndex, currentTime);
      }
    }

    this.#scheduleFrame();
  }

  #scheduleFrame() {
    const state = this.#state;
    if (!state.active) return;

    if (typeof requestAnimationFrame === 'function') {
      state.usesRAF = true;
      state.rafId = requestAnimationFrame(() => this.#runFrame());
    } else {
      state.usesRAF = false;
      state.rafId = setTimeout(() => this.#runFrame(), 16);
    }
  }

  #stopLoop() {
    const state = this.#state;
    if (state.rafId == null) return;

    if (state.usesRAF && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(state.rafId);
    } else {
      clearTimeout(state.rafId);
    }

    state.rafId = null;
    state.usesRAF = false;
  }

  #buildStepBlueprint(step) {
    const particleCount = this.#resolveParticleCount();
    if (!particleCount) {
      console.warn('🧠 Engine: Unable to resolve particle count for climax');
      return;
    }

    let positions;
    try {
      const actionType = step.action || step.name;
      switch (actionType) {
        case 'dissolve': {
          const spread = { x: 60, y: 45, z: 15 };
          positions = generateScatterPositions(particleCount, spread);
          break;
        }
        case 'formPortrait':
        case 'portrait':
          positions = generatePortraitPositions(particleCount);
          break;
        case 'reformText':
        case 'name':
        case 'title':
          positions =
            this.#generateClimaxTextPositions(step.text, particleCount) ||
            generateScatterPositions(particleCount);
          break;
        case 'formQRCode':
        case 'qr': {
          const url = String(step?.url || '');

          let basePositions;
          if (CURATED_QR_POINTS instanceof Float32Array && CURATED_QR_POINTS.length) {
            basePositions = CURATED_QR_POINTS;
          } else {
            console.warn('[QR] curated asset missing; using generated fallback');
            basePositions = generateQRPositions(particleCount);
          }

          const scaled = new Float32Array(basePositions.length);
          for (let i = 0; i < basePositions.length; i += 3) {
            scaled[i] = basePositions[i] * QR_SCALE;
            scaled[i + 1] = basePositions[i + 1] * QR_SCALE;
            scaled[i + 2] = basePositions[i + 2] * QR_SCALE;
          }

          positions = scaled;
          this.#pendingQrMetadata = {
            url,
            moduleCount: CURATED_QR_META.moduleCount ?? null,
            moduleSize: CURATED_QR_META.moduleSize ?? undefined,
            quietZone: CURATED_QR_META.quietZone ?? 4,
            positions: scaled,
          };
          break;
        }
        default:
          positions = generateScatterPositions(particleCount);
      }
    } catch (error) {
      console.error('🧠 Engine: Climax formation generation failed', {
        step: step.name,
        action: step.action,
        error,
      });
      positions = generateScatterPositions(particleCount);
    }

    if (!(positions instanceof Float32Array)) {
      console.warn('🧠 Engine: Invalid climax positions array, falling back to scatter');
      positions = generateScatterPositions(particleCount);
    }

    const actionName = (step.action || step.name || '').toLowerCase();
    const isQrStep = actionName === 'formqrcode' || actionName === 'qr';
    const effectiveCount =
      isQrStep && positions instanceof Float32Array
        ? Math.max(0, Math.floor(positions.length / 3))
        : particleCount;

    const blueprint = this.#buildBlueprintFromPositions(step, positions, effectiveCount);
    if (!blueprint) return;

    if (isQrStep) {
      const qrMeta = this.#pendingQrMetadata || {};
      const qrPositions = qrMeta.positions instanceof Float32Array
        ? qrMeta.positions
        : blueprint.text3DPositions instanceof Float32Array
          ? blueprint.text3DPositions
          : null;

      if (qrPositions) {
        const copy = qrPositions.slice();
        const copy2 = qrPositions.slice();
        blueprint.text3DPositions = copy;
        blueprint.atmosphericPositions = copy2;
        blueprint.positions = qrPositions.slice();
        blueprint.particleCount = qrPositions.length / 3;
        blueprint.activeCount = blueprint.particleCount;
      }

      blueprint.metadata = {
        ...(blueprint.metadata || {}),
        qrMode: true,
        url: qrMeta.url ?? step.url ?? null,
        moduleCount: qrMeta.moduleCount ?? undefined,
        quietZone: qrMeta.quietZone ?? undefined,
      };
    }

    this.#pendingQrMetadata = null;

    const emitPayload = {
      stage: 'transcendence',
      quality: this.#engine.currentQuality,
      mode: `climax:${step.name}`,
      duration: step.holdDuration,
      transitionDuration: step.transitionDuration,
      timestamp: now(),
      text: step.text ?? null,
      action: step.action ?? step.name,
      url: step.url ?? null,
      cached: false,
      cacheKey: this.#engine._cacheKey('transcendence', this.#engine.currentQuality),
    };

    emitBlueprintReady(BeatBus, EVENTS, blueprint, emitPayload);
    this.#log('climax_blueprint_emitted', { step: step.name, particleCount });
  }

  #buildBlueprintFromPositions(step, targetPositions, particleCount) {
    const totalFloats = particleCount * 3;
    if (!(targetPositions instanceof Float32Array) || targetPositions.length !== totalFloats) {
      console.error('🧠 Engine: Climax blueprint target length mismatch', {
        expected: totalFloats,
        received: targetPositions?.length ?? 0,
        step: step?.name,
      });
      return null;
    }

    const randomSeeds = (arr) => {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = Math.random();
      }
    };
    const randomScalar = (arr, base, span) => {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = base + Math.random() * span;
      }
    };

    const source = this.#engine._lastBlueprint;
    let fromPositions;

    if (this.#state.previousPositions instanceof Float32Array &&
        this.#state.previousPositions.length === totalFloats) {
      fromPositions = this.#state.previousPositions.slice();
    } else if (source?.text3DPositions instanceof Float32Array &&
               source.text3DPositions.length === totalFloats) {
      fromPositions = source.text3DPositions.slice();
    } else if (source?.atmosphericPositions instanceof Float32Array &&
               source.atmosphericPositions.length === totalFloats) {
      fromPositions = source.atmosphericPositions.slice();
    } else {
      fromPositions = generateScatterPositions(particleCount);
    }

    if (fromPositions.length !== totalFloats) {
      const fallback = new Float32Array(totalFloats);
      fallback.set(fromPositions.subarray(0, Math.min(fromPositions.length, totalFloats)));
      fromPositions = fallback;
    }

    const cloneOrCreate = (attr, length, filler) => {
      if (attr instanceof Float32Array && attr.length === length) {
        return attr.slice();
      }
      const arr = new Float32Array(length);
      if (typeof filler === 'function') filler(arr);
      return arr;
    };

    const palette = ['#ffffff', '#f59e0b', '#00ffcc'];
    const animationSeeds = cloneOrCreate(source?.animationSeeds, totalFloats, randomSeeds);
    const sizeMultipliers = cloneOrCreate(
      source?.sizeMultipliers,
      particleCount,
      (arr) => randomScalar(arr, 0.8, 0.4),
    );
    const opacityData = cloneOrCreate(
      source?.opacityData,
      particleCount,
      (arr) => randomScalar(arr, 0.55, 0.4),
    );
    const atlasIndices = cloneOrCreate(source?.atlasIndices, particleCount, (arr) => {
      for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
    });
    const tierData = cloneOrCreate(source?.tierData, particleCount, (arr) => {
      for (let i = 0; i < arr.length; i += 1) arr[i] = 2;
    });

    const metadata = {
      ...(source?.metadata || {}),
      climaxStep: step.name,
      climaxAction: step.action ?? step.name,
      climaxTimestamp: now(),
      climaxText: step.text ?? null,
      climaxUrl: step.url ?? null,
      climaxHoldMs: step.holdDuration,
      climaxTransitionMs: step.transitionDuration,
      colors: palette,
    };

    const blueprint = {
      stageName: 'transcendence',
      particleCount,
      activeCount: particleCount,
      maxParticles: Math.max(source?.maxParticles || particleCount, particleCount),
      positions: fromPositions.slice(),
      atmosphericPositions: fromPositions,
      text3DPositions: targetPositions.slice(),
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata,
      mode: `climax:${step.name}`,
      climaxStep: step.name,
      colors: palette,
      hotspotMap: {},
      hotspotLookup: null,
    };

    this.#engine._lastBlueprint = blueprint;
    this.#state.previousPositions = blueprint.text3DPositions.slice();
    return blueprint;
  }

  #finalizeSequence({ emitComplete, reason }) {
    const state = this.#state;
    this.#stopLoop();

    if (!state.active && !emitComplete) {
      Object.assign(state, createInitialState());
      this.#steps = [];
      this.#pendingQrMetadata = null;
      return;
    }

    const wasActive = state.active;

    Object.assign(state, createInitialState());
    this.#steps = [];
    this.#pendingQrMetadata = null;

    if (wasActive) {
      this.#log('climax_complete', { reason });
      console.log('🎬 Climax sequence complete');
      if (emitComplete) {
        BeatBus.emit(EVENTS.CLIMAX_STEP, { step: 'complete' });
      }
    }
  }

  #resolveParticleCount() {
    const stageConfig = Canonical?.stages?.transcendence || {};
    const baseFromStage = Number.isFinite(stageConfig.particleCount)
      ? stageConfig.particleCount
      : Number.isFinite(stageConfig.particlesBase)
        ? stageConfig.particlesBase
        : 15000;
    const baseFromLast = Number.isFinite(this.#engine._lastBlueprint?.particleCount)
      ? this.#engine._lastBlueprint.particleCount
      : baseFromStage;

    try {
      return this.#engine.getParticleCountForQuality(baseFromLast, this.#engine.currentQuality || 'HIGH');
    } catch (error) {
      console.warn('🧠 Engine: Unable to scale climax particle count by quality', error);
      return baseFromLast;
    }
  }

  #generateClimaxTextPositions(text, particleCount) {
    if (!text) return null;
    try {
      const positions = this.#engine.generate3DTextFormation(text, { particles: particleCount, depth: 0.25 });
      if (positions instanceof Float32Array && positions.length === particleCount * 3) {
        return positions;
      }
    } catch (error) {
      console.warn('🧠 Engine: Climax text formation failed', { text, error });
    }
    return null;
  }

  #log(type, payload = {}) {
    if (typeof this.#engine._log === 'function') {
      this.#engine._log(type, payload);
    }
  }
}

export default ClimaxController;
