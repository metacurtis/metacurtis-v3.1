// src/engine/ConsciousnessEngine.js
// SST v3.0 - Enhanced with BeatBus integration and blueprint caching

import * as THREE from 'three';
import { Canonical } from '../config/canonical/canonicalAuthority.js';
import { PointSpriteAtlas } from '../components/webgl/consciousness/PointSpriteAtlas.js';
import { createSeededRandom } from '../utils/random.js';
import BeatBus from '@orchestration/BeatBus';

// Define EVENTS locally to avoid import issues
const EVENTS = {
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  BLUEPRINT_READY: 'BLUEPRINT_READY',
  STATE_CHANGED: 'STATE_CHANGED',
};

class ConsciousnessEngine {
  constructor() {
    this.blueprintCache = new Map();
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';
    this.isInitialized = false;

    // Initialize BeatBus listeners
    this.initializeBeatBusListeners();

    console.log('🧠 ConsciousnessEngine initialized with BeatBus integration');
  }

  initializeBeatBusListeners() {
    // Listen for stage changes
    BeatBus.on(EVENTS.STAGE_CHANGE, ({ stage }) => {
      console.log(`🧠 Engine: Stage change detected: ${stage}`);
      this.currentStage = stage;
      this.buildAndEmitBlueprint(stage, this.currentQuality);
    });

    // Listen for quality changes
    BeatBus.on(EVENTS.QUALITY_CHANGE, ({ tier }) => {
      console.log(`🧠 Engine: Quality change detected: ${tier}`);
      this.currentQuality = tier;
      this.buildAndEmitBlueprint(this.currentStage, tier);
    });

    // Request initial state
    setTimeout(() => {
      console.log('🧠 Engine: Requesting initial state...');
      // Build initial blueprint
      this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
    }, 100);
  }

