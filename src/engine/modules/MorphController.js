import { VC } from '@/config/visual-controls.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { trace } from '@/dev/trace.js';

const DEFAULT_PHASE_DURATIONS = Object.freeze({
  implosion: 1100,
  coalesce: 250,
  settle: 900,
});

const nowMs = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const scheduleFrame = (fn) =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16);

const cancelFrame = (handle) => {
  if (handle == null) return;
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(handle);
  else clearTimeout(handle);
};

const smoothstep = (t) => t * t * (3 - 2 * t);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class MorphController {
  #engine;
  #phaseDurations;
  #rafId = null;
  #phase = null;
  #startTime = 0;
  #phaseDuration = 0;
  #midValue = 0;
  #holdMs = 0;
  #count = 0;
  #fastForward = false;

  constructor(engine) {
    this.#engine = engine;
    this.#phaseDurations = { ...DEFAULT_PHASE_DURATIONS };
    console.log('🌀 [MorphController] Module loaded');
  }

  /**
   * Begin the emergence timeline (implosion → coalesce → settle).
   * Mirrors the legacy behaviour from ConsciousnessEngine._startEmergenceTimeline.
   * @returns {boolean} true when the timeline starts, false otherwise.
   */
  startEmergenceTimeline(blueprint) {
    const engine = this.#engine;
    const count = blueprint?.activeCount || blueprint?.particleCount || 0;

    if (blueprint?.mode === 'opening_chaos') {
      engine._emergenceActive = false;
      engine._emergenceDone = false;
      return false;
    }
    if (!count || typeof window === 'undefined') {
      engine._emergenceActive = false;
      engine._emergenceDone = false;
      return false;
    }

    this.#count = count;
    this.#fastForward = !!(blueprint?.fastForward || blueprint?.metadata?.fastForward);
    this.#holdMs = Math.max(0, Number(VC?.MORPH_HOLD_MS ?? 250));

    const implDefault = (() => {
      const raw = Number(VC?.IMPLODE_MS);
      return Number.isFinite(raw) && raw > 0 ? raw : this.#phaseDurations.implosion;
    })();
    const settleDefault = (() => {
      const raw = Number(VC?.SETTLE_MS);
      return Number.isFinite(raw) && raw >= 0 ? raw : this.#phaseDurations.settle;
    })();

    const fastImpl = (() => {
      const raw = Number(VC?.SKIP_IMPL_MS);
      const target = Number.isFinite(raw) && raw > 0 ? raw : 320;
      return Math.max(120, Math.min(target, implDefault));
    })();
    const fastSettle = (() => {
      const raw = Number(VC?.SKIP_SETTLE_MS);
      const target = Number.isFinite(raw) && raw >= 0 ? raw : 260;
      return Math.max(90, Math.min(target, settleDefault));
    })();

    const implMs = this.#fastForward ? fastImpl : implDefault;
    const settleMs = this.#fastForward ? fastSettle : settleDefault;
    const midDefault = clamp(Number.isFinite(VC?.MID_MORPH) ? VC.MID_MORPH : 0.85, 0.05, 0.95);
    this.#midValue = this.#fastForward ? clamp(Math.min(midDefault, 0.35), 0.05, 0.5) : midDefault;

    console.log('🎨 [EMERGENCE TIMELINE]', {
      fastForward: this.#fastForward,
      midDefault,
      midForTimeline: this.#midValue,
      implMs,
      settleMs,
      holdMs: this.#holdMs,
    });
    if (implMs > 6000 || settleMs > 6000) {
      console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: this.#midValue });
    }

    if (engine._emergenceRaf) {
      cancelFrame(engine._emergenceRaf);
      engine._emergenceRaf = null;
    }
    cancelFrame(this.#rafId);
    this.#rafId = null;

    engine._emergenceActive = true;
    engine._emergenceDone = false;
    this.#phase = 'implosion';
    this.#phaseDuration = implMs;
    this.#startTime = nowMs();

    this.#emitMorphProgress(0, this.#midValue);
    trace('[MorphController] Emergence timeline started', { count });

    this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
    engine._emergenceRaf = this.#rafId;
    return true;
  }

  /**
   * Cancel the current emergence timeline (if any).
   */
  stopEmergenceTimeline({ markDone = false } = {}) {
    cancelFrame(this.#rafId);
    this.#rafId = null;

    const engine = this.#engine;
    if (engine._emergenceRaf) {
      cancelFrame(engine._emergenceRaf);
      engine._emergenceRaf = null;
    }

    engine._emergenceActive = false;
    if (markDone) {
      engine._emergenceDone = true;
    } else {
      engine._emergenceDone = false;
    }
    this.#phase = null;
    this.#startTime = 0;
    this.#phaseDuration = 0;
  }

  /**
   * Returns whether an emergence timeline is currently active.
   */
  isActive() {
    return !!this.#engine._emergenceActive;
  }

  /**
   * Returns the current emergence phase (`implosion`, `coalesce`, `settle`, or null).
   */
  getCurrentPhase() {
    return this.#phase;
  }

  /**
   * Returns snapshot information about the timeline.
   */
  getState() {
    return {
      active: this.isActive(),
      phase: this.#phase,
      startTime: this.#startTime,
      phaseDuration: this.#phaseDuration,
      midValue: this.#midValue,
      count: this.#count,
    };
  }

  /**
   * Override default phase durations.
   */
  setPhaseDurations(durations = {}) {
    this.#phaseDurations = {
      ...this.#phaseDurations,
      ...Object.keys(durations).reduce((acc, key) => {
        if (durations[key] != null) acc[key] = durations[key];
        return acc;
      }, {}),
    };
  }

  #runFrame(implMs, settleMs) {
    const engine = this.#engine;
    if (!engine._emergenceActive || engine._rendererFencepostSeen) {
      this.#rafId = null;
      engine._emergenceRaf = null;
      return;
    }

    const elapsed = nowMs() - this.#startTime;
    if (elapsed < this.#holdMs) {
      this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
      engine._emergenceRaf = this.#rafId;
      return;
    }

    const phaseElapsed = elapsed - this.#holdMs;
    const inImplosion = implMs > 0 ? phaseElapsed < implMs : false;
    const implPhase = implMs > 0 ? clamp(phaseElapsed / implMs, 0, 1) : 1;
    const settleElapsed = phaseElapsed - implMs;
    const settlePhaseRaw =
      settleElapsed <= 0 ? 0 : settleMs > 0 ? clamp(settleElapsed / settleMs, 0, 1) : 1;
    const easeImpl = implMs > 0 ? smoothstep(implPhase) : 1;
    const easeSettle = settlePhaseRaw <= 0 ? 0 : smoothstep(settlePhaseRaw);

    const morph = inImplosion
      ? this.#midValue * easeImpl
      : this.#midValue + (1 - this.#midValue) * easeSettle;

    this.#emitMorphProgress(+morph.toFixed(3), inImplosion ? this.#midValue : 1);

    if (phaseElapsed >= implMs + settleMs) {
      if (!engine._emergenceActive || engine._rendererFencepostSeen) {
        this.#rafId = null;
        engine._emergenceRaf = null;
        return;
      }
      this.#emitMorphProgress(1, 1);
      this.#rafId = null;
      engine._emergenceRaf = null;
      engine._emergenceActive = false;
      engine._emergenceDone = true;
      this.#phase = 'complete';
      trace('[MorphController] Emergence timeline complete');
      return;
    }

    // Update phase bookkeeping when thresholds crossed.
    if (inImplosion) {
      this.#phase = 'implosion';
      this.#phaseDuration = implMs;
    } else if (settlePhaseRaw <= 0) {
      this.#phase = 'coalesce';
      this.#phaseDuration = this.#phaseDurations.coalesce;
    } else {
      this.#phase = 'settle';
      this.#phaseDuration = settleMs;
    }

    this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
    engine._emergenceRaf = this.#rafId;
  }

  #emitMorphProgress(value, target = value) {
    const engine = this.#engine;
    const stageLabel = engine.currentStage || 'genesis';
    const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : null;
    const stageIndex = stageOrder ? stageOrder.indexOf(stageLabel) : -1;

    const payload = {
      morphProgress: value,
      value,
      morphTarget: target,
      target,
      stage: stageLabel,
      schemaVersion: '3.5',
    };
    if (stageIndex >= 0) payload.stageIndex = stageIndex;

    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
  }
}

export default MorphController;
