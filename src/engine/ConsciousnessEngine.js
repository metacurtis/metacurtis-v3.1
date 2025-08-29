// src/engine/ConsciousnessEngine.js
// SST v3.0 COMPLIANT — Stage/Quality blueprints (brain) + emergence
// Visual North Star: Engine builds typed arrays & emits BLUEPRINT_READY. No GL logic.

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { createSeededRandom } from '../utils/random.js';
import { generateBrainRegionPositions } from '@/components/webgl/consciousness/ConsciousnessPatterns.js';
import BeatBus from '@/modules/orchestration/core/BeatBus.js';
import { EVENTS } from '@/theater/events.js';
import { FormationResolver } from './FormationResolver.js';

class ConsciousnessEngine {
  constructor() {
    // Caches & state
    this.blueprintCache = new Map();
    this.emergenceBuilt = false;
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';

    // Formation resolver (non-blocking priming)
    this.resolver = new FormationResolver();
    this.resolverReady = false;
    this.resolver
      .precompute()
      .then(() => {
        this.resolverReady = true;
        console.log('🧠 FormationResolver ready');
      })
      .catch((err) => {
        this.resolverReady = false;
        console.warn('⚠️ FormationResolver failed:', err);
      });

    // BeatBus wire-up
    this.initializeBeatBusListeners();
    console.log('🧠 ConsciousnessEngine initialized (SST v3.0 compliant)');
  }

  /**
   * Optional explicit init hook (if you prefer to await readiness elsewhere).
   */
  async init() {
    if (!this.resolverReady) {
      try {
        await this.resolver.precompute();
        this.resolverReady = true;
        console.log('🧠 Engine.init(): FormationResolver ready');
      } catch (err) {
        console.warn('⚠️ Engine.init(): FormationResolver failed:', err);
      }
    }
    // Request initial blueprint after a small delay to allow renderer mount
    setTimeout(() => this.buildAndEmitBlueprint(this.currentStage, this.currentQuality), 200);
  }

  // ————————————————————————————————————————————————————————————————
  // BeatBus Event Listeners
  // ————————————————————————————————————————————————————————————————
  initializeBeatBusListeners() {
    // Stage changes (e.g., scroll / UI)
    BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => {
      // Clear emergence blueprints on stage switch
      for (const key of Array.from(this.blueprintCache.keys())) {
        if (key.includes('emergence')) this.blueprintCache.delete(key);
      }
      const stage = payload.stage ?? payload.to;
      if (!stage) return;
      console.log(`🧠 Engine: Stage -> ${stage}`);
      this.currentStage = stage;
      this.buildAndEmitBlueprint(stage, this.currentQuality);
    });


// CTF pathway - completely separate from stage blueprints
BeatBus.on(EVENTS.CTF_BUILD, (config) => {
  console.log('🧠 Engine: CTF_BUILD received', config);
  const formation = this.buildEmergenceBlueprint({
    text: config.text || 'HELLO CURTIS',
    count: config.count || 2000
  });
  
  // Emit on CTF channel only
  BeatBus.emit(EVENTS.CTF_READY, { 
    formation,
    source: 'ConsciousnessEngine.CTF'
  });
});

