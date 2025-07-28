// src/engine/ConsciousnessEngine.js
// Enhanced consciousness particle engine with tier system support
// Version: 3.0.1 | Date: 2025-01-24

import seedrandom from "seedrandom";
import { SST_V3_CONFIG, getStageByName } from "@/config/sst3/sst-v3.0-config.js";
import { tierSystem } from "./TierSystem.js";
import { ConsciousnessPatterns } from "@/components/webgl/consciousness/ConsciousnessPatterns.js";
import { getPointSpriteAtlasSingleton } from "@/components/webgl/consciousness/PointSpriteAtlas.js";
import { markBlueprint } from '@/utils/performance/Telemetry.js';
import { DEV_LOG } from '@/utils/featureFlags.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

// Schema version for cache invalidation
const SCHEMA_VERSION = "v3.0.1";

// Hoist static maps for performance
const BEHAVIOR_MAP = Object.freeze({
  none: 0,
  drift: 1,
  cluster: 2,
  orbital: 3,
  structural: 4,
  twinkle: 5,
  pulse: 6,
  anchor: 7,
  prominent: 8,
  connected: 9,
  anatomical: 10
});

const QUALITY_MULTIPLIERS = Object.freeze({
  LOW: 0.4,
  MEDIUM: 0.6,
  HIGH: 0.9,
  ULTRA: 1.0
});

const STAGE_AFFINITY_BOOSTS = Object.freeze({
  genesis: 0.1,
  velocity: 0.3,
  transcendence: 0.4
});

const ATMOSPHERIC_SPREADS = Object.freeze([40, 30, 20, 15]); // Tier 0-3

export class ConsciousnessEngine {
  constructor() {
    this.isInitialized = false;
    this.blueprintCache = new Map();
    this.currentStage = "genesis";
    this.currentQuality = "HIGH";

    // Tier system integration
    this.tierSystem = tierSystem;

    // Event handler references for cleanup
    this._aqsHandler = null;

    // Pre-allocated arrays for max performance (reusable)
    this._preallocatedArrays = null;
    this._maxParticlesAllocated = 0;

    // Performance tracking with optimized metrics
    this.metrics = {
      blueprintsGenerated: 0,
      cacheHits: 0,
      totalGenerationTime: 0,
      particlesGenerated: 0
    };

    // Listen for quality changes
    this.listenToAQS();

    console.log("🧠 ConsciousnessEngine v3.0.1: Initialized with optimizations");
  }

  /**
   * Listen for adaptive quality system changes (with proper cleanup)
   */
  listenToAQS() {
    if (typeof window === "undefined" || !window.addEventListener) return;

    this._aqsHandler = (event) => {
      if (!event?.detail?.tier) {
        console.warn("🧠 Engine: Invalid AQS event", event);
        return;
      }

      const { tier, particles } = event.detail;
      const oldTier = this.currentQuality;
      this.currentQuality = tier;

      console.log(`🧠 Engine: Quality changed ${oldTier} → ${tier}`);
      this.clearCache();

      window.dispatchEvent(new CustomEvent("engineQualityChange", {
        detail: { tier, particles, stage: this.currentStage }
      }));
    };

    window.addEventListener("aqsQualityChange", this._aqsHandler);
  }

  /**
   * Get deterministic RNG for a stage/tier combination
   */
  getRNG(stageName, tier = null) {
    const seed = tier !== null
      ? `${stageName}|${tier}|${SCHEMA_VERSION}`
      : `${stageName}|${SCHEMA_VERSION}`;
    return seedrandom(seed);
  }

  /**
   * Get active particle count for a stage
   */
  getActiveParticleCount(stageName) {
    // First try SST v3.0 config
    const stageConfig = getStageByName(stageName);
    if (stageConfig?.particles) {
      const baseCount = stageConfig.particles;
      const multiplier = QUALITY_MULTIPLIERS[this.currentQuality] || 0.9;
      const maxParticles = SST_V3_CONFIG.performance.maxParticles || 17000;
      return Math.min(Math.round(baseCount * multiplier), maxParticles);
    }

    // Fallback to Canonical if available
    const canonicalStage = Canonical?.stages?.[stageName];
    if (canonicalStage?.particles) {
      const baseCount = canonicalStage.particles;
      const multiplier = QUALITY_MULTIPLIERS[this.currentQuality] || 0.9;
      const maxParticles = Canonical?.performance?.maxParticles || 15000;
      return Math.min(Math.round(baseCount * multiplier), maxParticles);
    }

    // Ultimate fallback
    return 2000;
  }

