// src/engine/ConsciousnessEngine.js
// ✅ ENHANCED: Brain with full tier support and deterministic generation

import seedrandom from 'seedrandom';
import SST_V2_CANONICAL from '../config/canonical/sstV2Stages.jsx'; // Fixed import
import { ConsciousnessPatterns } from '../components/webgl/consciousness/ConsciousnessPatterns.js';
import { getPointSpriteAtlasSingleton } from '../components/webgl/consciousness/PointSpriteAtlas.js';

// ✅ TIER DISTRIBUTION CONSTANTS
const DEFAULT_TIER_RATIOS = {
  tier1: 0.6, // 60% atmospheric dust
  tier2: 0.2, // 20% depth field
  tier3: 0.1, // 10% visual anchors
  tier4: 0.1, // 10% constellation points
};

// Schema version for cache busting
const STAGE_SCHEMA_VERSION = 'v1.0';

class ConsciousnessEngine {
  constructor() {
    this.isInitialized = false;
    this.blueprintCache = new Map();
    this.currentTier = 'HIGH';
    this.currentStage = 'genesis';

    // ✅ NEW: AQS integration with error handling
    this.listenToAQS();

    console.log('🧠 ConsciousnessEngine: Initialized with tier support');
  }

  // ✅ MUST HAVE: Listen for quality changes with error handling
  listenToAQS() {
    if (!window.addEventListener) return; // SSR safety

    window.addEventListener('aqsQualityChange', event => {
      if (!event?.detail?.tier) {
        console.warn('🧠 Engine: Invalid AQS event', event);
        return;
      }

      const { tier, particles } = event.detail;
      const oldTier = this.currentTier;
      this.currentTier = tier;

      console.log(`🧠 Engine: Quality changed ${oldTier} → ${tier}`);

      // Emit event for renderer
      window.dispatchEvent(
        new CustomEvent('engineTierChange', {
          detail: {
            tier,
            particles,
            stage: this.currentStage,
          },
        })
      );
    });
  }

  // ✅ MUST HAVE: Get tier counts for a stage
  getTierCounts(stageName, totalParticles) {
    const ratios = DEFAULT_TIER_RATIOS;

    return {
      tier1: Math.round(totalParticles * ratios.tier1),
      tier2: Math.round(totalParticles * ratios.tier2),
      tier3: Math.round(totalParticles * ratios.tier3),
      tier4: Math.round(totalParticles * ratios.tier4),
    };
  }

  // ✅ MUST HAVE: Deterministic RNG
  getRNG(stageName, tier) {
    const seed = `${stageName}|${tier}|${STAGE_SCHEMA_VERSION}`;
    return seedrandom(seed);
  }

  // ✅ MUST HAVE: Generate complete blueprint with tier support
  async generateConstellationParticleData(particleCount, options = {}) {
    const { stageName = 'genesis' } = options;
    this.currentStage = stageName;

    // Check cache first
    const cacheKey = `${stageName}-${this.currentTier}-${particleCount}`;
    if (this.blueprintCache.has(cacheKey)) {
      console.log(`🧠 Engine: Using cached blueprint for ${cacheKey}`);
      return this.blueprintCache.get(cacheKey);
    }

    console.log(
      `🧠 Engine: Generating new blueprint for ${stageName} (${particleCount} particles)`
    );

    // Get RNG for deterministic generation
    const rng = this.getRNG(stageName, this.currentTier);

    // Get tier distribution
    const tierCounts = this.getTierCounts(stageName, particleCount);

    // Pre-allocate arrays for 17K max
    const maxParticles = 17000;
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const allenAtlasPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    // Get brain pattern for this stage
    const brainPattern = ConsciousnessPatterns.getBrainRegionInfo(stageName);
    const atlas = getPointSpriteAtlasSingleton();

    // ✅ GENERATE PARTICLES IN TIER ORDER
    let particleIndex = 0;

    // Generate each tier
    const tiers = [
      { count: tierCounts.tier1, tier: 1 },
      { count: tierCounts.tier2, tier: 2 },
      { count: tierCounts.tier3, tier: 3 },
      { count: tierCounts.tier4, tier: 4 },
    ];

    for (const { count, tier } of tiers) {
      for (let i = 0; i < count && particleIndex < maxParticles; i++, particleIndex++) {
        this.generateParticle(
          particleIndex,
          tier,
          stageName,
          brainPattern,
          rng,
          atlas,
          atmosphericPositions,
          allenAtlasPositions,
          animationSeeds,
          sizeMultipliers,
          opacityData,
          atlasIndices,
          tierData
        );
      }
    }

    // Create blueprint
    const blueprint = {
      stageName,
      tier: this.currentTier,
      particleCount,
      maxParticles,
      tierCounts,
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      timestamp: Date.now(),
    };

    // Cache it
    this.blueprintCache.set(cacheKey, blueprint);

    // Limit cache size
    if (this.blueprintCache.size > 20) {
      const firstKey = this.blueprintCache.keys().next().value;
      this.blueprintCache.delete(firstKey);
    }

    return blueprint;
  }

