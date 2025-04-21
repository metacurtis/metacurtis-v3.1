// src/utils/performance/AdaptiveQualitySystem.js

import qualityPresets from '@/config/qualityPresets.js';

/**
 * Named export: all possible quality tiers.
 */
export const QualityLevels = {
  ULTRA: 'ultra',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Default export: the Adaptive Quality System class.
 * Tracks frame times, computes avg FPS, and switches tiers.
 */
export default class AdaptiveQualitySystem {
  constructor({
    windowSize = 60,
    ultraFps = 65,
    highFps = 55,
    mediumFps = 45,
    initial = QualityLevels.HIGH,
  } = {}) {
    this.presets = qualityPresets;
    this.windowSize = windowSize;
    this.ultraFps = ultraFps;
    this.highFps = highFps;
    this.mediumFps = mediumFps;
    this.currentLevel = initial;
    this.frameTimes = [];
    this.lastTime = performance.now();
    this.subscribers = new Set();
  }

  /**
   * Call each frame. Returns the (possibly updated) quality level.
   */
  tick() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.windowSize) {
      this.frameTimes.shift();
    }

    if (this.frameTimes.length === this.windowSize) {
      this._adjustQuality();
    }

    return this.currentLevel;
  }

  /** @private */
  _adjustQuality() {
    const sumMs = this.frameTimes.reduce((sum, v) => sum + v, 0);
    const avgMs = sumMs / this.windowSize;
    const avgFps = 1000 / avgMs;
    const prev = this.currentLevel;

    if (avgFps >= this.ultraFps) {
      this.currentLevel = QualityLevels.ULTRA;
    } else if (avgFps >= this.highFps) {
      this.currentLevel = QualityLevels.HIGH;
    } else if (avgFps >= this.mediumFps) {
      this.currentLevel = QualityLevels.MEDIUM;
    } else {
      this.currentLevel = QualityLevels.LOW;
    }

    if (this.currentLevel !== prev) {
      this.subscribers.forEach(cb => cb(this.currentLevel));
    }
  }

  /**
   * Subscribe to level changes.
   * @param {(level:string)=>void} cb
   * @returns {() => void} unsubscribe
   */
  subscribe(cb) {
    this.subscribers.add(cb);
    cb(this.currentLevel);
    return () => this.subscribers.delete(cb);
  }

  /**
   * Get the preset parameters for the active tier.
   */
  getCurrentPreset() {
    return this.presets[this.currentLevel] || this.presets.high;
  }
}
