/**
 * MorphAnimationController
 *
 * Unified morph animation system with RAF loop
 * Handles both:
 * - Director opening sequence animations (timed, 0→1)
 * - Scroll orchestrator smoothing (continuous, target tracking)
 *
 * Extracted from TheaterDirector._animateMorphPhase and ScrollOrchestrator._update
 */

import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export class MorphAnimationController {
  constructor() {
    this.animations = new Map(); // Support multiple concurrent animations
    this.globalRafId = null;

    console.log('🎨 [MorphAnimator] Module loaded');
  }

  /**
   * Animate morph value from start to end
   *
   * Modes:
   * - TIMED: Animate from→to over duration (opening sequence)
   * - CONTINUOUS: Track moving target with smoothing (scroll)
   *
   * @param {object} options
   * @param {number} options.from - Start value (0-1)
   * @param {number} options.to - End value (0-1) or target for continuous
   * @param {number} options.duration - Duration in ms (Infinity for continuous)
   * @param {string} options.stage - Stage name for events
   * @param {string} options.phase - Phase name for logging
   * @param {number} options.smoothing - Smoothing factor (0-1, for continuous)
   * @param {number} options.overshoot - Overshoot factor (for continuous effects)
   * @param {Function} options.skipSignal - Function that returns true to cancel
   * @param {Function} options.onProgress - Progress callback (value) => void
   * @param {Function} options.onComplete - Completion callback () => void
   * @returns {Promise} Resolves when animation completes
   */
  animate(options = {}) {
    const {
      id,
      from = 0,
      to = 1,
      duration = 1000,
      stage = 'genesis',
      phase = 'morph',
      smoothing = 0.15,
      overshoot = 0,
      skipSignal = () => false,
      onProgress = null,
      onComplete = null,
      mode = duration === Infinity ? 'continuous' : 'timed',
    } = options;

    const startValue = clamp01(Number.isFinite(from) ? from : 0);
    const endValue = clamp01(Number.isFinite(to) ? to : startValue);
    const durationMs = Math.max(0, Number(duration) || 0);
    const isContinuous = mode === 'continuous' || duration === Infinity;

    const safeStage = stage || 'morph';
    const safePhase = phase || 'default';
    const animationId = typeof id === 'string' && id.length > 0 ? id : `${safeStage}-${safePhase}-${Date.now()}`;

    console.log(`🎨 [MorphAnimator] Starting ${mode}`, {
      id: animationId,
      from: startValue.toFixed(3),
      to: endValue.toFixed(3),
      duration: isContinuous ? 'continuous' : `${durationMs}ms`,
      stage,
      phase,
    });

    // Immediate case: no animation needed
    if (!isContinuous && (durationMs === 0 || Math.abs(endValue - startValue) < 1e-4)) {
      this._emitProgress(endValue, { stage, phase, duration: 0, source: 'immediate' });
      if (onProgress) onProgress(endValue);
      if (onComplete) onComplete();
      return Promise.resolve();
    }

    const getNow =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? () => performance.now()
        : () => Date.now();

    const requestFrame =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (cb) => setTimeout(() => cb(Date.now()), 16);

    const cancelFrame =
      typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
        ? window.cancelAnimationFrame.bind(window)
        : clearTimeout;

    const promise = new Promise((resolve) => {
      const animation = {
        id: animationId,
        currentValue: startValue,
        startValue,
        targetValue: endValue,
        startTime: getNow(),
        duration: durationMs,
        stage,
        phase,
        mode,
        smoothing,
        overshoot,
        skipSignal,
        onProgress,
        onComplete,
        rafId: null,
        settled: false,
        resolve,
      };

      this.animations.set(animationId, animation);

      // Start RAF loop if not already running
      if (!this.globalRafId) {
        this._startRafLoop();
      }
    });

    promise.animationId = animationId;
    promise.cancel = () => this.cancel(animationId);

    return promise;
  }

  /**
   * Update target for continuous animations
   * Used by ScrollOrchestrator to update scroll target
   */
  updateTarget(animationId, newTarget) {
    const animation = this.animations.get(animationId);
    if (!animation) return;

    animation.targetValue = clamp01(newTarget);

    // Restart RAF if needed
    if (!this.globalRafId) {
      this._startRafLoop();
    }
  }

  /**
   * Cancel a specific animation
   */
  cancel(animationId) {
    const animation = this.animations.get(animationId);
    if (!animation) return;

    console.log(`🎨 [MorphAnimator] Cancelling ${animationId}`);

    this._finalizeAnimation(animation);
  }

  /**
   * Cancel all animations
   */
  cancelAll() {
    console.log(`🎨 [MorphAnimator] Cancelling all (${this.animations.size} active)`);

    const active = Array.from(this.animations.values());
    for (const animation of active) {
      this._finalizeAnimation(animation);
    }
  }

  /**
   * Main RAF loop - updates all active animations
   */
  _startRafLoop() {
    const requestFrame =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (cb) => setTimeout(() => cb(Date.now()), 16);

    const getNow =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? () => performance.now()
        : () => Date.now();

    const tick = () => {
      if (this.animations.size === 0) {
        this.globalRafId = null;
        return;
      }

      const now = getNow();

      for (const [id, animation] of this.animations.entries()) {
        // Check skip signal
        if (animation.skipSignal && animation.skipSignal()) {
          this._finalizeAnimation(animation);
          continue;
        }

        // Update based on mode
        if (animation.mode === 'continuous') {
          this._updateContinuous(animation, now);
        } else {
          this._updateTimed(animation, now);
        }
      }

      // Continue loop
      this.globalRafId = requestFrame(tick);
    };

    this.globalRafId = requestFrame(tick);
  }

  /**
   * Update timed animation (opening sequence)
   */
  _updateTimed(animation, now) {
    const elapsed = now - animation.startTime;
    const ratio = Math.min(1, elapsed / animation.duration);

    const newValue = animation.startValue + (animation.targetValue - animation.startValue) * ratio;

    animation.currentValue = newValue;

    // Emit progress
    this._emitProgress(newValue, {
      stage: animation.stage,
      phase: animation.phase,
      duration: animation.duration,
      source: 'raf-timed',
      animationId: animation.id,
      morphTarget: animation.targetValue,
    });

    if (animation.onProgress) {
      animation.onProgress(newValue);
    }

    // Check completion
    if (ratio >= 1) {
      this._finalizeAnimation(animation);
    }
  }

  /**
   * Update continuous animation (scroll smoothing)
   */
  _updateContinuous(animation, now) {
    const delta = animation.targetValue - animation.currentValue;

    // Snap if close enough
    if (Math.abs(delta) < 0.001) {
      animation.currentValue = animation.targetValue;
      // Don't finalize - keep tracking target
      return;
    }

    // Apply smoothing
    animation.currentValue += delta * animation.smoothing;

    // Apply overshoot if configured
    if (animation.overshoot > 0 && Math.abs(delta) > 0.1) {
      animation.currentValue += delta * animation.overshoot * Math.sin(now * 0.001);
    }

    // Emit progress
    this._emitProgress(animation.currentValue, {
      stage: animation.stage,
      phase: animation.phase,
      duration: 0,
      source: 'raf-continuous',
      animationId: animation.id,
      morphTarget: animation.targetValue,
    });

    if (animation.onProgress) {
      animation.onProgress(animation.currentValue);
    }
  }

  /**
   * Finalize animation and clean up
   */
  _finalizeAnimation(animation) {
    if (animation.settled) return;
    animation.settled = true;
    animation.currentValue = animation.targetValue;

    // Emit final value
    this._emitProgress(animation.targetValue, {
      stage: animation.stage,
      phase: animation.phase,
      duration: animation.duration,
      source: 'finalize',
      animationId: animation.id,
      morphTarget: animation.targetValue,
    });

    if (animation.onComplete) {
      animation.onComplete();
    }

    if (animation.resolve) {
      animation.resolve();
    }

    this.animations.delete(animation.id);

    console.log(`🎨 [MorphAnimator] Completed ${animation.id}`);
  }

  /**
   * Emit morph progress event
   */
  _emitProgress(value, { stage, phase, duration, source, animationId, morphTarget, target }) {
    const clampedValue = clamp01(value);
    const resolvedTarget =
      typeof morphTarget === 'number'
        ? clamp01(morphTarget)
        : typeof target === 'number'
        ? clamp01(target)
        : clampedValue;

    const stateCommands = typeof window !== 'undefined' ? window.stateCommands : null;
    if (stateCommands?.setMorphProgress) {
      stateCommands.setMorphProgress(clampedValue, {
        origin: source || 'animator',
        morphTarget: resolvedTarget,
        stage,
        durationMs: Number.isFinite(duration) ? Math.max(0, duration) : undefined,
        animationId,
      });
    } else {
      console.warn('[MorphAnimationController] StateCommands not available, cannot emit MORPH_PROGRESS');
    }
  }

  /**
   * Emit a snapshot without animation
   * Used for immediate morph updates (skip, fast-forward)
   */
  emitSnapshot(value, phase, target = value, durationMs = 0, stage = 'genesis') {
    this._emitProgress(value, {
      target,
      stage,
      phase,
      durationMs,
      source: 'snapshot',
    });
  }

  /**
   * Get current state
   */
  getState() {
    return {
      activeAnimations: this.animations.size,
      animations: Array.from(this.animations.values()).map((a) => ({
        id: a.id,
        current: a.currentValue.toFixed(3),
        target: a.targetValue.toFixed(3),
        mode: a.mode,
        stage: a.stage,
        phase: a.phase,
      })),
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.cancelAll();

    if (this.globalRafId) {
      const cancelFrame =
        typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
          ? window.cancelAnimationFrame.bind(window)
          : clearTimeout;

      cancelFrame(this.globalRafId);
      this.globalRafId = null;
    }
  }
}

export default MorphAnimationController;