  /**
   * Alternative method name for compatibility
   */
  getParticleBudgetForStage(stageName) {
    return this.getActiveParticleCount(stageName);
  }

  /**
   * Generate complete blueprint with tier support
   */
  async generateConstellationParticleData(particleCount, options = {}) {
    const startTime = performance.now();
    const { stageName = "genesis" } = options;
    this.currentStage = stageName;

    const maxParticles = SST_V3_CONFIG.performance.maxParticles || 17000;
    const safeParticleCount = Math.min(particleCount, maxParticles);

    const cacheKey = `${stageName}-${this.currentQuality}-${safeParticleCount}-${SCHEMA_VERSION}-${this.tierSystem.metrics.distributionsCalculated}`;

    if (this.blueprintCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      if (DEV_LOG) console.log(`🧠 Engine: Using cached blueprint for ${cacheKey}`);
      return this.blueprintCache.get(cacheKey);
    }

    if (DEV_LOG) console.log(`🧠 Engine: Generating new v3.0.1 blueprint for ${stageName} (${safeParticleCount} particles)`);

    const stageConfig = getStageByName(stageName);
    if (!stageConfig) {
      console.error(`🧠 Engine: Unknown stage "${stageName}"`);
      return null;
    }

    const distribution = this.tierSystem.distributeParticles(safeParticleCount, stageName);
    const arrays = this.allocateArrays(safeParticleCount);
    const brainPattern = ConsciousnessPatterns?.getBrainRegionInfo?.(stageName) || null;
    if (!brainPattern) console.warn(`🧠 Engine: No brain pattern for stage ${stageName}`);

    const atlas = getPointSpriteAtlasSingleton?.() || null;
    if (!atlas) console.warn("🧠 Engine: No sprite atlas available");

    let particleIndex = 0;
    for (const tierInfo of distribution.tiers) {
      const tierRNG = this.getRNG(stageName, tierInfo.tier);
      for (let i = 0; i < tierInfo.count && particleIndex < safeParticleCount; i++) {
        this.generateTierAwareParticle(
          particleIndex,
          tierInfo,
          stageName,
          stageConfig,
          brainPattern,
          tierRNG,
          atlas,
          arrays
        );
        particleIndex++;
      }
    }

    const blueprint = Object.freeze({
      stageName,
      stageConfig,
      quality: this.currentQuality,
      particleCount: safeParticleCount,
      activeCount: particleIndex,
      maxParticles,
      distribution,
      ...arrays,
      brainPattern,
      timestamp: Date.now(),
      version: SCHEMA_VERSION
    });

    this.blueprintCache.set(cacheKey, blueprint);
    this.limitCacheSize();
    this.metrics.blueprintsGenerated++;
    this.metrics.particlesGenerated += safeParticleCount;
    const elapsed = performance.now() - startTime;
    this.metrics.totalGenerationTime += elapsed;
    if (DEV_LOG) console.log(`🧠 Engine: Blueprint generated in ${elapsed.toFixed(2)}ms`);
    markBlueprint(elapsed, safeParticleCount, stageName);

    return blueprint;
  }

  /**
   * Allocate typed arrays efficiently (with reuse option)
   */
  allocateArrays(particleCount) {
    if (this._preallocatedArrays && this._maxParticlesAllocated >= particleCount) {
      return this._preallocatedArrays;
    }

    const arrays = {
      atmosphericPositions: new Float32Array(particleCount * 3),
      allenAtlasPositions:  new Float32Array(particleCount * 3),
      animationSeeds:       new Float32Array(particleCount * 3),
      sizeMultipliers:      new Float32Array(particleCount),
      opacityData:          new Float32Array(particleCount),
      atlasIndices:         new Float32Array(particleCount),
      tierData:             new Float32Array(particleCount),
      behaviorData:         new Float32Array(particleCount * 3),
      storyAffinity:        new Float32Array(particleCount),
      memoryFragment:       new Float32Array(particleCount),
      fusionMoment:         new Float32Array(particleCount)
    };

    if (particleCount >= SST_V3_CONFIG.performance.maxParticles * 0.8) {
      this._preallocatedArrays = arrays;
      this._maxParticlesAllocated = particleCount;
    }
    return arrays;
  }

