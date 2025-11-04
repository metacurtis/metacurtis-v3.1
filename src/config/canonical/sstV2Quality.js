// src/config/canonical/sstV2Quality.js
// ✅ SST v2.0 QUALITY ATOMIC AUTHORITY - Immutable Quality Definitions
// THE SINGLE SOURCE OF TRUTH - Quality and Performance Standards

import { SST_V2_STAGE_DEFINITIONS } from './sstV2Stages.js';

/**
 * ✅ CANONICAL QUALITY SYSTEM - SST v2.0
 * Immutable definitions for quality tiers and performance scaling
 * Foundation for atomic quality management
 */

// ✅ QUALITY TIERS: Canonical hierarchy (IMMUTABLE)
export const SST_V2_QUALITY_TIERS = Object.freeze([
  'LOW',     // 0: Mobile-safe, 60% particles
  'MEDIUM',  // 1: Tablet-optimized, 80% particles
  'HIGH',    // 2: Desktop baseline, 100% particles
  'ULTRA'    // 3: Showcase mode, 120% particles (17K capable)
]);

// ✅ QUALITY MULTIPLIERS: Performance scaling (IMMUTABLE)
export const SST_V2_QUALITY_MULTIPLIERS = Object.freeze({
  LOW: Object.freeze({
    particles: 0.6,
    dpr: 0.5,
    effects: 0.8,
    description: 'Mobile-safe performance',
    targetDevices: ['mobile', 'low-end']
  }),
  
  MEDIUM: Object.freeze({
    particles: 0.8,
    dpr: 0.75,
    effects: 0.9,
    description: 'Tablet-optimized performance',
    targetDevices: ['tablet', 'medium-range']
  }),
  
  HIGH: Object.freeze({
    particles: 1.0,
    dpr: 1.0,
    effects: 1.0,
    description: 'Desktop baseline performance',
    targetDevices: ['desktop', 'laptop']
  }),
  
  ULTRA: Object.freeze({
    particles: 1.2,
    dpr: 1.2,
    effects: 1.1,
    description: 'Showcase mode (17K particles)',
    targetDevices: ['high-end-desktop', 'gaming']
  })
});

// ✅ PERFORMANCE TARGETS: SST v2.0 benchmarks (IMMUTABLE)
export const SST_V2_PERFORMANCE_TARGETS = Object.freeze({
  MINIMUM_FPS: 30,
  TARGET_FPS: 60,
  EXCELLENT_FPS: 90,
  LIGHTHOUSE_TARGET: 90,
  
  // Particle capacity by tier
  PARTICLES: Object.freeze({
    LOW_MAX: 9000,      // 60% of 15K
    MEDIUM_MAX: 12000,  // 80% of 15K
    HIGH_MAX: 15000,    // 100% operational
    ULTRA_MAX: 17000    // 120% showcase
  }),
  
  // FPS thresholds for tier changes
  FPS_THRESHOLDS: Object.freeze({
    ULTRA_REQUIRED: 58,    // Need 58+ FPS for ULTRA
    HIGH_REQUIRED: 45,     // Need 45+ FPS for HIGH
    MEDIUM_REQUIRED: 35,   // Need 35+ FPS for MEDIUM
    LOW_FALLBACK: 25       // Fall to LOW below 25 FPS
  }),
  
  // Performance monitoring windows
  MONITORING: Object.freeze({
    FPS_WINDOW_SIZE: 60,    // 1 second at 60fps
    TIER_CHANGE_COOLDOWN: 1500,  // 1.5s between tier changes
    JANK_THRESHOLD: 33.4,   // >30fps threshold for jank detection
    MAX_JANK_RATIO: 0.1     // 10% jank frames acceptable
  })
});

// ✅ DEVICE CLASSIFICATION: Hardware awareness (IMMUTABLE)
export const SST_V2_DEVICE_CLASSES = Object.freeze({
  MOBILE: Object.freeze({
    defaultTier: 'MEDIUM',
    maxTier: 'HIGH',
    characteristics: ['touch', 'battery-sensitive', 'thermal-limited'],
    dprLimit: 2.0
  }),
  
  TABLET: Object.freeze({
    defaultTier: 'HIGH',
    maxTier: 'ULTRA',
    characteristics: ['touch', 'battery-sensitive', 'medium-performance'],
    dprLimit: 2.5
  }),
  
  LAPTOP: Object.freeze({
    defaultTier: 'HIGH',
    maxTier: 'ULTRA',
    characteristics: ['keyboard', 'battery-aware', 'variable-performance'],
    dprLimit: 3.0
  }),
  
  DESKTOP: Object.freeze({
    defaultTier: 'HIGH',
    maxTier: 'ULTRA',
    characteristics: ['keyboard', 'powered', 'high-performance'],
    dprLimit: 4.0
  })
});

