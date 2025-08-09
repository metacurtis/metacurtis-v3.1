import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
// src/utils/performance/AdaptiveQualitySystem.js
// ✅ PHASE 2: Quality Tier Stabilization - Enhanced AQS Engine
// Eliminates tier flapping with intelligent debouncing and variance checking

export const QualityLevels = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM', 
  HIGH: 'HIGH',
  ULTRA: 'ULTRA',
};

// ✅ ENHANCED: Stability configuration
const ENHANCED_STABILITY_CONFIG = {
  // Tier change requirements
  consecutiveChecks: 6,        // Require 6 consecutive stable readings
  debounceMs: 2000,           // 2 second minimum between tier changes
  fpsVarianceThreshold: 8,    // FPS must be within 8 of target for stability
  emergencyDropThreshold: 15, // Emergency drop to LOW if FPS < 15
  
  // Tier thresholds with clear separation
  tiers: {
    ULTRA: { minFps: 55, particles: 15000 },
    HIGH: { minFps: 45, particles: 12000 },
    MEDIUM: { minFps: 30, particles: 8000 },
    LOW: { minFps: 0, particles: 4000 }
  }
};

class StabilizedQualityManager {
  constructor() {
    this.currentTier = 'HIGH';
    this.potentialTier = 'HIGH';
    this.stabilityChecks = 0;
    this.lastTierChange = 0;
    this.fpsHistory = [];
    this.maxHistoryLength = 10;
  }

  updateFPS(fps) {
    // Track FPS history for variance calculation
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxHistoryLength) {
      this.fpsHistory.shift();
    }

    const now = Date.now();
    const timeSinceLastChange = now - this.lastTierChange;
    
    // Emergency drop for very low FPS
    if (fps < ENHANCED_STABILITY_CONFIG.emergencyDropThreshold) {
      this.emergencyDrop();
      return this.currentTier;
    }

    // Calculate what tier FPS suggests
    const suggestedTier = this.calculateTierFromFPS(fps);
    
    // Check if we're in debounce period
    if (timeSinceLastChange < ENHANCED_STABILITY_CONFIG.debounceMs) {
      console.log(`🛡️ AQS: Debounce active (${Math.round(timeSinceLastChange)}ms), staying at ${this.currentTier}`);
      return this.currentTier;
    }

    // Check FPS variance for stability
    if (!this.isFPSStable()) {
      console.log(`⚠️ AQS: FPS unstable (variance: ${this.getFPSVariance().toFixed(1)}), maintaining ${this.currentTier}`);
      this.stabilityChecks = 0;
      return this.currentTier;
    }

    // Handle tier change logic
    if (suggestedTier !== this.potentialTier) {
      this.potentialTier = suggestedTier;
      this.stabilityChecks = 1;
      console.log(`🔄 AQS: Potential tier change to ${suggestedTier}, checks: 1/${ENHANCED_STABILITY_CONFIG.consecutiveChecks}`);
    } else if (suggestedTier !== this.currentTier) {
      this.stabilityChecks++;
      console.log(`🔄 AQS: Confirming ${suggestedTier}, checks: ${this.stabilityChecks}/${ENHANCED_STABILITY_CONFIG.consecutiveChecks}`);
      
      // Only change tier after sufficient consecutive checks
      if (this.stabilityChecks >= ENHANCED_STABILITY_CONFIG.consecutiveChecks) {
        this.changeTier(suggestedTier);
      }
    } else {
      // FPS stable at current tier
      this.stabilityChecks = 0;
    }

    return this.currentTier;
  }

  calculateTierFromFPS(fps) {
    // Conservative tier calculation with clear boundaries
    if (fps >= ENHANCED_STABILITY_CONFIG.tiers.ULTRA.minFps) return 'ULTRA';
    if (fps >= ENHANCED_STABILITY_CONFIG.tiers.HIGH.minFps) return 'HIGH';
    if (fps >= ENHANCED_STABILITY_CONFIG.tiers.MEDIUM.minFps) return 'MEDIUM';
    return 'LOW';
  }

  isFPSStable() {
    if (this.fpsHistory.length < 3) return false;
    
    const variance = this.getFPSVariance();
    return variance <= ENHANCED_STABILITY_CONFIG.fpsVarianceThreshold;
  }

  getFPSVariance() {
    if (this.fpsHistory.length < 2) return 0;
    
    const recent = this.fpsHistory.slice(-5); // Last 5 readings
    const max = Math.max(...recent);
    const min = Math.min(...recent);
    return max - min;
  }

  changeTier(newTier) {
    const oldTier = this.currentTier;
    this.currentTier = newTier;
    this.potentialTier = newTier;
    this.stabilityChecks = 0;
    this.lastTierChange = Date.now();
    
    console.log(`✅ AQS: Stable tier change ${oldTier} → ${newTier} (${ENHANCED_STABILITY_CONFIG.tiers[newTier].particles} particles)`);
    
    // Trigger particle count update
    this.triggerQualityUpdate(newTier);
  }

  emergencyDrop() {
    if (this.currentTier !== 'LOW') {
      console.log(`🚨 AQS: Emergency drop to LOW tier`);
      this.changeTier('LOW');
    }
  }

  triggerQualityUpdate(tier) {
    // Emit event for WebGL background to update particle count
    window.dispatchEvent(new CustomEvent('aqsQualityChange', {
      detail: {
        tier,
        particles: ENHANCED_STABILITY_CONFIG.tiers[tier].particles,
        stable: true
      }
    }));
  }
}