  // ✅ Generate individual particle with tier awareness
  generateParticle(
    index,
    tier,
    stageName,
    brainPattern,
    rng,
    atlas,
    atmosphericPositions,
    allenAtlasPositions,
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData
  ) {
    const i3 = index * 3;

    // Atmospheric position (starting position)
    const spread = tier === 1 ? 40 : tier === 2 ? 30 : tier === 3 ? 20 : 15;
    atmosphericPositions[i3] = (rng() - 0.5) * spread;
    atmosphericPositions[i3 + 1] = (rng() - 0.5) * spread;
    atmosphericPositions[i3 + 2] = (rng() - 0.5) * spread * 0.5;

    // Brain position (target position)
    if (tier === 4 && brainPattern.coordinates) {
      // Tier 4 uses exact brain coordinates
      const points = brainPattern.coordinates.points;
      const pointIndex = Math.floor(rng() * points.length);
      const point = points[pointIndex];
      const variation = 0.3;

      allenAtlasPositions[i3] = point[0] + (rng() - 0.5) * variation;
      allenAtlasPositions[i3 + 1] = point[1] + (rng() - 0.5) * variation;
      allenAtlasPositions[i3 + 2] = point[2] + (rng() - 0.5) * variation;
    } else {
      // Other tiers use broader distribution
      const brainSpread = tier === 1 ? 25 : tier === 2 ? 20 : 15;
      allenAtlasPositions[i3] = (rng() - 0.5) * brainSpread;
      allenAtlasPositions[i3 + 1] = (rng() - 0.5) * brainSpread;
      allenAtlasPositions[i3 + 2] = (rng() - 0.5) * brainSpread * 0.5;
    }

    // Animation seeds
    animationSeeds[i3] = rng();
    animationSeeds[i3 + 1] = rng();
    animationSeeds[i3 + 2] = rng();

    // Tier-specific properties
    tierData[index] = tier - 1; // 0-3 for shader

    // Size multipliers by tier
    sizeMultipliers[index] =
      tier === 1
        ? 0.7 + rng() * 0.2
        : tier === 2
          ? 0.85 + rng() * 0.15
          : tier === 3
            ? 1.0 + rng() * 0.2
            : 1.2 + rng() * 0.3;

    // Opacity by tier
    opacityData[index] =
      tier === 1
        ? 0.5 + rng() * 0.2
        : tier === 2
          ? 0.65 + rng() * 0.2
          : tier === 3
            ? 0.8 + rng() * 0.15
            : 0.9 + rng() * 0.1;

    // Atlas sprite selection
    atlasIndices[index] = atlas.getContextualSpriteIndex(stageName, index);
  }

  // ✅ MUST HAVE: Get active particle count for current quality
  getActiveParticleCount(stageName) {
    // Fixed to use the proper method structure
    const stageData = SST_V2_CANONICAL.get.stageByName(stageName);
    const baseCount = stageData.particles;

    // Quality multipliers matching AQS tiers
    const qualityMultipliers = {
      LOW: 0.6, // Just tier 1
      MEDIUM: 0.8, // Tiers 1+2
      HIGH: 0.9, // Tiers 1+2+3
      ULTRA: 1.0, // All tiers
    };

    return Math.round(baseCount * (qualityMultipliers[this.currentTier] || 1.0));
  }

  // Cleanup
  dispose() {
    this.blueprintCache.clear();
    window.removeEventListener('aqsQualityChange', this.listenToAQS);
  }
}

// ✅ HMR-safe singleton
const getConsciousnessEngineSingleton = () => {
  if (!globalThis.__CONSCIOUSNESS_ENGINE__) {
    globalThis.__CONSCIOUSNESS_ENGINE__ = new ConsciousnessEngine();
  }
  return globalThis.__CONSCIOUSNESS_ENGINE__;
};

export default getConsciousnessEngineSingleton();
