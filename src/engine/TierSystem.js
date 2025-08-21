// engine/TierSystem.js 
// Tier distribution and behavior application engine
// Version: 3.0.0 | Date: 2025-07-23

import { SST_V3_CONFIG, isFeatureEnabled } from "@/config/sst3/sst-v3.0-config.js";
import {
  TIER_BEHAVIORS,
  TIER_BEHAVIOR_SETS,
  STAGE_BEHAVIOR_OVERRIDES,
  getBehaviorUniforms } from
"@/config/sst3/tier-behaviors.js"; // @doctor:4b-disposers
const __doctorDisposers = [];
export class TierSystem {
  constructor() {
    this.config = SST_V3_CONFIG;
    this.behaviors = TIER_BEHAVIORS;
    this.behaviorSets = TIER_BEHAVIOR_SETS;
    this.stageOverrides = STAGE_BEHAVIOR_OVERRIDES;

    // Cache for computed distributions
    this.distributionCache = new Map();

    // Performance tracking
    this.metrics = {
      distributionsCalculated: 0,
      behaviorsApplied: 0,
      cacheHits: 0,
      averageDistributionTime: 0
    };

    console.log("🎭 TierSystem: Initialized with SST v3.0 configuration");
  }

  distributeParticles(totalCount, stageName) {
    const startTime = performance.now();

    // Check cache first
    const cacheKey = `${stageName}-${totalCount}`;
    if (this.distributionCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.distributionCache.get(cacheKey);
    }

    const stage = this.config.stages[stageName];
    if (!stage) {
      throw new Error(`TierSystem: Unknown stage "${stageName}"`);
    }

    // Calculate distribution based on tier ratios
    const distribution = stage.tierRatios.map((ratio) =>
    Math.round(totalCount * ratio)
    );

    // Ensure exact total count (adjust tier 0 if needed)
    const sum = distribution.reduce((a, b) => a + b, 0);
    if (sum !== totalCount) {
      distribution[0] += totalCount - sum;
    }

    // Create detailed distribution object
    const result = {
      stageName,
      totalCount,
      tiers: distribution.map((count, index) => ({
        tier: index,
        name: this.config.tierSystem.names[index],
        count,
        ratio: stage.tierRatios[index],
        startIndex: distribution.slice(0, index).reduce((a, b) => a + b, 0),
        endIndex: distribution.slice(0, index + 1).reduce((a, b) => a + b, 0) - 1
      }))
    };

    // Cache the result
    this.distributionCache.set(cacheKey, result);

    // Update metrics
    this.metrics.distributionsCalculated++;
    const elapsed = performance.now() - startTime;
    this.metrics.averageDistributionTime =
    (this.metrics.averageDistributionTime * (this.metrics.distributionsCalculated - 1) + elapsed) /
    this.metrics.distributionsCalculated;

    return result;
  }

  getParticleTier(particleIndex, distribution) {
    for (const tierInfo of distribution.tiers) {
      if (particleIndex >= tierInfo.startIndex && particleIndex <= tierInfo.endIndex) {
        return tierInfo.tier;
      }
    }
    return 0;
  }

  applyTierBehavior(particleData, stageName, rng) {
    const { index, tier } = particleData;
    const stage = this.config.stages[stageName];
    if (!stage) return particleData;

    // Get behaviors for this tier
    let behaviors = [...(this.behaviorSets[tier] || [])];

    // Apply stage-specific overrides
    if (this.stageOverrides[stageName]) {
      const override = this.stageOverrides[stageName];
      if (override[tier]) {
        behaviors = Array.isArray(override[tier]) ? override[tier] : behaviors;
      }
      if (override.all) {
        particleData.stageModifiers = override.all;
      }
    }

    // Core tier properties
    const tierConfig = {
      tier,
      behaviors,
      sizeMultiplier: this.getTierSize(tier),
      opacityRange: this.getTierOpacity(tier),
      spriteIndex: this.selectSprite(tier, stage, rng),
      behaviorIntensity: 1.0
    };

    // Apply clustering for tier 0 if enabled
    if (tier === 0 && isFeatureEnabled("noiseClusteringTier1")) {
      tierConfig.clustering = this.applyNoiseClustering(
        particleData.position,
        rng
      );
    }

    // Apply center weighting for tier 3 if enabled
    if (tier === 3 && isFeatureEnabled("centerWeightingTier4")) {
      tierConfig.centerWeight = this.applyCenterWeighting(
        particleData.position,
        stage.brainCoordinates
      );
    }

    // Merge with particle data
    Object.assign(particleData, tierConfig);

    this.metrics.behaviorsApplied++;

    return particleData;
  }

  getTierSize(tier) {
    return this.config.tierSystem.sizeMultipliers[tier] || 1.0;
  }

  getTierOpacity(tier) {
    return this.config.tierSystem.opacityRanges[tier] || [0.5, 1.0];
  }