// Create global instance
const stabilizedManager = new StabilizedQualityManager();

// ✅ ENHANCED: Main AQS Engine class with stabilization
export default class AQSEngine {
  constructor(config = {}) {
    this.ultraFps = config.ultraFps || 55;
    this.highFps = config.highFps || 45;
    this.mediumFps = config.mediumFps || 25;
    this.checkInterval = config.checkInterval || 1500;
    this.windowSize = config.windowSize || 90;
    this.hysteresisChecks = config.hysteresisChecks || 4;
    this.initialLevel = config.initialLevel || QualityLevels.HIGH;

    this.currentLevel = this.initialLevel;
    this.checks = 0;
    this.potentialLevel = this.currentLevel;
    this.listeners = new Set();
    this.isEnabled = true;

    console.log(
      `AQSEngine: Initialized for Central Clock. Level: ${this.currentLevel}, FPS Thresholds (U/H/M): ${this.ultraFps}/${this.highFps}/${this.mediumFps}, Hysteresis Checks: ${this.hysteresisChecks}`
    );

    // ✅ ENHANCED: Use stabilized manager
    this.stabilizedManager = stabilizedManager;
  }

  handleFPSUpdate(fps) {
    if (!this.isEnabled) return;

    // ✅ ENHANCED: Route through stabilized manager
    const newTier = this.stabilizedManager.updateFPS(fps);
    
    // Only emit if tier actually changed
    if (newTier !== this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newTier;
      
      console.log(`✅ AQSEngine: STABLE QUALITY TIER CHANGED: ${oldLevel} → ${newTier} (FPS: ${fps.toFixed(1)})`);
      
      // Notify listeners
      this.listeners.forEach(callback => {
        try {
          callback(newTier);
        } catch (error) {
          console.error('AQSEngine: Listener callback error:', error);
        }
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.currentLevel);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`AQSEngine: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  getDebugInfo() {
    return {
      currentLevel: this.currentLevel,
      potentialLevel: this.stabilizedManager.potentialTier,
      stabilityChecks: this.stabilizedManager.stabilityChecks,
      fpsHistory: this.stabilizedManager.fpsHistory,
      fpsVariance: this.stabilizedManager.getFPSVariance(),
      timeSinceLastChange: Date.now() - this.stabilizedManager.lastTierChange,
      isEnabled: this.isEnabled,
      listeners: this.listeners.size,
      config: {
        ultraFps: this.ultraFps,
        highFps: this.highFps,
        mediumFps: this.mediumFps,
        checkInterval: this.checkInterval,
        hysteresisChecks: this.hysteresisChecks
      }
    };
  }
}

// ✅ ENHANCED: Development access with stability tools
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.aqsStabilize = {
    // Emergency commands for console
    forceTier: (tier) => {
      stabilizedManager.changeTier(tier);
      console.log(`🛠️ Forced tier to ${tier}`);
    },
    
    getTierInfo: () => {
      console.log('🔍 AQS TIER STABILITY DIAGNOSTIC');
      console.log('================================');
      
      const manager = stabilizedManager;
      console.log(`Current Tier: ${manager.currentTier}`);
      console.log(`Potential Tier: ${manager.potentialTier}`);
      console.log(`Stability Checks: ${manager.stabilityChecks}`);
      console.log(`FPS History:`, manager.fpsHistory);
      console.log(`FPS Variance: ${manager.getFPSVariance().toFixed(1)}`);
      console.log(`Time Since Last Change: ${Date.now() - manager.lastTierChange}ms`);
      console.log(`Debounce Period: ${ENHANCED_STABILITY_CONFIG.debounceMs}ms`);
      
      return {
        stable: manager.stabilityChecks === 0,
        variance: manager.getFPSVariance(),
        recommendation: manager.getFPSVariance() > 10 ? 'Reduce particle count' : 'System stable'
      };
    },
    
    resetStability: () => {
      stabilizedManager.stabilityChecks = 0;
      stabilizedManager.lastTierChange = 0;
      console.log('🔄 Stability counters reset');
    },
    
    enableConservativeMode: () => {
      ENHANCED_STABILITY_CONFIG.tiers.ULTRA.minFps = 58;
      ENHANCED_STABILITY_CONFIG.tiers.HIGH.minFps = 48;
      ENHANCED_STABILITY_CONFIG.consecutiveChecks = 8;
      console.log('🛡️ Conservative mode enabled');
    }
  };

  console.log('✅ Quality tier stabilization loaded');
  console.log('🎮 Use window.aqsStabilize.getTierInfo() to check stability');
  console.log('🛠️ Use window.aqsStabilize.forceTier("HIGH") for manual control');
}