// src/utils/webgl/StagePerformanceModes.js
// STAGE-SPECIFIC PERFORMANCE MODES - Quality overrides per narrative stage

// Stage-specific performance configurations
const STAGE_PERFORMANCE_CONFIGS = {
  0: {
    // Genesis
    name: 'genesis',
    overrideQuality: null, // Use system quality
    forceEffects: null,
    particleMultiplier: 1.0,
    specialFeatures: ['terminal_effect'],
    description: 'Minimal load for calm introduction',
  },

  1: {
    // Awakening
    name: 'awakening',
    overrideQuality: null,
    forceEffects: ['particle_bursts'],
    particleMultiplier: 1.0,
    specialFeatures: ['erratic_movement', 'c64_colors'],
    description: 'Moderate load with burst effects',
  },

  2: {
    // Structure
    name: 'structure',
    overrideQuality: null,
    forceEffects: ['grid_snapping'],
    particleMultiplier: 1.0,
    specialFeatures: ['memory_fragments', 'military_formation'],
    description: 'Structured patterns emerge',
  },

  3: {
    // Learning
    name: 'learning',
    overrideQuality: null,
    forceEffects: ['neural_connections'],
    particleMultiplier: 1.1, // Slight increase for neural effect
    specialFeatures: ['metacurtis_silhouette', 'ai_emergence'],
    description: 'Neural complexity increases',
  },

  4: {
    // Building
    name: 'building',
    overrideQuality: 'HIGH', // Force HIGH for complex building patterns
    forceEffects: ['swarm_intelligence', 'geometric_formation'],
    particleMultiplier: 1.2,
    specialFeatures: ['architectural_patterns', 'ai_voice'],
    description: 'Complex system construction',
  },

  5: {
    // Mastery
    name: 'mastery',
    overrideQuality: 'ULTRA', // Force ULTRA for transcendence
    forceEffects: ['synchronized_consciousness', 'fractal_patterns', 'bloom_effect'],
    particleMultiplier: 1.3, // Maximum particles and effects
    specialFeatures: ['signature_pattern', 'full_ai_interaction', 'performance_demo'],
    description: 'Maximum fidelity for digital transcendence',
  },
};

// Quality tier definitions with stage awareness
const QUALITY_TIERS = {
  ULTRA: {
    maxParticles: 16000,
    particleSize: 3.0,
    enableBloom: true,
    enableAdvancedShaders: true,
    enableMemoryFragments: true,
    enableAIInteraction: true,
    shaderComplexity: 'high',
    frameRateTarget: 60,
  },

  HIGH: {
    maxParticles: 12000,
    particleSize: 2.5,
    enableBloom: true,
    enableAdvancedShaders: true,
    enableMemoryFragments: true,
    enableAIInteraction: true,
    shaderComplexity: 'medium',
    frameRateTarget: 60,
  },

  MEDIUM: {
    maxParticles: 8000,
    particleSize: 2.0,
    enableBloom: false,
    enableAdvancedShaders: false,
    enableMemoryFragments: true,
    enableAIInteraction: false,
    shaderComplexity: 'low',
    frameRateTarget: 45,
  },

  LOW: {
    maxParticles: 4000,
    particleSize: 1.5,
    enableBloom: false,
    enableAdvancedShaders: false,
    enableMemoryFragments: false,
    enableAIInteraction: false,
    shaderComplexity: 'minimal',
    frameRateTarget: 30,
  },
};

// Performance monitoring thresholds
const PERFORMANCE_THRESHOLDS = {
  fps: {
    excellent: 60,
    good: 45,
    poor: 30,
    critical: 20,
  },
  memory: {
    excellent: 100, // MB
    good: 200,
    poor: 400,
    critical: 600,
  },
  gpu: {
    excellent: 50, // % utilization
    good: 70,
    poor: 85,
    critical: 95,
  },
};

class StagePerformanceManager {
  constructor() {
    this.currentStage = 0;
    this.systemQuality = 'HIGH';
    this.effectiveQuality = 'HIGH';
    this.performanceHistory = [];
    this.overrideActive = false;
    this.forceNextStageQuality = null;
  }

