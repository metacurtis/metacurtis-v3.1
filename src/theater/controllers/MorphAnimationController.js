import { emitMorphProgress } from '../bus/emitters.js';

const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

export default class MorphAnimationController {
  constructor() {
    this._raf = 0;
    this._running = false;
    this._currentJob = null;
    this._currentValue = 0;
    this._jobToken = 0;
  }

  getCurrentValue() {
    return this._currentValue;
  }

  setImmediate(value, { source = 'morph-intent-immediate' } = {}) {
    const clampedValue = clamp01(value);
    this.stop();
    this._currentValue = clampedValue;
    emitMorphProgress({
      progress: clampedValue,
      source,
    });
    return clampedValue;
  }

  setTarget({ from, to = 1, duration = 2000, source = 'morph-intent-target' } = {}) {
    const resolvedFrom = Number.isFinite(from) ? from : this._currentValue;
    return this.start({
      from: resolvedFrom,
      to,
      duration,
      source,
    });
  }

  start({ from = 0, to = 1, duration = 2000, source = 'raf-timed' } = {}) {
    if (typeof window === 'undefined') return;
    this.stop();
    const clampedFrom = clamp01(from);
    const clampedTo = clamp01(to);
    const safeDuration = Math.max(1, Number(duration) || 1);
    const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const ease = (t) => t * t * (3 - 2 * t);
    this._running = true;
    this._currentJob = { from: clampedFrom, to: clampedTo, source, duration: safeDuration };
    this._currentValue = clampedFrom;
    this._jobToken += 1;
    const token = this._jobToken;

    const step = (now) => {
      if (token !== this._jobToken) return;
      if (!this._running) return;
      const elapsed = (now ?? (performance.now ? performance.now() : Date.now())) - t0;
      const progressRatio = Math.min(1, elapsed / safeDuration);
      const eased = ease(progressRatio);
      const value = clampedFrom + (clampedTo - clampedFrom) * eased;
      const clampedValue = clamp01(value);
      this._currentValue = clampedValue;
      // Canonical Morph writer: all MORPH_PROGRESS bus traffic must originate here.
      emitMorphProgress({
        progress: clampedValue,
        source,
      });
      try {
        console.log('🔬 MORPH_CONTROLLER_EMIT', {
          progress: clampedValue,
          source,
          timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
        });
      } catch {}
      if (progressRatio < 1) {
        this._raf = window.requestAnimationFrame(step);
      } else {
        this._running = false;
        this._raf = 0;
        this._currentValue = clampedTo;
      }
    };

    this._raf = window.requestAnimationFrame(step);
    return { from: clampedFrom, to: clampedTo, duration: safeDuration, source };
  }

  stop() {
    if (this._raf && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this._raf);
    }
    this._raf = 0;
    this._running = false;
    this._currentJob = null;
    this._jobToken += 1;
  }
}

// Canonical singleton used by all intent writers.
export const morphController = new MorphAnimationController();