  selectSprite(tier, stage, rng) {
    const tierKey = `tier${tier + 1}`;
    const sprites = stage.sprites[tierKey];

    if (!sprites || sprites.length === 0) {
      console.warn(`TierSystem: No sprites defined for ${tierKey} in ${stage.name}`);
      return 0;
    }

    if (tier <= 1 && sprites.length === 1) {
      return sprites[0];
    }

    const index = Math.floor(rng() * sprites.length);
    return sprites[index];
  }

  applyNoiseClustering(position, rng) {
    const params = {
      noiseScale: 0.1,
      clusterThreshold: 0.3,
      densityMultiplier: 0.8
    };

    const noise =
    Math.sin(position.x * params.noiseScale * 5.0) *
    Math.sin(position.y * params.noiseScale * 7.0) *
    Math.sin(position.z * params.noiseScale * 3.0) *
    0.5 + 0.5;

    if (noise > params.clusterThreshold) {
      return {
        inCluster: true,
        clusterStrength: (noise - params.clusterThreshold) / (1 - params.clusterThreshold),
        adjustedPosition: {
          x: position.x * params.densityMultiplier,
          y: position.y * params.densityMultiplier,
          z: position.z * params.densityMultiplier
        }
      };
    }

    return {
      inCluster: false,
      clusterStrength: 0,
      adjustedPosition: position
    };
  }

  applyCenterWeighting(position, brainCoordinates) {
    if (!brainCoordinates || !brainCoordinates.center) {
      return { weight: 0, adjustedPosition: position };
    }

    const center = brainCoordinates.center;
    const radius = brainCoordinates.radius || 20;

    const dx = position.x - center[0];
    const dy = position.y - center[1];
    const dz = position.z - center[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const weight = Math.exp(-distance / radius);
    const weightStrength = 0.7;

    const adjustedPosition = {
      x: position.x * (1 - weight * weightStrength) + center[0] * weight * weightStrength,
      y: position.y * (1 - weight * weightStrength) + center[1] * weight * weightStrength,
      z: position.z * (1 - weight * weightStrength) + center[2] * weight * weightStrength
    };

    return {
      weight,
      distance,
      adjustedPosition
    };
  }

  getStageShaderUniforms(stageName) {
    const stage = this.config.stages[stageName];
    if (!stage) return {};

    const uniforms = {
      uTierCount: { value: this.config.tierSystem.count },
      uTierSizes: { value: this.config.tierSystem.sizeMultipliers },
      uTierOpacityMins: { value: this.config.tierSystem.opacityRanges.map((r) => r[0]) },
      uTierOpacityMaxs: { value: this.config.tierSystem.opacityRanges.map((r) => r[1]) },

      uEnableGaussian: { value: isFeatureEnabled("gaussianFalloff") ? 1.0 : 0.0 },
      uEnableClustering: { value: isFeatureEnabled("noiseClusteringTier1") ? 1.0 : 0.0 },
      uEnableCenterWeight: { value: isFeatureEnabled("centerWeightingTier4") ? 1.0 : 0.0 },

      uBrainCenter: { value: stage.brainCoordinates.center || [0, 0, 0] },
      uBrainRadius: { value: stage.brainCoordinates.radius || 20 }
    };

    const allBehaviors = new Set();
    Object.values(this.behaviorSets).forEach((behaviors) => {
      behaviors.forEach((b) => allBehaviors.add(b));
    });

    const behaviorUniforms = getBehaviorUniforms(Array.from(allBehaviors));
    Object.assign(uniforms, behaviorUniforms);

    return uniforms;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.distributionCache.size,
      cacheEfficiency: this.metrics.cacheHits / (
      this.metrics.distributionsCalculated + this.metrics.cacheHits) || 0
    };
  }

  clearCache() {
    this.distributionCache.clear();
    console.log("🎭 TierSystem: Distribution cache cleared");
  }

  debugTierDistribution(stageName, particleCount = null) {
    const stage = this.config.stages[stageName];
    if (!stage) {
      console.error(`Stage "${stageName}" not found`);
      return;
    }

    const count = particleCount || stage.particles;
    const distribution = this.distributeParticles(count, stageName);

    console.group(`🎭 Tier Distribution for ${stageName}`);
    console.table(distribution.tiers.map((t) => ({
      Tier: t.tier,
      Name: t.name,
      Count: t.count,
      Percentage: `${(t.ratio * 100).toFixed(1)}%`,
      "Index Range": `${t.startIndex}-${t.endIndex}`
    })));
    console.groupEnd();

    return distribution;
  }
}

// Create singleton instance
export const tierSystem = new TierSystem();

// Development helpers
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.tierSystem = tierSystem;
  window.debugTiers = (stage) => tierSystem.debugTierDistribution(stage);
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}