  // Calculate effective quality for current stage
  calculateEffectiveQuality(stage, systemQuality, currentFPS = 60, memoryUsage = 0) {
    const stageConfig = STAGE_PERFORMANCE_CONFIGS[stage] || STAGE_PERFORMANCE_CONFIGS[0];

    // Check if stage forces a specific quality
    if (stageConfig.overrideQuality) {
      console.log(
        `🎭 Stage ${stage} (${stageConfig.name}) forcing quality: ${stageConfig.overrideQuality}`
      );
      this.overrideActive = true;
      return this.validateQualityOverride(stageConfig.overrideQuality, currentFPS, memoryUsage);
    }

    // Check for manual force override
    if (this.forceNextStageQuality) {
      const forcedQuality = this.forceNextStageQuality;
      this.forceNextStageQuality = null;
      console.log(`🔧 Manually forcing quality for stage ${stage}: ${forcedQuality}`);
      return this.validateQualityOverride(forcedQuality, currentFPS, memoryUsage);
    }

    this.overrideActive = false;
    return systemQuality;
  }

  // Validate that override quality is sustainable
  validateQualityOverride(requestedQuality, currentFPS, memoryUsage) {
    const qualityTier = QUALITY_TIERS[requestedQuality];

    if (!qualityTier) {
      console.warn(`❌ Invalid quality tier: ${requestedQuality}, falling back to HIGH`);
      return 'HIGH';
    }

    // Check if system can handle the requested quality
    const canHandle = this.canSystemHandleQuality(requestedQuality, currentFPS, memoryUsage);

    if (!canHandle) {
      const fallbackQuality = this.getFallbackQuality(requestedQuality);
      console.warn(
        `⚠️ System cannot handle ${requestedQuality}, falling back to ${fallbackQuality}`
      );
      return fallbackQuality;
    }

    return requestedQuality;
  }

  // Check if system can handle requested quality
  canSystemHandleQuality(quality, currentFPS, memoryUsage) {
    const tier = QUALITY_TIERS[quality];
    const thresholds = PERFORMANCE_THRESHOLDS;

    // FPS check
    if (currentFPS < tier.frameRateTarget * 0.8) {
      console.log(`📊 FPS too low: ${currentFPS} < ${tier.frameRateTarget * 0.8}`);
      return false;
    }

    // Memory check
    if (memoryUsage > thresholds.memory.poor) {
      console.log(`💾 Memory usage too high: ${memoryUsage}MB > ${thresholds.memory.poor}MB`);
      return false;
    }

    return true;
  }

  // Get fallback quality tier
  getFallbackQuality(requestedQuality) {
    const qualityLevels = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
    const currentIndex = qualityLevels.indexOf(requestedQuality);

    if (currentIndex > 0) {
      return qualityLevels[currentIndex - 1];
    }

    return 'LOW'; // Minimum fallback
  }

  // Apply stage-specific modifications to particle config
  applyStageModifications(baseConfig, stage) {
    const stageConfig = STAGE_PERFORMANCE_CONFIGS[stage] || STAGE_PERFORMANCE_CONFIGS[0];
    const effectiveQuality = this.getEffectiveQuality();
    const qualityTier = QUALITY_TIERS[effectiveQuality];

    return {
      ...baseConfig,
      totalParticles: Math.floor(
        Math.min(
          baseConfig.totalParticles * stageConfig.particleMultiplier,
          qualityTier.maxParticles
        )
      ),
      particleSize: qualityTier.particleSize,
      enabledEffects: stageConfig.forceEffects || [],
      specialFeatures: stageConfig.specialFeatures || [],
      qualityOverride: stageConfig.overrideQuality,
      effectiveQuality,
      stageDescription: stageConfig.description,
    };
  }

  // Force quality for next stage (manual override)
  forceQualityForNextStage(quality) {
    if (QUALITY_TIERS[quality]) {
      this.forceNextStageQuality = quality;
      console.log(`🎛️ Quality ${quality} will be forced for next stage`);
    } else {
      console.error(`❌ Invalid quality tier: ${quality}`);
    }
  }

  // Get current effective quality
  getEffectiveQuality() {
    return this.effectiveQuality;
  }

  // Update stage and recalculate quality
  updateStage(stage, systemQuality, currentFPS = 60, memoryUsage = 0) {
    this.currentStage = stage;
    this.systemQuality = systemQuality;
    this.effectiveQuality = this.calculateEffectiveQuality(
      stage,
      systemQuality,
      currentFPS,
      memoryUsage
    );

    // Log performance history
    this.performanceHistory.push({
      timestamp: Date.now(),
      stage,
      systemQuality,
      effectiveQuality: this.effectiveQuality,
      fps: currentFPS,
      memoryUsage,
      overrideActive: this.overrideActive,
    });

    // Keep only last 100 entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }

    return this.effectiveQuality;
  }

