import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
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
  }

  start({ from = 0, to = 1, duration = 2000, source = 'raf-timed' } = {}) {
    if (typeof window === 'undefined') return;
    if (this._running) return;
    const clampedFrom = clamp01(from);
    const clampedTo = clamp01(to);
    const safeDuration = Math.max(1, Number(duration) || 1);
    const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const ease = (t) => t * t * (3 - 2 * t);
    this._running = true;
    this._currentJob = { from: clampedFrom, to: clampedTo, source, duration: safeDuration };

    const step = (now) => {
      if (!this._running) return;
      const elapsed = (now ?? (performance.now ? performance.now() : Date.now())) - t0;
      const progressRatio = Math.min(1, elapsed / safeDuration);
      const eased = ease(progressRatio);
      const value = clampedFrom + (clampedTo - clampedFrom) * eased;
      const clampedValue = clamp01(value);
      // Canonical Morph writer: all MORPH_PROGRESS bus traffic must originate here.
      emitMorphProgress({
        value: clampedValue,
        progress: clampedValue,
        source,
        channel: 'renderer',
      });
      if (progressRatio < 1) {
        this._raf = window.requestAnimationFrame(step);
      } else {
        this._running = false;
      }
    };

    this._raf = window.requestAnimationFrame(step);
  }

  stop() {
    if (this._raf && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this._raf);
    }
    this._raf = 0;
    this._running = false;
    this._currentJob = null;
  }
}