// ✅ PARTICLE BUDGET CALCULATION: Stage-aware scaling
export function calculateParticleBudget(stageName, qualityTier) {
  // Validate inputs
  if (!SST_V2_STAGE_DEFINITIONS[stageName]) {
    throw new Error(`SST v2.0 VIOLATION: Invalid stage "${stageName}"`);
  }
  
  if (!SST_V2_QUALITY_TIERS.includes(qualityTier)) {
    throw new Error(`SST v2.0 VIOLATION: Invalid quality tier "${qualityTier}"`);
  }
  
  // Get base particle count for stage
  const baseParticles = SST_V2_STAGE_DEFINITIONS[stageName].particles;
  
  // Apply quality multiplier
  const multiplier = SST_V2_QUALITY_MULTIPLIERS[qualityTier].particles;
  
  // Calculate final count
  const finalCount = Math.round(baseParticles * multiplier);
  
  // Validate against tier limits
  const tierMax = SST_V2_PERFORMANCE_TARGETS.PARTICLES[`${qualityTier}_MAX`];
  const clampedCount = Math.min(finalCount, tierMax);
  
  return {
    stageName,
    qualityTier,
    baseParticles,
    multiplier,
    calculated: finalCount,
    final: clampedCount,
    clamped: finalCount !== clampedCount
  };
}

// ✅ QUALITY TRANSITION: Smooth tier changes
export function validateQualityTransition(currentTier, targetTier, performanceMetrics) {
  const { fps, jankRatio } = performanceMetrics;
  const thresholds = SST_V2_PERFORMANCE_TARGETS.FPS_THRESHOLDS;
  
  // Validate tier upgrade requirements
  if (targetTier === 'ULTRA') {
    if (fps < thresholds.ULTRA_REQUIRED || jankRatio > 0.05) {
      return {
        allowed: false,
        reason: `ULTRA requires ${thresholds.ULTRA_REQUIRED}+ FPS and <5% jank`,
        recommendation: 'HIGH'
      };
    }
  }
  
  if (targetTier === 'HIGH') {
    if (fps < thresholds.HIGH_REQUIRED) {
      return {
        allowed: false,
        reason: `HIGH requires ${thresholds.HIGH_REQUIRED}+ FPS`,
        recommendation: 'MEDIUM'
      };
    }
  }
  
  // Validate downgrade necessity
  if (currentTier === 'ULTRA' && fps < thresholds.HIGH_REQUIRED) {
    return {
      allowed: true,
      necessary: true,
      reason: 'Performance dropped below HIGH threshold',
      recommendation: 'HIGH'
    };
  }
  
  return {
    allowed: true,
    necessary: false,
    reason: 'Transition meets performance requirements'
  };
}

// ✅ DEVICE OPTIMIZATION: Hardware-aware defaults
export function getOptimalQualityForDevice(deviceInfo) {
  const { deviceType, webglVersion, renderer, memory } = deviceInfo;
  
  // Device class determination
  let deviceClass = 'DESKTOP';
  if (deviceType === 'mobile') deviceClass = 'MOBILE';
  else if (deviceType === 'tablet') deviceClass = 'TABLET';
  else if (deviceType === 'laptop') deviceClass = 'LAPTOP';
  
  const deviceConfig = SST_V2_DEVICE_CLASSES[deviceClass];
  
  // Performance class assessment
  let performanceClass = 'MEDIUM';
  if (webglVersion === 'WebGL1') performanceClass = 'LOW';
  else if (renderer && renderer.includes('Intel')) performanceClass = 'MEDIUM';
  else if (memory && memory >= 8) performanceClass = 'HIGH';
  
  // Determine optimal tier
  let optimalTier = deviceConfig.defaultTier;
  if (performanceClass === 'LOW') optimalTier = 'LOW';
  else if (performanceClass === 'HIGH' && deviceClass !== 'MOBILE') optimalTier = 'HIGH';
  
  return {
    deviceClass,
    performanceClass,
    optimalTier,
    maxTier: deviceConfig.maxTier,
    dprLimit: deviceConfig.dprLimit,
    characteristics: deviceConfig.characteristics
  };
}

