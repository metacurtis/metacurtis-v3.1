// src/engine/ConsciousnessEngine.js
// SST v3.0 COMPLIANT - Integrated Stage/Quality + Emergence blueprint generation

import { Canonical } from '@config/canonical/canonicalAuthority.js';
import { createSeededRandom } from '../utils/random.js';
import BeatBus from "@/src/modules/orchestration/core/BeatBus.js";
import { EVENTS } from '@theater/events.js';

class ConsciousnessEngine {
  constructor() {
    this.blueprintCache = new Map();
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';
    this.isInitialized = false;

    this.initializeBeatBusListeners();
    console.log('🧠 ConsciousnessEngine initialized with BeatBus integration (SST v3.0 compliant)');
  }

  // ————————————————————————————————————————————————————————————————
  // BeatBus Event Listeners
  // ————————————————————————————————————————————————————————————————
  initializeBeatBusListeners() {
    // Stage changes from UI/scroll
    BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => {
  const stage = payload.stage ?? payload.to;
  if (!stage) return;
  console.log(`🧠 Engine: Stage -> ${stage}`);
  this.currentStage = stage;
  this.buildAndEmitBlueprint(stage, this.currentQuality);
});

    // Quality changes from TAQS
    BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => {
  const tier = payload.tier ?? payload.quality;
  if (!tier) return;
  console.log(`🧠 Engine: Quality -> ${tier}`);
  this.currentQuality = tier;
  this.buildAndEmitBlueprint(this.currentStage, tier);
});

    // Director: Prewarm genesis for emergence (SST v3.0 opening)
    BeatBus.on(EVENTS.PREWARM_GENESIS_BLUEPRINT, () => {
      console.log('🧠 Engine: Prewarming genesis blueprint for emergence');
      const key = this._emergenceKey('HELLO CURTIS', 2000);

      if (!this.blueprintCache.has(key)) {
        const bp = this.buildEmergenceBlueprint({
          text: 'HELLO CURTIS',
          count: 2000, // SST v3.0: Genesis has 2000 particles
        });
        this.blueprintCache.set(key, bp);
      }

      // Notify Director that prewarm is complete
      BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
    });

    // Director: Build emergence blueprint (particles from text)
    BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
      console.log('🧠 Engine: Building emergence blueprint');

      const text = opts.sourceText || 'HELLO CURTIS';
      const count = opts.count || 2000; // SST v3.0 Genesis particle count
      const tierBehaviors = opts.tierBehaviors || {
        tier1: { behavior: 'drift', ratio: 0.5 },
        tier2: { behavior: 'orbital', ratio: 0.2 },
        tier3: { behavior: 'twinkle', ratio: 0.15 },
        tier4: { behavior: 'prominent', ratio: 0.15 },
      };

      const key = this._emergenceKey(text, count);
      let bp = this.blueprintCache.get(key);
      const cached = !!bp;

      if (!bp) {
        bp = this.buildEmergenceBlueprint({ text, count, tierBehaviors });
        this.blueprintCache.set(key, bp);
      }

      // Emit blueprint - WebGLBackground expects this format
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: bp,
        stage: 'genesis',
        quality: this.currentQuality,
        cached,
      });
    });

    // Initial blueprint request after components mount
    setTimeout(() => {
      console.log('🧠 Engine: Requesting initial state...');
      this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
    }, 500); // Give renderer time to mount
  }

  _emergenceKey(text, count) {
    return `emergence|${text}|${count}`;
  }

  // ————————————————————————————————————————————————————————————————
  // Build and emit stage blueprints
  // ————————————————————————————————————————————————————————————————
  buildAndEmitBlueprint(stage, quality) {
    const cacheKey = `${stage}|${quality}`;

    if (this.blueprintCache.has(cacheKey)) {
      console.log(`🔨 Engine: Using cached blueprint for ${stage}|${quality}`);
      const cachedBlueprint = this.blueprintCache.get(cacheKey);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: cachedBlueprint,
        stage,
        quality,
        cached: true,
      });
      return;
    }

    console.log(`🔨 Engine: Building new blueprint for ${stage}|${quality}`);
    const blueprint = this.buildBlueprint(stage, { quality });

    if (blueprint) {
      this.blueprintCache.set(cacheKey, blueprint);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
        stage,
        quality,
        cached: false,
      });
    }
  }

  // ————————————————————————————————————————————————————————————————
  // Standard stage blueprint (atmospheric → brain morphing)
  // ————————————————————————————————————————————————————————————————
  buildBlueprint(stageName, options = {}) {
    const startTime = performance.now();

    const stageConfig = (Canonical?.stages?.[stageName]) || {};
    // SST v3.0 absolute stage particle counts (fallback)
    const SPEC_COUNTS = {
      genesis: 2000,
      discipline: 3000,
      neural: 5000,
      velocity: 12000,
      architecture: 8000,
      harmony: 12000,
      transcendence: 15000,
    };
    if (!stageConfig) {
      console.error(`Stage ${stageName} not found in canonical config`);
      return null;
    }

    const quality = options.quality || this.currentQuality;
    const baseParticleCount = Number.isFinite(stageConfig.particleCount) ? stageConfig.particleCount : (SPEC_COUNTS[stageName] ?? 5000);
    const particleCount = this.getParticleCountForQuality(baseParticleCount, quality);

    console.log(
      `🧠 Building blueprint for ${stageName} with ${particleCount} particles (quality: ${quality})`
    );

    // SST v3.0: Maximum 15,000 particles
    const maxParticles = 15000;

    // Allocate arrays
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const allenAtlasPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    // SST v3.0 Tier Distribution
    const tierConfig = stageConfig.tierDistribution || {
      tier1: {
        ratio: 0.5,
        sizeRange: [0.5, 0.7],
        opacityRange: [0.3, 0.7],
        behavior: 'drift',
      },
      tier2: {
        ratio: 0.2,
        sizeRange: [0.7, 0.9],
        opacityRange: [0.5, 0.8],
        behavior: 'orbital',
      },
      tier3: {
        ratio: 0.15,
        sizeRange: [1.0, 1.3],
        opacityRange: [0.7, 0.9],
        behavior: 'twinkle',
      },
      tier4: {
        ratio: 0.15,
        sizeRange: [1.3, 2.0],
        opacityRange: [0.8, 1.0],
        behavior: 'prominent',
      },
    };

    // Calculate tier particle counts
    const t1 = Math.floor(particleCount * tierConfig.tier1.ratio);
    const t2 = Math.floor(particleCount * tierConfig.tier2.ratio);
    const t3 = Math.floor(particleCount * tierConfig.tier3.ratio);
    const t4 = particleCount - t1 - t2 - t3;

    // Generate particles for each tier
    let particleIndex = 0;

    this._generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      t1,
      0,
      tierConfig.tier1,
      stageConfig
    );
    particleIndex += t1;

    this._generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      t2,
      1,
      tierConfig.tier2,
      stageConfig
    );
    particleIndex += t2;

    this._generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      t3,
      2,
      tierConfig.tier3,
      stageConfig
    );
    particleIndex += t3;

    this._generateTierParticles(
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      particleIndex,
      t4,
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
        tierCounts: { tier1: t1, tier2: t2, tier3: t3, tier4: t4 },
      },
    };
  }

  // ————————————————————————————————————————————————————————————————
  // Emergence blueprint (text → particles for SST v3.0 opening)
  // ————————————————————————————————————————————————————————————————
  buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000, tierBehaviors = {} } = {}) {
    console.log(`🌟 Building emergence blueprint: "${text}" with ${count} particles`);

    // Generate positions from text
    const positions = this.textToParticlePositions(text, count);

    // SST v3.0 Genesis tier distribution: 60/20/10/10
    const tiers = new Uint8Array(count);
    const tierCounts = [
      Math.floor(count * 0.6), // Tier 1: 60% drift
      Math.floor(count * 0.2), // Tier 2: 20% orbital
      Math.floor(count * 0.1), // Tier 3: 10% twinkle
      Math.floor(count * 0.1), // Tier 4: 10% prominent
    ];

    // Adjust for rounding
    const totalAssigned = tierCounts.reduce((a, b) => a + b, 0);
    if (totalAssigned < count) {
      tierCounts[0] += count - totalAssigned;
    }

    // Fill tier array
    let idx = 0;
    for (let tier = 0; tier < 4; tier++) {
      for (let i = 0; i < tierCounts[tier] && idx < count; i++) {
        tiers[idx++] = tier;
      }
    }

    // Shuffle for random distribution
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
    }

    // Return minimal blueprint - WebGLBackground will synthesize the rest
    return {
      id: 'emergence-genesis',
      mode: 'emergence',
      stageName: 'genesis',
      count,
      particleCount: count,
      maxParticles: count,
      activeCount: count,
      positions, // Start positions (from text)
      tiers, // Tier assignments
      metadata: {
        sourceText: text,
        tierBehaviors,
        createdAt: Date.now(),
      },
    };
  }

  textToParticlePositions(text, count) {
    // Create positions that form text shape
    const positions = new Float32Array(count * 3);

    // Text dimensions in world space
    const charWidth = 10.0; // enlarged for emergence visibility
    const _textWidth = text.length * charWidth;
    const textHeight = 12.0; // taller for emergence
    const _centerX = 0;
    const centerY = 0;

    for (let i = 0; i < count; i++) {
      // Distribute particles across text area
      const charIndex = Math.floor(Math.random() * text.length);
      const baseX = (charIndex - text.length / 2) * charWidth;

      // Add variation within character bounds
      const x = baseX + (Math.random() - 0.5) * charWidth * 0.8;
      const y = centerY + (Math.random() - 0.5) * textHeight;
      const z = (Math.random() - 0.5) * 2.0; // More depth so highlights pop

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    return positions;
  }

  // ————————————————————————————————————————————————————————————————
  // Helper: Generate tier-specific particles
  // ————————————————————————————————————————————————————————————————
  _generateTierParticles(
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
    tierCfg,
    stageCfg
  ) {
    const rnd = createSeededRandom(`${stageCfg.name}-tier${tierIndex}`);

    // SST v3.0 sprite assignments per tier
    const tierSprites = {
      0: [7], // Tier 1: Soft glow (sprite 7)
      1: [0, 1], // Tier 2: Basic circle, gradient
      2: [4], // Tier 3: Diamond
      3: [1], // Tier 4: Gradient
    };

    const availableSprites = tierSprites[tierIndex] || [0];

    for (let i = 0; i < count; i++) {
      const idx = (startIndex + i) * 3;
      const idx1 = startIndex + i;

      // Atmospheric positions (cloud-like)
      const r = rnd() * 80 + 40;
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);

      atmosphericPositions[idx] = r * Math.sin(phi) * Math.cos(theta);
      atmosphericPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      atmosphericPositions[idx + 2] = r * Math.cos(phi);

      // Allen Atlas positions (brain structure)
      const brainR = 20 + rnd() * 15;
      allenAtlasPositions[idx] = brainR * Math.sin(phi) * Math.cos(theta);
      allenAtlasPositions[idx + 1] = brainR * Math.sin(phi) * Math.sin(theta);
      allenAtlasPositions[idx + 2] = brainR * Math.cos(phi);

      // Animation seeds
      animationSeeds[idx] = rnd();
      animationSeeds[idx + 1] = rnd();
      animationSeeds[idx + 2] = rnd();

      // Tier-specific properties
      const [sizeMin, sizeMax] = tierCfg.sizeRange || [1.0, 1.0];
      const [opacityMin, opacityMax] = tierCfg.opacityRange || [0.8, 1.0];

      sizeMultipliers[idx1] = sizeMin + rnd() * (sizeMax - sizeMin);
      opacityData[idx1] = opacityMin + rnd() * (opacityMax - opacityMin);
      atlasIndices[idx1] = availableSprites[Math.floor(rnd() * availableSprites.length)];
      tierData[idx1] = tierIndex;
    }
  }

  // ————————————————————————————————————————————————————————————————
  // Quality management (SST v3.0 tiers)
  // ————————————————————————————————————————————————————————————————
  getParticleCountForQuality(baseCount, quality) {
    const multipliers = {
      LOW: 0.3, // 30% of base
      MEDIUM: 0.6, // 60% of base
      HIGH: 1.0, // 100% of base
      ULTRA: 1.5, // 150% of base (up to 15,000 max)
    };

    const count = Math.floor(baseCount * (multipliers[quality] || 1.0));
    return Math.min(count, 15000); // SST v3.0 cap
  }

  // ————————————————————————————————————————————————————————————————
  // Cache management
  // ————————————————————————————————————————————————————————————————
  clearCache() {
    this.blueprintCache.clear();
    console.log('🧠 Blueprint cache cleared');
  }

  getCacheStats() {
    return {
      size: this.blueprintCache.size,
      keys: Array.from(this.blueprintCache.keys()),
      stages: Array.from(this.blueprintCache.keys())
        .filter(k => !k.startsWith('emergence'))
        .map(k => k.split('|')[0]),
      emergenceKeys: Array.from(this.blueprintCache.keys()).filter(k => k.startsWith('emergence')),
    };
  }

  forceRebuild(stage, quality) {
    const key = `${stage}|${quality}`;
    this.blueprintCache.delete(key);
    console.log(`🧠 Force rebuilding ${key}`);
    this.buildAndEmitBlueprint(stage, quality);
  }
}

// Create singleton instance
const engine = new ConsciousnessEngine();

// Debug interface
if (typeof window !== 'undefined') {
  window.engineDebug = {
    getCacheStats: () => engine.getCacheStats(),
    clearCache: () => engine.clearCache(),
    preGenerate: () => {
      const stages = Object.keys(Canonical.stages);
      const qualities = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
      stages.forEach(stage => {
        qualities.forEach(quality => {
          engine.buildAndEmitBlueprint(stage, quality);
        });
      });
      console.log('🧠 Pre-generated all stage/quality combinations');
    },
    forceRebuild: (stage, quality) => engine.forceRebuild(stage, quality),
  };
}

export default engine;