  // Get stage configuration
  getStageConfig(stage) {
    return STAGE_PERFORMANCE_CONFIGS[stage] || STAGE_PERFORMANCE_CONFIGS[0];
  }

  // Get quality tier configuration
  getQualityTierConfig(quality) {
    return QUALITY_TIERS[quality] || QUALITY_TIERS.HIGH;
  }

  // Check if specific effect is enabled for current stage/quality
  isEffectEnabled(effectName) {
    const stageConfig = this.getStageConfig(this.currentStage);
    const qualityTier = this.getQualityTierConfig(this.effectiveQuality);

    // Check if effect is forced by stage
    if (stageConfig.forceEffects && stageConfig.forceEffects.includes(effectName)) {
      return true;
    }

    // Check quality tier permissions
    switch (effectName) {
      case 'bloom_effect':
        return qualityTier.enableBloom;
      case 'advanced_shaders':
        return qualityTier.enableAdvancedShaders;
      case 'memory_fragments':
        return qualityTier.enableMemoryFragments;
      case 'ai_interaction':
        return qualityTier.enableAIInteraction;
      default:
        return true; // Unknown effects default to enabled
    }
  }

  // Get performance report
  getPerformanceReport() {
    const recent = this.performanceHistory.slice(-10);
    const avgFPS = recent.reduce((sum, entry) => sum + entry.fps, 0) / recent.length;
    const avgMemory = recent.reduce((sum, entry) => sum + entry.memoryUsage, 0) / recent.length;

    return {
      currentStage: this.currentStage,
      systemQuality: this.systemQuality,
      effectiveQuality: this.effectiveQuality,
      overrideActive: this.overrideActive,
      recentAvgFPS: Math.round(avgFPS),
      recentAvgMemory: Math.round(avgMemory),
      performanceRating: this.getPerformanceRating(avgFPS, avgMemory),
      recommendedActions: this.getRecommendedActions(avgFPS, avgMemory),
    };
  }

  // Get performance rating
  getPerformanceRating(fps, memory) {
    const fpsThresholds = PERFORMANCE_THRESHOLDS.fps;
    const memoryThresholds = PERFORMANCE_THRESHOLDS.memory;

    if (fps >= fpsThresholds.excellent && memory <= memoryThresholds.excellent) {
      return 'EXCELLENT';
    } else if (fps >= fpsThresholds.good && memory <= memoryThresholds.good) {
      return 'GOOD';
    } else if (fps >= fpsThresholds.poor && memory <= memoryThresholds.poor) {
      return 'POOR';
    } else {
      return 'CRITICAL';
    }
  }

  // Get recommended actions based on performance
  getRecommendedActions(fps, memory) {
    const actions = [];
    const fpsThresholds = PERFORMANCE_THRESHOLDS.fps;
    const memoryThresholds = PERFORMANCE_THRESHOLDS.memory;

    if (fps < fpsThresholds.poor) {
      actions.push('Reduce particle count');
      actions.push('Disable advanced effects');
    }

    if (memory > memoryThresholds.poor) {
      actions.push('Enable frustum culling');
      actions.push('Reduce particle history');
    }

    if (fps < fpsThresholds.critical || memory > memoryThresholds.critical) {
      actions.push('Force LOW quality mode');
      actions.push('Disable narrative mode');
    }

    return actions;
  }

  // Reset performance manager
  reset() {
    this.currentStage = 0;
    this.systemQuality = 'HIGH';
    this.effectiveQuality = 'HIGH';
    this.performanceHistory = [];
    this.overrideActive = false;
    this.forceNextStageQuality = null;
  }
}

// Export singleton instance
export const stagePerformanceManager = new StagePerformanceManager();

// Export configurations
export {
  STAGE_PERFORMANCE_CONFIGS,
  QUALITY_TIERS,
  PERFORMANCE_THRESHOLDS,
  StagePerformanceManager,
};

// Development global access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.stagePerformanceManager = stagePerformanceManager;
  window.STAGE_PERFORMANCE_CONFIGS = STAGE_PERFORMANCE_CONFIGS;
}