// ✅ SHOWCASE MODE: 17K particle capability
export function enableShowcaseMode(currentMetrics) {
  const { fps, jankRatio, deviceClass } = currentMetrics;
  
  const requirements = {
    minFps: SST_V2_PERFORMANCE_TARGETS.FPS_THRESHOLDS.ULTRA_REQUIRED,
    maxJank: 0.03, // Even stricter for showcase
    allowedDevices: ['DESKTOP', 'LAPTOP']
  };
  
  const canEnable = 
    fps >= requirements.minFps &&
    jankRatio <= requirements.maxJank &&
    requirements.allowedDevices.includes(deviceClass);
  
  return {
    canEnable,
    requirements,
    currentMetrics,
    recommendation: canEnable ? 'ULTRA' : 'HIGH'
  };
}

// ✅ VALIDATION FUNCTIONS: Quality system integrity
export function validateQualitySystem() {
  const issues = [];
  
  // Validate tier progression
  const expectedProgression = [0.6, 0.8, 1.0, 1.2];
  SST_V2_QUALITY_TIERS.forEach((tier, index) => {
    const multiplier = SST_V2_QUALITY_MULTIPLIERS[tier].particles;
    if (multiplier !== expectedProgression[index]) {
      issues.push(`Tier ${tier} multiplier mismatch: ${multiplier} vs ${expectedProgression[index]}`);
    }
  });
  
  // Validate particle limits
  const particleLimits = SST_V2_PERFORMANCE_TARGETS.PARTICLES;
  if (particleLimits.ULTRA_MAX !== 17000) {
    issues.push(`ULTRA max particles should be 17000, got ${particleLimits.ULTRA_MAX}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    systemIntegrity: issues.length === 0
  };
}

// ✅ DEVELOPMENT: Global access and testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.SST_V2_QUALITY = {
    QUALITY_TIERS: SST_V2_QUALITY_TIERS,
    QUALITY_MULTIPLIERS: SST_V2_QUALITY_MULTIPLIERS,
    PERFORMANCE_TARGETS: SST_V2_PERFORMANCE_TARGETS,
    DEVICE_CLASSES: SST_V2_DEVICE_CLASSES,
    
    // Calculation functions
    calculateParticleBudget,
    validateQualityTransition,
    getOptimalQualityForDevice,
    enableShowcaseMode,
    validateQualitySystem,
    
    // Quick tests
    testParticleBudget: () => {
      console.log('🧪 Testing particle budget calculations...');
      
      const tests = [
        ['genesis', 'LOW'],
        ['velocity', 'HIGH'], 
        ['transcendence', 'ULTRA']
      ];
      
      tests.forEach(([stage, tier]) => {
        const result = calculateParticleBudget(stage, tier);
        console.log(`📊 ${stage} @ ${tier}:`, result);
      });
    },
    
    testShowcaseMode: () => {
      const testMetrics = {
        fps: 65,
        jankRatio: 0.02,
        deviceClass: 'DESKTOP'
      };
      
      const result = enableShowcaseMode(testMetrics);
      console.log('🚀 Showcase mode test:', result);
      return result;
    },
    
    validateSystem: () => {
      const result = validateQualitySystem();
      console.log('🧪 Quality system validation:', result);
      return result;
    }
  };
  
  console.log('🎨 SST v2.0 Quality Authority: Performance and scaling definitions loaded');
  console.log('🔧 Available: window.SST_V2_QUALITY');
  console.log('🧪 Test: window.SST_V2_QUALITY.validateSystem()');
}

export default {
  QUALITY_TIERS: SST_V2_QUALITY_TIERS,
  QUALITY_MULTIPLIERS: SST_V2_QUALITY_MULTIPLIERS,
  PERFORMANCE_TARGETS: SST_V2_PERFORMANCE_TARGETS,
  DEVICE_CLASSES: SST_V2_DEVICE_CLASSES,
  
  calculate: {
    particleBudget: calculateParticleBudget
  },
  
  validate: {
    qualityTransition: validateQualityTransition,
        qualitySystem: validateQualitySystem
    },
  
  optimize: {
    forDevice: getOptimalQualityForDevice,
    showcaseMode: enableShowcaseMode
  }
};// SST v2.0 Quality Tier Authority