    // Quality (TAQS tier) changes
    BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => {
      const tier = payload.tier ?? payload.quality;
      if (!tier) return;
      console.log(`🧠 Engine: Quality -> ${tier}`);
      this.currentQuality = tier;
      this.buildAndEmitBlueprint(this.currentStage, tier);
    });

    // Prewarm for emergence (opening)
    BeatBus.on(EVENTS.PREWARM_GENESIS_BLUEPRINT, () => {
      console.log('🧠 Engine: Prewarming genesis blueprint for emergence');
      const key = this._emergenceKey('HELLO CURTIS', 2000);
      if (!this.blueprintCache.has(key)) {
        const bp = this.buildEmergenceBlueprint({ text: 'HELLO CURTIS', count: 2000 });
        this.blueprintCache.set(key, bp);
      }
      BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
    });

    // Build emergence on demand (only once)
    BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
      if (this.emergenceBuilt) return;
      this.emergenceBuilt = true;

      const text = opts.sourceText || 'HELLO CURTIS';
      const count = opts.count || 2000;
      const tierBehaviors = opts.tierBehaviors || {
        tier1: { behavior: 'drift', ratio: 0.5 },
        tier2: { behavior: 'orbital', ratio: 0.2 },
        tier3: { behavior: 'twinkle', ratio: 0.15 },
        tier4: { behavior: 'prominent', ratio: 0.15 },
      };

      console.log('🧠 Engine: Building emergence blueprint');
      const key = this._emergenceKey(text, count);
      let bp = this.blueprintCache.get(key);
      const cached = !!bp;

      if (!bp) {
        bp = this.buildEmergenceBlueprint({ text, count, tierBehaviors });
        this.blueprintCache.set(key, bp);
      }

      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: bp,
        stage: 'genesis',
        quality: this.currentQuality,
        cached,
      });
    });

    // Initial request (when components are likely mounted)
    setTimeout(() => {
      console.log('🧠 Engine: Requesting initial state…');
      this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
    }, 500);
  }

  _emergenceKey(text, count) {
    return `emergence|${text}|${count}`;
  }

  // ————————————————————————————————————————————————————————————————
  // Build + emit
  // ————————————————————————————————————————————————————————————————
  buildAndEmitBlueprint(stage, quality) {
    const cacheKey = `${stage}|${quality}`;
    if (this.blueprintCache.has(cacheKey)) {
      const cachedBlueprint = this.blueprintCache.get(cacheKey);
      console.log(`🔨 Engine: Using cached blueprint for ${stage}|${quality}`);
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
  // Standard stage blueprint (atmospheric → target morph)
  //  ————————————————————————————————————————————————————————————————
  buildBlueprint(stageName, options = {}) {
    const startTime = performance.now();

    const stageConfig = Canonical?.stages?.[stageName] || {};
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
    const baseParticleCount = Number.isFinite(stageConfig.particleCount)
      ? stageConfig.particleCount
      : (SPEC_COUNTS[stageName] ?? 5000);
    const particleCount = this.getParticleCountForQuality(baseParticleCount, quality);

    console.log(`🧠 Building blueprint for ${stageName} with ${particleCount} particles (quality: ${quality})`);

    // SST cap
    const maxParticles = 15000;

    // Allocate max arrays; renderer will draw activeCount only
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const allenAtlasPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    // Tier distribution (fallback if not in Canonical)
    const tierConfig = stageConfig.tierDistribution || {
      tier1: { ratio: 0.5, sizeRange: [0.5, 0.7], opacityRange: [0.3, 0.7], behavior: 'drift' },
      tier2: { ratio: 0.2, sizeRange: [0.7, 0.9], opacityRange: [0.5, 0.8], behavior: 'orbital' },
      tier3: { ratio: 0.15, sizeRange: [1.0, 1.3], opacityRange: [0.7, 0.9], behavior: 'twinkle' },
      tier4: { ratio: 0.15, sizeRange: [1.3, 2.0], opacityRange: [0.8, 1.0], behavior: 'prominent' },
    };

    // Compute per-tier counts
    const t1 = Math.floor(particleCount * tierConfig.tier1.ratio);
    const t2 = Math.floor(particleCount * tierConfig.tier2.ratio);
    const t3 = Math.floor(particleCount * tierConfig.tier3.ratio);
    const t4 = particleCount - t1 - t2 - t3;

    // Generate tier blocks
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
      stageConfig,
      stageName
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
      stageConfig,
      stageName
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
      stageConfig,
      stageName
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
      stageConfig,
      stageName
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
  // Emergence (text → particles) minimal blueprint
  // ————————————————————————————————————————————————————————————————
  buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000, tierBehaviors = {} } = {}) {
    console.log(`🌟 Building emergence blueprint: "${text}" with ${count} particles`);

    const positions = this.textToParticlePositions(text, count);

    const tiers = new Uint8Array(count);
    const tierCounts = [
      Math.floor(count * 0.6), // T0 drift
      Math.floor(count * 0.2), // T1 orbital
      Math.floor(count * 0.1), // T2 twinkle
      Math.floor(count * 0.1), // T3 prominent
    ];
    const totalAssigned = tierCounts.reduce((a, b) => a + b, 0);
    if (totalAssigned < count) tierCounts[0] += count - totalAssigned;

    let write = 0;
    for (let t = 0; t < 4; t++) {
      for (let i = 0; i < tierCounts[t] && write < count; i++) tiers[write++] = t;
    }
    // Shuffle the tier assignment
    for (let i = count - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = tiers[i];
      tiers[i] = tiers[j];
      tiers[j] = tmp;
    }

    return {
      id: 'emergence-genesis',
      mode: 'emergence',
      stageName: 'genesis',
      count,
      particleCount: count,
      maxParticles: count,
      activeCount: count,
      positions,
      tiers,
      metadata: {
        sourceText: text,
        tierBehaviors,
        createdAt: Date.now(),
      },
    };
  }

  textToParticlePositions(text, count) {
    const positions = new Float32Array(count * 3);
    const charWidth = 10.0;
    const textHeight = 12.0;
    const centerY = 0;

    for (let i = 0; i < count; i++) {
      const charIndex = Math.floor(Math.random() * text.length);
      const baseX = (charIndex - text.length / 2) * charWidth;
      const x = baseX + (Math.random() - 0.5) * charWidth * 0.8;
      const y = centerY + (Math.random() - 0.5) * textHeight;
      const z = (Math.random() - 0.5) * 2.0;
      const k = i * 3;
      positions[k + 0] = x;
      positions[k + 1] = y;
      positions[k + 2] = z;
    }
    return positions;
  }

  // ————————————————————————————————————————————————————————————————
  // Tier particle generation with FormationResolver fallback chain
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
    stageCfg,
    stageName
  ) {
    const rnd = createSeededRandom(`${stageName || stageCfg?.name || 'stage'}-tier${tierIndex}`);

    // —— Atmospheric (full-viewport) cloud
    for (let i = 0; i < count; i++) {
      const idx3 = (startIndex + i) * 3;
      atmosphericPositions[idx3 + 0] = (rnd() - 0.5) * 120;  // width
      atmosphericPositions[idx3 + 1] = (rnd() - 0.5) * 90;   // height
      atmosphericPositions[idx3 + 2] = (rnd() - 0.5) * 40 + tierIndex * 5; // layered depth
    }

    // —— Target positions: Formation (genesis) → Brain pattern → sphere
    let targetPositions = null;

    // Prefer FormationResolver for genesis if ready
    if (this.resolverReady && (stageName || stageCfg?.name) === 'genesis') {
      // Use your canonical ID/variant; easy to parameterize via Canonical later
      // Note: your examples used 'HELLO_CURTIS' (underscore) for formation ID
      const formation = this.resolver.get('HELLO_CURTIS', 'hi');
      if (formation && formation.length >= 3) {
        targetPositions = formation;
      }
    }

    // Fallback to anatomically correct brain positions
    if (!targetPositions) {
      try {
        targetPositions = generateBrainRegionPositions(stageName || stageCfg?.name || 'genesis', count);
      } catch {
        targetPositions = null;
      }
    }

    // Copy into allenAtlasPositions (tile if needed). Scale for visibility.
    const scale =
      (stageCfg?.formation && typeof stageCfg.formation.scale === 'number')
        ? stageCfg.formation.scale
        : 4.0; // matches your previous visibility scale

    for (let i = 0; i < count; i++) {
      const dst = (startIndex + i) * 3;
      if (targetPositions) {
        // Tile/loop if source has fewer points than needed
        const srcBase = (i % Math.floor(targetPositions.length / 3)) * 3;
        allenAtlasPositions[dst + 0] = targetPositions[srcBase + 0] * scale;
        allenAtlasPositions[dst + 1] = targetPositions[srcBase + 1] * scale;
        allenAtlasPositions[dst + 2] = targetPositions[srcBase + 2] * scale;
      } else {
        // Ultimate fallback: random sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(Math.random() * 2 - 1);
        const r = 22 + Math.random() * 10;
        allenAtlasPositions[dst + 0] = r * Math.sin(theta) * Math.cos(phi);
        allenAtlasPositions[dst + 1] = r * Math.sin(theta) * Math.sin(phi);
        allenAtlasPositions[dst + 2] = r * Math.cos(theta);
      }
    }

    // —— Animation seeds & per-tier props
    const [sizeMin, sizeMax] = tierCfg.sizeRange || [1.0, 1.0];
    const [opacityMin, opacityMax] = tierCfg.opacityRange || [0.8, 1.0];
    const tierSprites = {
      0: [7],     // soft glow
      1: [0, 1],  // circle/gradient
      2: [4],     // diamond
      3: [1],     // gradient
    };
    const sprites = tierSprites[tierIndex] || [0];

    for (let i = 0; i < count; i++) {
      const idx = (startIndex + i);
      const k3 = idx * 3;

      animationSeeds[k3 + 0] = rnd();
      animationSeeds[k3 + 1] = rnd();
      animationSeeds[k3 + 2] = tierIndex; // encode behavior ID

      sizeMultipliers[idx] = sizeMin + rnd() * (sizeMax - sizeMin);
      opacityData[idx] = opacityMin + rnd() * (opacityMax - opacityMin);
      atlasIndices[idx] = sprites[Math.floor(rnd() * sprites.length)];
      tierData[idx] = tierIndex;
    }
  }

  // ————————————————————————————————————————————————————————————————
  // Quality tiers → particle counts
  // ————————————————————————————————————————————————————————————————
  getParticleCountForQuality(baseCount, quality) {
    const multipliers = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 1.0,
      ULTRA: 1.5,
    };
    const count = Math.floor(baseCount * (multipliers[quality] || 1.0));
    return Math.min(count, 15000);
  }

  // ————————————————————————————————————————————————————————————————
  // Cache / debug helpers
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
        .filter((k) => !k.startsWith('emergence'))
        .map((k) => k.split('|')[0]),
      emergenceKeys: Array.from(this.blueprintCache.keys()).filter((k) => k.startsWith('emergence')),
    };
  }

  forceRebuild(stage, quality) {
    const key = `${stage}_${quality}`;
    this.blueprintCache.delete(key);
    console.log(`🧠 Force rebuilding ${key}`);
    this.buildAndEmitBlueprint(stage, quality);
  }
}

// Singleton
const engine = new ConsciousnessEngine();

// Dev debug surface
if (typeof window !== 'undefined') {
  window.engineDebug = {
    getCacheStats: () => engine.getCacheStats(),
    clearCache: () => engine.clearCache(),
    preGenerate: () => {
      const stages = Object.keys(Canonical.stages || {});
      const qualities = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
      stages.forEach((stage) => {
        qualities.forEach((quality) => {
          engine.buildAndEmitBlueprint(stage, quality);
        });
      });
      console.log('🧠 Pre-generated all stage/quality combinations');
    },
    forceRebuild: (stage, quality) => engine.forceRebuild(stage, quality),
  };
}

export default engine;
