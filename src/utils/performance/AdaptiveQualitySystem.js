// src/utils/performance/AdaptiveQualitySystem.js
// ✅ FPS SYNCED: Aligned with Performance Store calculation method
// Core engine, no React here

import qualityPresets from '@/config/qualityPresets.js'; // Ensure this path and file exist

// Singleton caching for device capabilities integration
let deviceInfoCache = null;
let detectionPromise = null;

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
    initialLevel = QualityLevels.HIGH,
    hysteresisChecks = 4, // ✅ ENHANCED: Increased for stability
    quietPeriodMs = 300,  // ✅ NEW: Minimum time between changes
  } = {}) {
    this.presets = qualityPresets;
    this.windowSize = windowSize;
    this.ultraFps = ultraFps;
    this.highFps = highFps;
    this.mediumFps = mediumFps;
    this.currentLevel = initialLevel;
    
    // ✅ ENHANCED: Frame-based sampling arrays
    this.frameTimes = []; // Store actual frame deltas for secondary validation
    this.lastTime = performance.now();
    this.subscribers = new Set();

    this.frameCount = 0;
    this.checkInterval = checkInterval;
    this.lastCheckTime = performance.now();

    // ✅ ENHANCED: Stability controls
    this.hysteresisChecks = hysteresisChecks;
    this.checksAtCurrentPotentialTier = 0;
    this.potentialNewTier = initialLevel;
    this.quietPeriodMs = quietPeriodMs;
    this.lastTierChangeTime = 0; // ✅ NEW: Track last change time

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `AQSEngine: Initialized. Level: ${this.currentLevel}, Check Interval: ${checkInterval}ms, FPS Thresholds (U/H/M): ${ultraFps}/${highFps}/${mediumFps}, Hysteresis Checks: ${this.hysteresisChecks}, Quiet Period: ${quietPeriodMs}ms`
      );
    }
  }

  // ✅ FPS SYNCED: Frame-synchronized sampling with Performance Store alignment
  tickFrame(delta) {
    this.frameCount++;
    const now = performance.now();
    
    // Store frame times for secondary validation
    const frameTimeMs = delta * 1000; // Convert seconds to milliseconds
    this.frameTimes.push(frameTimeMs);
    
    // Maintain sliding window
    if (this.frameTimes.length > this.windowSize) {
      this.frameTimes.shift();
    }
    
    const timeSinceLastCheck = now - this.lastCheckTime;
    
    if (timeSinceLastCheck >= this.checkInterval) {
      if (this.frameCount > 0 && timeSinceLastCheck > 0) {
        // ✅ FPS SYNC FIX: Use frame count / time elapsed for consistency with Performance Store
        const timeElapsed = timeSinceLastCheck / 1000; // Convert to seconds
        const fps = timeElapsed > 0 ? this.frameCount / timeElapsed : 0;

        // Secondary validation using frame time average
        const avgFrameTime = this.frameTimes.length > 0 
          ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length 
          : 16.67;
        const frameBasedFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
        
        if (process.env.NODE_ENV === 'development') {
          // ✅ ENHANCED: Detailed FPS calculation logging for validation
          if (Math.random() < 0.15) { // 15% chance for debugging
            console.log(`AQSEngine: FPS=${fps.toFixed(1)} (frames=${this.frameCount}, time=${timeElapsed.toFixed(1)}s) | FrameAvg=${frameBasedFps.toFixed(1)} (samples=${this.frameTimes.length})`);
          }
        }
        
        // Use the frame count method (same as Performance Store)
        this._adjustQuality(fps);
      }
      
      // ✅ FPS SYNC FIX: Reset frame count after quality check
      this.frameCount = 0; 
      this.lastCheckTime = now;
    }
  }

  // ✅ ENHANCED: Legacy support with frame sync preference
  tick() {
    // Legacy support - prefer tickFrame(delta) for frame sync
    // Fallback assumes 60fps for compatibility
    this.tickFrame(16.67 / 1000); // Convert to seconds
  }

  // ✅ ENHANCED: Improved quality adjustment with quiet period
  _adjustQuality(fps) {
    let newCalculatedTier;
    
    // Calculate tier based on FPS thresholds
    if (fps >= this.ultraFps) newCalculatedTier = QualityLevels.ULTRA;
    else if (fps >= this.highFps) newCalculatedTier = QualityLevels.HIGH;
    else if (fps >= this.mediumFps) newCalculatedTier = QualityLevels.MEDIUM;
    else newCalculatedTier = QualityLevels.LOW;

    if (process.env.NODE_ENV === 'development') {
      // ✅ REDUCED: Less frequent quality adjustment logging
      if (newCalculatedTier !== this.currentLevel && Math.random() < 0.2) {
        console.log(`AQSEngine _adjustQuality: Current: ${this.currentLevel}, Potential: ${this.potentialNewTier}, Calculated: ${newCalculatedTier} (FPS: ${fps.toFixed(1)}), Checks: ${this.checksAtCurrentPotentialTier}`);
      }
    }

    // Hysteresis logic
    if (newCalculatedTier === this.potentialNewTier) {
      this.checksAtCurrentPotentialTier++;
    } else {
      this.potentialNewTier = newCalculatedTier;
      this.checksAtCurrentPotentialTier = 1;
      
      if (process.env.NODE_ENV === 'development') {
        // ✅ REDUCED: Only log significant tier potential changes
        if (Math.abs(this._getTierValue(newCalculatedTier) - this._getTierValue(this.currentLevel)) > 1) {
          console.log(`AQSEngine: Potential tier changed to ${this.potentialNewTier}. Resetting stability counter.`);
        }
      }
    }

    // ✅ ENHANCED: Check hysteresis + quiet period
    if (
      this.checksAtCurrentPotentialTier >= this.hysteresisChecks &&
      this.currentLevel !== this.potentialNewTier &&
      (performance.now() - this.lastTierChangeTime) >= this.quietPeriodMs  // ✅ NEW: Quiet period check
    ) {
      const prevLevel = this.currentLevel;
      this.currentLevel = this.potentialNewTier;
      this.lastTierChangeTime = performance.now(); // ✅ NEW: Track change time
      
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `AQSEngine: !!! QUALITY TIER CHANGED !!! From ${prevLevel} to ${this.currentLevel} (Avg FPS: ~${fps.toFixed(1)})`
        );
      }
      
      this.subscribers.forEach(cb => cb(this.currentLevel));
      this.checksAtCurrentPotentialTier = 0;
    } else if (
      this.currentLevel === this.potentialNewTier &&
      this.potentialNewTier === newCalculatedTier
    ) {
      // Reset counter when stable at current tier
      this.checksAtCurrentPotentialTier = 0;
    }
  }

  // ✅ NEW: Helper method for tier comparison
  _getTierValue(tier) {
    const values = { LOW: 0, MEDIUM: 1, HIGH: 2, ULTRA: 3 };
    return values[tier] || 1;
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    cb(this.currentLevel); // Immediately call with current level
    return () => this.subscribers.delete(cb);
  }

  getCurrentPreset() {
    return this.presets[this.currentLevel.toLowerCase()] || this.presets.high;
  }

  // ✅ ENHANCED: Development utilities with FPS validation
  getDebugInfo() {
    if (process.env.NODE_ENV === 'development') {
      const avgFrameTime = this.frameTimes.length > 0 
        ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length 
        : 0;
      
      return {
        currentLevel: this.currentLevel,
        potentialNewTier: this.potentialNewTier,
        checksAtPotential: this.checksAtCurrentPotentialTier,
        hysteresisChecks: this.hysteresisChecks,
        quietPeriodMs: this.quietPeriodMs,
        timeSinceLastChange: performance.now() - this.lastTierChangeTime,
        frameTimesCount: this.frameTimes.length,
        avgFrameTime: avgFrameTime,
        calculatedFps: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
        frameCount: this.frameCount,
        // ✅ NEW: FPS calculation comparison
        fpsCalculationMethods: {
          frameAverage: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
          frameCount: this.frameCount > 0 ? this.frameCount / ((performance.now() - this.lastCheckTime) / 1000) : 0
        }
      };
    }
    return null;
  }

  // ✅ NEW: Force tier change (development only)
  setTier(tier, force = false) {
    if (process.env.NODE_ENV === 'development' || force) {
      if (Object.values(QualityLevels).includes(tier)) {
        const prevLevel = this.currentLevel;
        this.currentLevel = tier;
        this.potentialNewTier = tier;
        this.checksAtCurrentPotentialTier = 0;
        this.lastTierChangeTime = performance.now();
        
        console.log(`AQSEngine: Manual tier change from ${prevLevel} to ${tier}`);
        this.subscribers.forEach(cb => cb(this.currentLevel));
      }
    }
  }

  // ✅ NEW: FPS calculation testing utilities
  testFpsCalculation() {
    if (process.env.NODE_ENV === 'development') {
      const now = performance.now();
      const timeSinceLastCheck = now - this.lastCheckTime;
      const timeElapsed = timeSinceLastCheck / 1000;
      
      const frameCountFps = timeElapsed > 0 ? this.frameCount / timeElapsed : 0;
      const avgFrameTime = this.frameTimes.length > 0 
        ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length 
        : 0;
      const frameTimeFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
      
      console.log('🧪 AQS FPS Calculation Test:', {
        frameCount: this.frameCount,
        timeElapsed: timeElapsed.toFixed(2),
        frameCountFps: frameCountFps.toFixed(1),
        avgFrameTime: avgFrameTime.toFixed(2),
        frameTimeFps: frameTimeFps.toFixed(1),
        difference: Math.abs(frameCountFps - frameTimeFps).toFixed(1)
      });
    }
  }
}

// ✅ ENHANCED: Global development access with FPS testing
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.AQSEngine = AQSEngine;
  window.QualityLevels = QualityLevels;
  window.aqsUtils = {
    testFps: () => window.aqsEngine?.testFpsCalculation?.(),
    getDebug: () => window.aqsEngine?.getDebugInfo?.(),
    setTier: (tier) => window.aqsEngine?.setTier?.(tier),
  };
}