  buildAndEmitBlueprint(stage, quality) {
    const cacheKey = `${stage}|${quality}`;

    // Check cache first
    if (this.blueprintCache.has(cacheKey)) {
      const cachedBlueprint = this.blueprintCache.get(cacheKey);
      console.log(`✅ Engine: Using cached blueprint for ${cacheKey}`);

      // Emit cached blueprint
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: cachedBlueprint,
        stage,
        quality,
        cached: true,
      });
      return;
    }

    // Build new blueprint
    console.log(`🔨 Engine: Building new blueprint for ${cacheKey}`);
    const blueprint = this.buildBlueprint(stage, { quality });

    // Cache it
    this.blueprintCache.set(cacheKey, blueprint);

    // Emit blueprint
    BeatBus.emit(EVENTS.BLUEPRINT_READY, {
      blueprint,
      stage,
      quality,
      cached: false,
    });
  }

  buildBlueprint(stageName, options = {}) {
    const startTime = performance.now();

    // Get stage configuration
    const stageConfig = Canonical.stages[stageName];
    if (!stageConfig) {
      console.error(`Stage ${stageName} not found in canonical config`);
      return null;
    }

    // Determine particle count based on quality
    const quality = options.quality || this.currentQuality;
    const baseParticleCount = stageConfig.particleCount;
    const particleCount = this.getParticleCountForQuality(baseParticleCount, quality);

    console.log(
      `🧠 Building blueprint for ${stageName} with ${particleCount} particles (quality: ${quality})`
    );

    // Create arrays
    const maxParticles = 15000; // Maximum possible particles
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const allenAtlasPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    // Get tier configuration
    const tierConfig = stageConfig.tierDistribution || {
      tier1: { ratio: 0.5, sizeRange: [0.3, 0.5], opacityRange: [0.3, 0.5] },
      tier2: { ratio: 0.2, sizeRange: [0.5, 0.7], opacityRange: [0.5, 0.7] },
      tier3: { ratio: 0.15, sizeRange: [0.7, 1.0], opacityRange: [0.7, 0.85] },
      tier4: { ratio: 0.15, sizeRange: [1.0, 1.5], opacityRange: [0.85, 1.0] },
    };

    // Calculate particles per tier
    const tier1Count = Math.floor(particleCount * tierConfig.tier1.ratio);
    const tier2Count = Math.floor(particleCount * tierConfig.tier2.ratio);
    const tier3Count = Math.floor(particleCount * tierConfig.tier3.ratio);
    const tier4Count = particleCount - tier1Count - tier2Count - tier3Count;

    let particleIndex = 0;

    // Generate particles for each tier
    this.generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      tier1Count,
      0,
      tierConfig.tier1,
      stageConfig
    );
    particleIndex += tier1Count;

    this.generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      tier2Count,
      1,
      tierConfig.tier2,
      stageConfig
    );
    particleIndex += tier2Count;

    this.generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      tier3Count,
      2,
      tierConfig.tier3,
      stageConfig
    );
    particleIndex += tier3Count;

    this.generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      tier4Count,
      3,
      tierConfig.tier4,
      stageConfig
    );

    const buildTime = performance.now() - startTime;
    console.log(`✅ Blueprint built in ${buildTime.toFixed(2)}ms`);

    return {
      stageName,
      particleCount,
      maxParticles,
      activeCount: particleCount,
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: {
        quality,
        buildTime,
        tierCounts: { tier1: tier1Count, tier2: tier2Count, tier3: tier3Count, tier4: tier4Count },
      },
    };
  }

  getParticleCountForQuality(baseCount, quality) {
    const qualityMultipliers = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 1.0,
      ULTRA: 1.5,
    };
    return Math.floor(baseCount * (qualityMultipliers[quality] || 1.0));
  }

  generateTierParticles(
    atmosphericPositions,
    allenAtlasPositions,
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData,
    startIndex,
    count,
    tierIndex,
    tierConfig,
    stageConfig
  ) {
    const seededRandom = createSeededRandom(`${stageConfig.name}-tier${tierIndex}`);

    for (let i = 0; i < count; i++) {
      const idx = (startIndex + i) * 3;
      const idx1 = startIndex + i;

      // Atmospheric position (spread out)
      const r = seededRandom() * 60 + 20;
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom() - 1);

      atmosphericPositions[idx] = r * Math.sin(phi) * Math.cos(theta);
      atmosphericPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      atmosphericPositions[idx + 2] = r * Math.cos(phi);

      // Allen Atlas position (brain structure)
      const brainR = 15 + seededRandom() * 10;
      allenAtlasPositions[idx] = brainR * Math.sin(phi) * Math.cos(theta);
      allenAtlasPositions[idx + 1] = brainR * Math.sin(phi) * Math.sin(theta);
      allenAtlasPositions[idx + 2] = brainR * Math.cos(phi);

      // Animation seeds
      animationSeeds[idx] = seededRandom();
      animationSeeds[idx + 1] = seededRandom();
      animationSeeds[idx + 2] = seededRandom();

      // Size and opacity from tier config
      const { sizeRange, opacityRange } = tierConfig;
      sizeMultipliers[idx1] = sizeRange[0] + seededRandom() * (sizeRange[1] - sizeRange[0]);
      opacityData[idx1] = opacityRange[0] + seededRandom() * (opacityRange[1] - opacityRange[0]);

      // Atlas index (0-15 for 16 sprites)
      atlasIndices[idx1] = Math.floor(seededRandom() * 16);

      // Tier data
      tierData[idx1] = tierIndex;
    }
  }

  // Pre-generate blueprints for smooth transitions
  preGenerateTransitions() {
    const stages = [
      'genesis',
      'discipline',
      'neural',
      'velocity',
      'architecture',
      'harmony',
      'transcendence',
    ];
    const qualities = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

    console.log('🧠 Pre-generating transition blueprints...');

    stages.forEach(stage => {
      qualities.forEach(quality => {
        const cacheKey = `${stage}|${quality}`;
        if (!this.blueprintCache.has(cacheKey)) {
          const blueprint = this.buildBlueprint(stage, { quality });
          this.blueprintCache.set(cacheKey, blueprint);
        }
      });
    });

    console.log(`✅ Pre-generated ${this.blueprintCache.size} blueprints`);
  }

  // Clear cache to free memory
  clearCache() {
    this.blueprintCache.clear();
    console.log('🧠 Blueprint cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.blueprintCache.size,
      keys: Array.from(this.blueprintCache.keys()),
      memorySizeMB: (this.blueprintCache.size * 15000 * 7 * 4) / 1024 / 1024, // Rough estimate
    };
  }
}

// Create singleton instance
const consciousnessEngine = new ConsciousnessEngine();

// Global debug access
if (import.meta.env.DEV) {
  window.consciousnessEngine = consciousnessEngine;
  window.engineDebug = {
    getCacheStats: () => consciousnessEngine.getCacheStats(),
    clearCache: () => consciousnessEngine.clearCache(),
    preGenerate: () => consciousnessEngine.preGenerateTransitions(),
    forceRebuild: (stage, quality) => {
      consciousnessEngine.blueprintCache.clear();
      consciousnessEngine.buildAndEmitBlueprint(stage || 'genesis', quality || 'HIGH');
    },
  };

  console.log('🧠 Engine Debug Tools:');
  console.log('  window.engineDebug.getCacheStats()');
  console.log('  window.engineDebug.clearCache()');
  console.log('  window.engineDebug.preGenerate()');
  console.log('  window.engineDebug.forceRebuild(stage, quality)');
}

export default consciousnessEngine;