  /**
   * Get atmospheric spread distance for a tier
   * @param {number} tier - Tier index (0-3)
   * @returns {number} Spread distance
   */
  getAtmosphericSpread(tier) {
    return ATMOSPHERIC_SPREADS[Math.floor(tier)] || 20;
  }

  /**
   * Generate individual particle with tier awareness
   */
  generateTierAwareParticle(
    index,
    tierInfo,
    stageName,
    stageConfig,
    brainPattern,
    rng,
    atlas,
    arrays
  ) {
    const i3 = index * 3;

    // Create particle data object for tier system
    const particleData = {
      index,
      tier: tierInfo.tier,
      position: { x: 0, y: 0, z: 0 }
    };

    // Generate base atmospheric position
    const atmosphericSpread = this.getAtmosphericSpread(tierInfo.tier);
    const u = rng();
    const v = rng();
    const theta = 2.0 * Math.PI * u;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = atmosphericSpread * Math.cbrt(rng());
    const sinPhi = Math.sin(phi);
    particleData.position.x = r * sinPhi * Math.cos(theta);
    particleData.position.y = r * sinPhi * Math.sin(theta);
    particleData.position.z = r * Math.cos(phi) * 0.6;

    // Apply tier behaviors
    const tierEnhanced = this.tierSystem.applyTierBehavior(particleData, stageName, rng);

    // Apply clustering if enabled
    if (tierEnhanced.clustering && tierEnhanced.clustering.inCluster) {
      particleData.position = tierEnhanced.clustering.adjustedPosition;
    }

    // Store atmospheric position
    arrays.atmosphericPositions[i3]     = particleData.position.x;
    arrays.atmosphericPositions[i3 + 1] = particleData.position.y;
    arrays.atmosphericPositions[i3 + 2] = particleData.position.z;

    // Generate brain position (Allen Atlas target)
    let brainPosition = this.generateBrainPosition(
      tierInfo.tier,
      brainPattern,
      stageConfig.brainCoordinates,
      rng
    );

    // Apply center weighting if enabled
    if (tierEnhanced.centerWeight) {
      brainPosition = tierEnhanced.centerWeight.adjustedPosition;
    }

    arrays.allenAtlasPositions[i3]     = brainPosition.x;
    arrays.allenAtlasPositions[i3 + 1] = brainPosition.y;
    arrays.allenAtlasPositions[i3 + 2] = brainPosition.z;

    // Animation seeds
    arrays.animationSeeds[i3]     = rng();
    arrays.animationSeeds[i3 + 1] = rng();
    arrays.animationSeeds[i3 + 2] = rng();

    // Tier data
    arrays.tierData[index] = tierInfo.tier;

    // Size and opacity
    arrays.sizeMultipliers[index] = tierEnhanced.sizeMultiplier;
    const opacityRange = tierEnhanced.opacityRange;
    arrays.opacityData[index] = opacityRange[0] + rng() * (opacityRange[1] - opacityRange[0]);

    // Sprite selection – tier-aware whitelist from atlas
    if (atlas && typeof atlas.getTierWhitelist === 'function') {
      const wl = atlas.getTierWhitelist(tierInfo.tier, stageName);
      arrays.atlasIndices[index] = wl[Math.floor(rng() * wl.length)] || 1;
    } else {
      arrays.atlasIndices[index] = tierEnhanced.spriteIndex ?? 1;
    }

    // Behavior data
    arrays.behaviorData[i3]     = this.encodeBehavior(tierEnhanced.behaviors[0] || "drift");
    arrays.behaviorData[i3 + 1] = this.encodeBehavior(tierEnhanced.behaviors[1] || "none");
    arrays.behaviorData[i3 + 2] = tierEnhanced.behaviorIntensity || 1.0;

    // v3.0: Story affinity
    arrays.storyAffinity[index] = this.calculateStoryAffinity(tierInfo.tier, index, stageName);

    // v3.0: Memory fragment association
    arrays.memoryFragment[index] = this.calculateMemoryAssociation(tierInfo.tier, rng);

    // v3.0: Fusion moment readiness
    arrays.fusionMoment[index] = tierInfo.tier >= 2
      ? rng() * 0.5 + 0.5
      : rng() * 0.3;
  }

