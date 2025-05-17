// src/utils/performance/AdaptiveQualitySystem.js
// core engine, no React here
import qualityPresets from '@/config/qualityPresets.js'; // Ensure this path and file exist

// NAMED EXPORT for QualityLevels
export const QualityLevels = {
  ULTRA: 'ULTRA',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

// DEFAULT EXPORT for the class
export default class AQSEngine {
  constructor({
    checkInterval = 1500,
    windowSize = 90,
    ultraFps = 55,
    highFps = 45,
    mediumFps = 25,
    initialLevel = QualityLevels.HIGH, // Uses the locally defined QualityLevels
    hysteresisChecks = 3,
  } = {}) {
    this.presets = qualityPresets;
    this.windowSize = windowSize;
    this.ultraFps = ultraFps;
    this.highFps = highFps;
    this.mediumFps = mediumFps;
    this.currentLevel = initialLevel;
    this.frameTimes = [];
    this.lastTime = performance.now();
    this.subscribers = new Set();

    this.frameCount = 0;
    this.checkInterval = checkInterval;
    this.lastCheckTime = performance.now();

    this.hysteresisChecks = hysteresisChecks;
    this.checksAtCurrentPotentialTier = 0;
    this.potentialNewTier = initialLevel;

    console.log(
      `AQSEngine: Initialized. Level: ${this.currentLevel}, Check Interval: ${checkInterval}ms, FPS Thresholds (U/H/M): ${ultraFps}/${highFps}/${mediumFps}, Hysteresis Checks: ${this.hysteresisChecks}`
    );
  }

  tick() {
    this.frameCount++;
    const now = performance.now();
    const timeSinceLastCheck = now - this.lastCheckTime;

    if (timeSinceLastCheck >= this.checkInterval) {
      if (this.frameCount > 0 && timeSinceLastCheck > 0) {
        const fps = (this.frameCount * 1000) / timeSinceLastCheck;
        // console.log(`AQSEngine: Interval reached. Calculated Avg FPS over ~${(timeSinceLastCheck/1000).toFixed(1)}s: ${fps.toFixed(1)} (Frames: ${this.frameCount})`);
        this._adjustQuality(fps);
      } else {
        // console.log(`AQSEngine: Interval reached, but no frames counted or no time elapsed. Frames: ${this.frameCount}, Time: ${timeSinceLastCheck}`);
      }
      this.frameCount = 0;
      this.lastCheckTime = now;
    }
  }

  _adjustQuality(fps) {
    let newCalculatedTier;
    // Uses the locally defined QualityLevels
    if (fps >= this.ultraFps) newCalculatedTier = QualityLevels.ULTRA;
    else if (fps >= this.highFps) newCalculatedTier = QualityLevels.HIGH;
    else if (fps >= this.mediumFps) newCalculatedTier = QualityLevels.MEDIUM;
    else newCalculatedTier = QualityLevels.LOW;

    // console.log(`AQSEngine _adjustQuality: Current Level: ${this.currentLevel}, Potential New Tier: ${this.potentialNewTier}, Calculated Tier from FPS (${fps.toFixed(1)}): ${newCalculatedTier}, Checks at Potential: ${this.checksAtCurrentPotentialTier}`);

    if (newCalculatedTier === this.potentialNewTier) {
      this.checksAtCurrentPotentialTier++;
    } else {
      this.potentialNewTier = newCalculatedTier;
      this.checksAtCurrentPotentialTier = 1;
      // console.log(`AQSEngine _adjustQuality: Potential new tier is now ${this.potentialNewTier}. Resetting stability counter.`);
    }

    if (
      this.checksAtCurrentPotentialTier >= this.hysteresisChecks &&
      this.currentLevel !== this.potentialNewTier
    ) {
      const prevLevel = this.currentLevel;
      this.currentLevel = this.potentialNewTier;
      console.log(
        `AQSEngine: !!! QUALITY TIER CHANGED !!! From ${prevLevel} to ${this.currentLevel} (Avg FPS: ~${fps.toFixed(1)})`
      );
      this.subscribers.forEach(cb => cb(this.currentLevel));
      this.checksAtCurrentPotentialTier = 0;
    } else if (
      this.currentLevel === this.potentialNewTier &&
      this.potentialNewTier === newCalculatedTier
    ) {
      this.checksAtCurrentPotentialTier = 0;
    }
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    cb(this.currentLevel);
    return () => this.subscribers.delete(cb);
  }

  getCurrentPreset() {
    // Uses the locally defined QualityLevels
    return this.presets[this.currentLevel.toLowerCase()] || this.presets.high;
  }
}
