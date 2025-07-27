// engine/ConsciousnessEngine.js
// Enhanced consciousness particle engine with tier system support
// Version: 3.0.1 | Date: 2025-01-24

import seedrandom from "seedrandom";
import { SST_V3_CONFIG, getStageByName } from "@/config/sst3/sst-v3.0-config.js";
import { tierSystem } from "./TierSystem.js";
import { ConsciousnessPatterns } from "@/components/webgl/consciousness/ConsciousnessPatterns.js";
import { getPointSpriteAtlasSingleton } from "@/components/webgl/consciousness/PointSpriteAtlas.js";

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
      totalGenerationTime: 0, // Keep running sum
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
    
    // Store handler reference for cleanup
    this._aqsHandler = (event) => {
      if (!event?.detail?.tier) {
        console.warn("🧠 Engine: Invalid AQS event", event);
        return;
      }
      
      const { tier, particles } = event.detail;
      const oldTier = this.currentQuality;
      this.currentQuality = tier;
      
      console.log(`🧠 Engine: Quality changed ${oldTier} → ${tier}`);
      
      // Clear cache on quality change to regenerate with new settings
      this.clearCache();
      
      // Emit event for renderer (with SSR safety)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("engineQualityChange", {
          detail: { 
            tier, 
            particles,
            stage: this.currentStage 
          }
        }));
      }
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
   * Generate complete blueprint with tier support
   */
  async generateConstellationParticleData(particleCount, options = {}) {
    const startTime = performance.now();
    const { stageName = "genesis" } = options;
    this.currentStage = stageName;
    
    // Ensure particle count doesn't exceed max
    const maxParticles = SST_V3_CONFIG.performance.maxParticles;
    const safeParticleCount = Math.min(particleCount, maxParticles);
    
    // Enhanced cache key with tier system state
    const cacheKey = `${stageName}-${this.currentQuality}-${safeParticleCount}-${SCHEMA_VERSION}-${this.tierSystem.metrics.distributionsCalculated}`;
    
    if (this.blueprintCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      console.log(`🧠 Engine: Using cached blueprint for ${cacheKey}`);
      return this.blueprintCache.get(cacheKey);
    }
    
    console.log(`🧠 Engine: Generating new v3.0.1 blueprint for ${stageName} (${safeParticleCount} particles)`);
    
    // Get stage configuration
    const stageConfig = getStageByName(stageName);
    if (!stageConfig) {
      console.error(`🧠 Engine: Unknown stage "${stageName}"`);
      return null;
    }
    
    // Get tier distribution
    const distribution = this.tierSystem.distributeParticles(safeParticleCount, stageName);
    
    // Allocate arrays efficiently
    const arrays = this.allocateArrays(safeParticleCount);
    
    // Get brain pattern for this stage (with fail-safe)
    const brainPattern = ConsciousnessPatterns?.getBrainRegionInfo?.(stageName) || null;
    if (!brainPattern) {
      console.warn(`🧠 Engine: No brain pattern for stage ${stageName}`);
    }
    
    // Get atlas (with fail-safe)
    const atlas = getPointSpriteAtlasSingleton?.() || null;
    if (!atlas) {
      console.warn("🧠 Engine: No sprite atlas available");
    }
    
    // Generate particles by tier
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
    
    // Create immutable blueprint
    const blueprint = Object.freeze({
      stageName,
      stageConfig,
      quality: this.currentQuality,
      particleCount: safeParticleCount,
      activeCount: particleIndex, // Track actual particles generated
      maxParticles,
      distribution,
      ...arrays,
      brainPattern,
      timestamp: Date.now(),
      version: SCHEMA_VERSION
    });
    
    // Cache it
    this.blueprintCache.set(cacheKey, blueprint);
    this.limitCacheSize();
    
    // Update metrics efficiently
    this.metrics.blueprintsGenerated++;
    this.metrics.particlesGenerated += safeParticleCount;
    this.metrics.totalGenerationTime += performance.now() - startTime;
    
    console.log(`🧠 Engine: Blueprint generated in ${(performance.now() - startTime).toFixed(2)}ms`);
    
    return blueprint;
  }
  
  /**
   * Allocate typed arrays efficiently (with reuse option)
   */
  allocateArrays(particleCount) {
    // Option 1: Reuse pre-allocated arrays if large enough
    if (this._preallocatedArrays && this._maxParticlesAllocated >= particleCount) {
      return this._preallocatedArrays;
    }
    
    // Option 2: Allocate exactly what we need
    const arrays = {
      atmosphericPositions: new Float32Array(particleCount * 3),
      allenAtlasPositions: new Float32Array(particleCount * 3),
      animationSeeds: new Float32Array(particleCount * 3),
      sizeMultipliers: new Float32Array(particleCount),
      opacityData: new Float32Array(particleCount),
      atlasIndices: new Float32Array(particleCount),
      tierData: new Float32Array(particleCount),
      behaviorData: new Float32Array(particleCount * 3),
      storyAffinity: new Float32Array(particleCount),
      memoryFragment: new Float32Array(particleCount),
      fusionMoment: new Float32Array(particleCount)
    };
    
    // Store for potential reuse
    if (particleCount >= SST_V3_CONFIG.performance.maxParticles * 0.8) {
      this._preallocatedArrays = arrays;
      this._maxParticlesAllocated = particleCount;
    }
    
    return arrays;
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
    particleData.position.x = (rng() - 0.5) * atmosphericSpread;
    particleData.position.y = (rng() - 0.5) * atmosphericSpread;
    particleData.position.z = (rng() - 0.5) * atmosphericSpread * 0.5;
    
    // Apply tier behaviors
    const tierEnhanced = this.tierSystem.applyTierBehavior(particleData, stageName, rng);
    
    // Apply clustering if enabled
    if (tierEnhanced.clustering && tierEnhanced.clustering.inCluster) {
      particleData.position = tierEnhanced.clustering.adjustedPosition;
    }
    
    // Store atmospheric position
    arrays.atmosphericPositions[i3] = particleData.position.x;
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
    
    arrays.allenAtlasPositions[i3] = brainPosition.x;
    arrays.allenAtlasPositions[i3 + 1] = brainPosition.y;
    arrays.allenAtlasPositions[i3 + 2] = brainPosition.z;
    
    // Animation seeds (could be packed if needed)
    arrays.animationSeeds[i3] = rng();
    arrays.animationSeeds[i3 + 1] = rng();
    arrays.animationSeeds[i3 + 2] = rng();
    
    // Tier data
    arrays.tierData[index] = tierInfo.tier;
    
    // Size and opacity from tier system
    arrays.sizeMultipliers[index] = tierEnhanced.sizeMultiplier;
    const opacityRange = tierEnhanced.opacityRange;
    arrays.opacityData[index] = opacityRange[0] + rng() * (opacityRange[1] - opacityRange[0]);
    
    // Sprite selection from tier system
    arrays.atlasIndices[index] = tierEnhanced.spriteIndex;
    
    // Behavior data (using hoisted map)
    arrays.behaviorData[i3] = this.encodeBehavior(tierEnhanced.behaviors[0] || "drift");
    arrays.behaviorData[i3 + 1] = this.encodeBehavior(tierEnhanced.behaviors[1] || "none");
    arrays.behaviorData[i3 + 2] = tierEnhanced.behaviorIntensity || 1.0;
    
    // v3.0: Story affinity (how connected to narrative)
    arrays.storyAffinity[index] = this.calculateStoryAffinity(tierInfo.tier, index, stageName);
    
    // v3.0: Memory fragment association
    arrays.memoryFragment[index] = this.calculateMemoryAssociation(tierInfo.tier, rng);
    
    // v3.0: Fusion moment readiness
    arrays.fusionMoment[index] = tierInfo.tier >= 2 ? rng() * 0.5 + 0.5 : rng() * 0.3;
  }
  
  /**
   * Get atmospheric spread for a tier (using hoisted constant)
   */
  getAtmosphericSpread(tier) {
    return ATMOSPHERIC_SPREADS[tier] || 30;
  }
  
  /**
   * Generate brain position for a particle
   */
  generateBrainPosition(tier, brainPattern, brainCoords, rng) {
  const position = { x: 0, y: 0, z: 0 };
  
  // Add safety defaults
  const safeCoords = brainCoords || { center: [0, 0, 0], radius: 20 };
  const center = safeCoords.center || [0, 0, 0];
  const radius = safeCoords.radius || 20;
  
  // Tier 3 (constellation) uses precise brain coordinates
  if (tier === 3 && brainPattern?.coordinates?.points?.length > 0) {
    const points = brainPattern.coordinates.points;
    const pointIndex = Math.floor(rng() * points.length);
    const point = points[pointIndex];
    const variation = 0.5; // Small variation for organic feel
    
    position.x = point[0] + (rng() - 0.5) * variation;
    position.y = point[1] + (rng() - 0.5) * variation;
    position.z = point[2] + (rng() - 0.5) * variation;
  } else {
    // Other tiers use broader distribution around brain center
    const spread = tier === 0 ? radius * 1.5 : tier === 1 ? radius * 1.2 : radius;
    
    position.x = center[0] + (rng() - 0.5) * spread;
    position.y = center[1] + (rng() - 0.5) * spread;
    position.z = center[2] + (rng() - 0.5) * spread * 0.5;
  }
  
  return position;
}
  
  /**
   * Encode behavior name to numeric value for shader (using hoisted map)
   */
  encodeBehavior(behaviorName) {
    return BEHAVIOR_MAP[behaviorName] ?? 0;
  }
  
  /**
   * Calculate story affinity for v3.0 (using hoisted constants)
   */
  calculateStoryAffinity(tier, index, stageName) {
    const baseAffinity = tier * 0.25;
    const stageBoost = STAGE_AFFINITY_BOOSTS[stageName] || 0.2;
    const variation = (index % 100) / 100 * 0.1;
    
    return Math.min(baseAffinity + stageBoost + variation, 1.0);
  }
  
  /**
   * Calculate memory fragment association for v3.0
   */
  calculateMemoryAssociation(tier, rng) {
    // Tier 2 and 3 have higher chance of memory association
    if (tier >= 2) {
      return rng() > 0.7 ? rng() : 0;
    }
    return rng() > 0.9 ? rng() * 0.5 : 0;
  }
  
  /**
   * Get active particle count for current quality (with max safety)
   */
  getActiveParticleCount(stageName) {
    const stageConfig = getStageByName(stageName);
    if (!stageConfig) return 5000; // Fallback
    
    const baseCount = stageConfig.particles;
    const multiplier = QUALITY_MULTIPLIERS[this.currentQuality] || 0.9;
    const count = Math.round(baseCount * multiplier);
    
    // Never exceed max particles
    return Math.min(count, SST_V3_CONFIG.performance.maxParticles);
  }
  
  /**
   * Clear blueprint cache
   */
  clearCache() {
    this.blueprintCache.clear();
    console.log("🧠 Engine: Blueprint cache cleared");
  }
  
  /**
   * Limit cache size to prevent memory issues
   */
  limitCacheSize(maxSize = 20) {
    if (this.blueprintCache.size > maxSize) {
      const firstKey = this.blueprintCache.keys().next().value;
      this.blueprintCache.delete(firstKey);
    }
  }
  
  /**
   * Get engine metrics (with computed average)
   */
  getMetrics() {
    const totalOps = this.metrics.blueprintsGenerated + this.metrics.cacheHits;
    
    return {
      ...this.metrics,
      averageGenerationTime: this.metrics.blueprintsGenerated > 0 
        ? this.metrics.totalGenerationTime / this.metrics.blueprintsGenerated 
        : 0,
      cacheSize: this.blueprintCache.size,
      cacheHitRate: totalOps > 0 ? this.metrics.cacheHits / totalOps : 0,
      tierSystemMetrics: this.tierSystem.getMetrics()
    };
  }
  
  /**
   * Cleanup (with proper event handler removal)
   */
  dispose() {
    this.clearCache();
    
    // Remove event listener with stored reference
    if (this._aqsHandler && typeof window !== "undefined") {
      window.removeEventListener("aqsQualityChange", this._aqsHandler);
      this._aqsHandler = null;
    }
    
    // Clear pre-allocated arrays
    this._preallocatedArrays = null;
    this._maxParticlesAllocated = 0;
    
    console.log("🧠 Engine: Disposed");
  }
}

// HMR-safe singleton
const getConsciousnessEngineSingleton = () => {
  if (!globalThis.__CONSCIOUSNESS_ENGINE_V3__) {
    globalThis.__CONSCIOUSNESS_ENGINE_V3__ = new ConsciousnessEngine();
  }
  return globalThis.__CONSCIOUSNESS_ENGINE_V3__;
};

export default getConsciousnessEngineSingleton();

// Development helpers (with SSR safety)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.consciousnessEngine = getConsciousnessEngineSingleton();
  window.engineMetrics = () => window.consciousnessEngine.getMetrics();
}