  /**
   * Generate brain position for a particle
   */
  generateBrainPosition(tier, brainPattern, brainCoords, rng) {
    const position = { x: 0, y: 0, z: 0 };
    const safeCoords = brainCoords || { center: [0, 0, 0], radius: 20 };
    const center = safeCoords.center || [0, 0, 0];
    const radius = safeCoords.radius || 20;

    if (tier === 3 && brainPattern?.coordinates?.points?.length > 0) {
      const points = brainPattern.coordinates.points;
      const pointIndex = Math.floor(rng() * points.length);
      const point = points[pointIndex];
      const variation = 0.5;
      position.x = point[0] + (rng() - 0.5) * variation;
      position.y = point[1] + (rng() - 0.5) * variation;
      position.z = point[2] + (rng() - 0.5) * variation;
    } else {
      const spread = tier === 0
        ? radius * 1.5
        : tier === 1
        ? radius * 1.2
        : radius;
      position.x = center[0] + (rng() - 0.5) * spread;
      position.y = center[1] + (rng() - 0.5) * spread;
      position.z = center[2] + (rng() - 0.5) * spread * 0.5;
    }

    return position;
  }

  /**
   * Encode a behavior string into its numeric map value
   */
  encodeBehavior(behavior) {
    return BEHAVIOR_MAP[behavior] ?? BEHAVIOR_MAP.none;
  }

  /**
   * Calculate story affinity for advanced narrative integration
   */
  calculateStoryAffinity(tier, index, stageName) {
    const boost = STAGE_AFFINITY_BOOSTS[stageName] || 0;
    return boost + (index % (tier + 1)) * 0.01;
  }

  /**
   * Determine memory fragment association probability
   */
  calculateMemoryAssociation(tier, rng) {
    return rng() * (tier + 1) * 0.1;
  }

  /**
   * Clear the blueprint cache
   */
  clearCache() {
    this.blueprintCache.clear();
    if (DEV_LOG) console.log("🧠 Engine: Cache cleared");
  }

  /**
   * Maintain cache size within configured limits
   */
  limitCacheSize() {
    const maxCache = SST_V3_CONFIG.performance.cacheLimit || 20;
    while (this.blueprintCache.size > maxCache) {
      const firstKey = this.blueprintCache.keys().next().value;
      this.blueprintCache.delete(firstKey);
    }
  }

  /**
   * Get collected performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Dispose of engine resources and handlers
   */
  dispose() {
    if (this._aqsHandler) {
      window.removeEventListener("aqsQualityChange", this._aqsHandler);
    }
    this.clearCache();
  }
}

// Ensure we always export the same singleton instance
function getConsciousnessEngineSingleton() {
  if (globalThis.__SST_ENGINE__) return globalThis.__SST_ENGINE__;
  const instance = new ConsciousnessEngine();
  globalThis.__SST_ENGINE__ = instance;
  // optional: expose for console debugging
  if (typeof window !== "undefined") {
    globalThis.consciousnessEngine = instance;
  }
  return instance;
}

const __ENGINE_INSTANCE__ = getConsciousnessEngineSingleton();

// Provide compatibility wrapper if older callers used getActiveParticleCount
if (!__ENGINE_INSTANCE__.getActiveParticleCount) {
  __ENGINE_INSTANCE__.getActiveParticleCount = function (stage) {
    // Prefer engine method if exists, else fall back to canonical
    if (this.getParticleBudgetForStage) return this.getParticleBudgetForStage(stage);
    const stageData = Canonical?.stages?.[stage];
    return stageData?.particles?.total ?? 2000;
  };
}

export { __ENGINE_INSTANCE__ as consciousnessEngine };
export default __ENGINE_INSTANCE__;

// Development helpers (with SSR safety)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.engineMetrics = () => __ENGINE_INSTANCE__.getMetrics();
}

/*
Suggestions (keep commented):

// - Cache the whitelist per (tier, stageName) combination to avoid repeated array allocations.
// - Validate that atlas.getTierWhitelist always returns a non-empty array; fallback if wl.length === 0.
// - Expose a hook or event to update sprite whitelists at runtime without restarting the engine.
// - Consider precomputing a flattened sprite lookup map for constant-time selection.
// - Profile performance impact of Math.floor(rng() * wl.length) inside massive loops.
*/
