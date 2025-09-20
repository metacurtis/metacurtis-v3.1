// src/engine/ConsciousnessEngine.js
// Fixed version with working emergence blueprint builder

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import * as THREE from 'three';

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { createSeededRandom } from '../utils/random.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

class ConsciousnessEngine {
  constructor() {
    // Text / font
    this.font = null;
    this.text3DCache = new Map();
    this.text2DFallback = true;
    this.loadFont();

    // State / caches
    this.blueprintCache = new Map();
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';
    
    // Opening gates
    this._openingPhase = true;
    this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };

    // Emergence memory (for post-emergence genesis rebuild)
    this._lastEmergenceBlueprint = null;
    this._hasBuiltEmergence = false;

    // Initialize listeners IMMEDIATELY in constructor
    this.initializeBeatBusListeners();
    console.log('🧠 ConsciousnessEngine initialized with emergence support');
  }

  async init() {
    // Do not auto-build during opening; Director drives flow
  }

  initializeBeatBusListeners() {
    // Viewport hint from renderer - CRITICAL for proper sizing
    BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, (hint = {}) => {
      if (hint.width && hint.height) {
        this._viewportHint = {
          width: Number(hint.width),
          height: Number(hint.height),
          aspect: Number(hint.aspect || hint.width / hint.height),
        };
        console.log('🧠 Engine: viewport hint received', {
          width: this._viewportHint.width.toFixed(1),
          height: this._viewportHint.height.toFixed(1),
        });
      }
    });

    // Opening gate ends only after Director enables scroll
    BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
      console.log('🧠 Engine: Opening phase complete');
      this._openingPhase = false;
    });

    // Stage changes - BLOCK non-genesis during opening
    BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => {
      const stage = payload.stage ?? payload.to;
      if (!stage) return;

      // CRITICAL: Block non-genesis stages during opening
      if (this._openingPhase && stage !== 'genesis') {
        console.log(`🧠 Engine: Blocking ${stage} during opening phase`);
        return;
      }

      console.log(`🧠 Engine: Stage -> ${stage}`);
      this.currentStage = stage;
      this.buildAndEmitBlueprint(stage, this.currentQuality);
    });

    // Quality changes
    BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => {
      const tier = payload.tier ?? payload.quality;
      if (!tier) return;
      console.log(`🧠 Engine: Quality -> ${tier}`);
      this.currentQuality = tier;
      this.buildAndEmitBlueprint(this.currentStage, tier);
    });

    // Prewarm emergence - cache but don't emit
    BeatBus.on(EVENTS.PREWARM_GENESIS_BLUEPRINT, () => {
      console.log('🧠 Engine: Prewarming genesis blueprint');
      const key = 'genesis|HIGH';
      if (!this.blueprintCache.has(key)) {
        const bp = this.buildBlueprint('genesis', { quality: 'HIGH' });
        if (bp) {
          this.blueprintCache.set(key, bp);
        }
      }
      BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
    });

    // BUILD EMERGENCE - THIS IS THE CRITICAL HANDLER
    BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (payload = {}) => {
      try {
        console.log('🧠 Engine: BUILD_EMERGENCE_BLUEPRINT received', payload);
        
        // Build the emergence blueprint
        const blueprint = this.buildEmergenceBlueprint(payload);
        
        if (!blueprint) {
          console.error('🧠 Engine: Failed to build emergence blueprint');
          return;
        }

        // Remember for post-emergence Stage-0
        this._lastEmergenceBlueprint = blueprint;
        this._hasBuiltEmergence = true;

        // Emit emergence blueprint with mode flag
        BeatBus.emit(EVENTS.BLUEPRINT_READY, {
          blueprint,
          stage: 'genesis',
          quality: this.currentQuality,
          mode: 'emergence',
          cached: false
        });
        
        console.log('🧠 Engine: Emergence blueprint emitted', {
          count: blueprint.particleCount,
          mode: 'emergence'
        });

        // DO NOT emit PARTICLES_EMERGED - renderer owns this
        
      } catch (e) {
        console.error('[Engine] BUILD_EMERGENCE_BLUEPRINT error:', e);
      }
    });
  }

  // Build emergence blueprint (viewport spread → constellation)
  buildEmergenceBlueprint(payload = {}) {
    const {
      mode = 'emergence',
      source = 'viewportSpread',
      target = 'constellation',
      count = 2000,
      tierRatios = [0.5, 0.2, 0.15, 0.15],
      viewportHint = this._viewportHint
    } = payload;
    
    console.log(`🌟 Building emergence: ${source} → ${target} with ${count} particles`);
    
    // SOURCE: Full viewport dispersion (starting positions)
    const atmosphericPositions = this.generateViewportSpread(count, viewportHint);
    
    // TARGET: Constellation formation (ending positions)
    const text3DPositions = this.generateConstellationFormation(count, tierRatios, viewportHint);
    
    // Visual properties
    const sizeMultipliers = new Float32Array(count);
    const opacityData = new Float32Array(count);
    const atlasIndices = new Float32Array(count);
    const tierData = new Float32Array(count);
    const animationSeeds = new Float32Array(count * 3);
    
    const rnd = createSeededRandom('emergence');
    
    // Assign tier data based on ratios
    let tierIndex = 0;
    let tierCounter = 0;
    const tierCounts = tierRatios.map(r => Math.floor(count * r));
    tierCounts[3] += count - tierCounts.reduce((a, b) => a + b, 0);
    
    for (let i = 0; i < count; i++) {
      // Assign tier
      if (tierCounter >= tierCounts[tierIndex] && tierIndex < 3) {
        tierIndex++;
        tierCounter = 0;
      }
      tierData[i] = tierIndex;
      tierCounter++;
      
      // Size based on tier
      const tierSizeScale = [1.0, 0.85, 0.7, 0.6][tierIndex];
      sizeMultipliers[i] = (0.5 + rnd() * 1.0) * tierSizeScale;
      
      // Opacity based on tier
      const tierOpacityRange = [
        [0.3, 0.6],  // Tier 0: atmospheric
        [0.4, 0.7],  // Tier 1: spatial
        [0.5, 0.8],  // Tier 2: anchors
        [0.6, 0.9],  // Tier 3: core
      ][tierIndex];
      opacityData[i] = tierOpacityRange[0] + rnd() * (tierOpacityRange[1] - tierOpacityRange[0]);
      
      // Sprite variety based on tier
      const tierSpriteOptions = [
        [0, 1, 7],        // Tier 0: soft sprites
        [0, 1, 2, 7],     // Tier 1: mixed
        [2, 4, 5],        // Tier 2: structured
        [4, 5, 11],       // Tier 3: crystalline
      ][tierIndex];
      atlasIndices[i] = tierSpriteOptions[Math.floor(rnd() * tierSpriteOptions.length)];
      
      // Animation seeds
      const j = i * 3;
      animationSeeds[j]     = rnd();
      animationSeeds[j + 1] = rnd();
      animationSeeds[j + 2] = rnd();
    }
    
    // Log telemetry for verification
    try {
      window.__emergence_telemetry = {
        source: 'viewportSpread',
        target: 'constellation',
        count,
        tierDistribution: tierCounts,
        viewportScale: viewportHint
      };
      console.log('   Emergence telemetry saved to window.__emergence_telemetry');
    } catch {}
    
    return {
      id: 'emergence-corrected',
      mode: 'emergence',
      stageName: 'genesis',
      count,
      particleCount: count,
      maxParticles: count,
      activeCount: count,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: {
        source,
        target,
        viewport: viewportHint,
        tierRatios,
        tierCounts,
      },
    };
  }

  // Helper: Full-viewport dispersed starting positions
  generateViewportSpread(N, hint) {
    const { width = 120, height = 90, aspect = (120/90) } = hint || this._viewportHint;
    const out = new Float32Array(N * 3);
    
    // Use viewport-relative units
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const zDepth = Math.max(width, height) * 0.3;
    
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      // Full viewport spread
      const x = (Math.random() * 2 - 1) * halfW;
      const y = (Math.random() * 2 - 1) * halfH;
      const z = (Math.random() * 2 - 1) * zDepth;
      
      out[j]     = x;
      out[j + 1] = y;
      out[j + 2] = z;
    }
    
    console.log(`   Generated viewport spread: ±${halfW.toFixed(1)} x ±${halfH.toFixed(1)} x ±${zDepth.toFixed(1)}`);
    return out;
  }

  // Helper: Constellation end positions with 4-tier structure
  generateConstellationFormation(N, tierRatios = [0.5, 0.2, 0.15, 0.15], hint) {
    const out = new Float32Array(N * 3);
    const rnd = createSeededRandom('constellation');
    
    // Calculate tier counts
    const tierCounts = [
      Math.floor(N * tierRatios[0]),
      Math.floor(N * tierRatios[1]),
      Math.floor(N * tierRatios[2]),
      Math.floor(N * tierRatios[3]),
    ];
    // Adjust last tier for rounding
    const sum = tierCounts[0] + tierCounts[1] + tierCounts[2];
    tierCounts[3] = N - sum;
    
    let idx = 0;
    
    // Tier 0: Outer atmospheric layer
    for (let i = 0; i < tierCounts[0]; i++) {
      const j = idx * 3;
      const angle = (i / tierCounts[0]) * Math.PI * 2;
      const radius = 30 + rnd() * 10;
      out[j]     = Math.cos(angle) * radius;
      out[j + 1] = Math.sin(angle) * radius * 0.6;
      out[j + 2] = (rnd() - 0.5) * 15;
      idx++;
    }
    
    // Tier 1: Spatial structure layer
    for (let i = 0; i < tierCounts[1]; i++) {
      const j = idx * 3;
      const angle = (i / tierCounts[1]) * Math.PI * 2;
      const radius = 20 + rnd() * 5;
      out[j]     = Math.cos(angle) * radius;
      out[j + 1] = Math.sin(angle) * radius * 0.7;
      out[j + 2] = (rnd() - 0.5) * 10;
      idx++;
    }
    
    // Tier 2: Memory anchors
    for (let i = 0; i < tierCounts[2]; i++) {
      const j = idx * 3;
      const angle = (i / tierCounts[2]) * Math.PI * 2;
      const radius = 12 + rnd() * 3;
      out[j]     = Math.cos(angle) * radius;
      out[j + 1] = Math.sin(angle) * radius * 0.8;
      out[j + 2] = (rnd() - 0.5) * 5;
      idx++;
    }
    
    // Tier 3: Core constellation
    for (let i = 0; i < tierCounts[3]; i++) {
      const j = idx * 3;
      const angle = (i / tierCounts[3]) * Math.PI * 2;
      const radius = 5 + rnd() * 3;
      out[j]     = Math.cos(angle) * radius;
      out[j + 1] = Math.sin(angle) * radius;
      out[j + 2] = (rnd() - 0.5) * 2;
      idx++;
    }
    
    console.log(`   Generated constellation with ${N} particles in 4 tiers`);
    return out;
  }

  // Build standard stages with post-emergence handling
  buildAndEmitBlueprint(stage, quality) {
    if (this._openingPhase && stage !== 'genesis') {
      console.warn('🧠 Engine: blocked non-genesis during opening:', stage);
      return;
    }
    
    const cacheKey = `${stage}|${quality}`;
    let blueprint = this.blueprintCache.get(cacheKey);

    // After emergence, use emergence endpoints as genesis source
    if (stage === 'genesis' && this._hasBuiltEmergence && this._lastEmergenceBlueprint) {
      console.log('🧠 Engine: Building post-emergence genesis (constellation → text)');

      const baseCount = 2000;
      const particleCount = this.getParticleCountForQuality(baseCount, quality);
      
      // Build standard genesis blueprint
      blueprint = this.buildBlueprint(stage, { quality });

      // Override atmospheric positions with constellation endpoints from emergence
      const emergenceTargets = this._lastEmergenceBlueprint.text3DPositions;
      const n = Math.min(particleCount * 3, emergenceTargets.length);
      for (let i = 0; i < n; i++) {
        blueprint.atmosphericPositions[i] = emergenceTargets[i];
      }

      // Clear flag after use
      this._hasBuiltEmergence = false;

      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
        stage,
        quality,
        cached: false,
      });
      return;
    }

    // Normal path: cached or fresh build
    if (blueprint) {
      console.log(`🧠 Using cached blueprint for ${stage}|${quality}`);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
        stage,
        quality,
        cached: true,
      });
      return;
    }

    console.log(`🧠 Building new blueprint for ${stage}|${quality}`);
    blueprint = this.buildBlueprint(stage, { quality });

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

  // Build generic stage blueprint
  buildBlueprint(stageName, options = {}) {
    const STAGE_TEXTS = {
      genesis: 'HELLO CURTIS',
      discipline: 'STRUCTURE',
      neural: 'AWAKENING',
      velocity: 'VELOCITY',
      architecture: 'SYSTEMS',
      harmony: 'FLOW STATE',
      transcendence: 'CONSCIOUSNESS',
    };

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
      console.error(`Stage ${stageName} not found`);
      return null;
    }

    const quality = options.quality || this.currentQuality;
    const baseParticleCount = stageConfig.particleCount || SPEC_COUNTS[stageName] || 5000;
    const particleCount = this.getParticleCountForQuality(baseParticleCount, quality);

    console.log(`🧠 Building ${stageName}: ${particleCount} particles`);

    const maxParticles = 15000;
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const text3DPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    const textFormation = this.generate3DTextFormation(
      STAGE_TEXTS[stageName] || stageName.toUpperCase(),
      particleCount
    );

    const rnd = createSeededRandom(stageName);
    for (let i = 0; i < particleCount; i++) {
      const j = i * 3;

      // Default atmospheric positions
      atmosphericPositions[j + 0] = (rnd() - 0.5) * 120;
      atmosphericPositions[j + 1] = (rnd() - 0.5) * 90;
      atmosphericPositions[j + 2] = (rnd() - 0.5) * 40;

      // Text formation positions
      if (textFormation && j + 2 < textFormation.length) {
        text3DPositions[j + 0] = textFormation[j + 0] * 4;
        text3DPositions[j + 1] = textFormation[j + 1] * 4;
        text3DPositions[j + 2] = textFormation[j + 2] * 4;
      }

      animationSeeds[j + 0] = rnd();
      animationSeeds[j + 1] = rnd();
      animationSeeds[j + 2] = rnd();

      sizeMultipliers[i] = 0.5 + rnd() * 1.5;
      opacityData[i] = 0.3 + rnd() * 0.7;
      atlasIndices[i] = Math.floor(rnd() * 8);
      tierData[i] = Math.floor(rnd() * 4);
    }

    return {
      stageName,
      particleCount,
      maxParticles,
      activeCount: particleCount,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: { quality, buildTime: 0 },
    };
  }

  // Utility functions
  textToParticlePositions(text, count) {
    const positions = new Float32Array(count * 3);
    const charWidth = 8.0, textHeight = 12.0;
    for (let i = 0; i < count; i++) {
      const ci = Math.floor(Math.random() * text.length);
      const baseX = (ci - text.length / 2) * charWidth;
      positions[i * 3 + 0] = baseX + (Math.random() - 0.5) * charWidth * 0.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * textHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return positions;
  }

  getParticleCountForQuality(baseCount, quality) {
    const mult = { LOW: 0.3, MEDIUM: 0.6, HIGH: 1.0, ULTRA: 1.5 }[quality] ?? 1.0;
    return Math.min(Math.floor(baseCount * mult), 15000);
  }

  async loadFont() {
    try {
      const loader = new FontLoader();
      const response = await fetch('/fonts/helvetiker_bold.typeface.json');
      if (response.ok) {
        const fontData = await response.json();
        this.font = loader.parse(fontData);
        this.text2DFallback = false;
        console.log('✅ 3D font loaded');
      }
    } catch (e) {
      console.warn('Using 2D fallback:', e.message);
    }
  }

  generate3DTextFormation(text, count) {
    const cacheKey = `${text}_${count}`;
    if (this.text3DCache.has(cacheKey)) return this.text3DCache.get(cacheKey);
    if (!this.font) return this.textToParticlePositions(text, count);

    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 8,
      height: 0.5,
      curveSegments: 4,
      bevelEnabled: false,
    });
    geometry.computeBoundingBox();
    geometry.center();

    const pos = [];
    const attr = geometry.attributes.position;
    for (let i = 0; i < attr.count && pos.length < count * 3; i++) {
      pos.push(attr.getX(i), attr.getY(i), attr.getZ(i) * 0.1);
    }

    const result = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      result[i] = pos[i] ?? (Math.random() - 0.5) * 10;
    }

    geometry.dispose();
    this.text3DCache.set(cacheKey, result);
    return result;
  }

  clearCache() {
    this.blueprintCache.clear();
    this._lastEmergenceBlueprint = null;
    this._hasBuiltEmergence = false;
    console.log('🧠 Cache cleared');
  }

  getCacheStats() {
    return {
      size: this.blueprintCache.size,
      keys: Array.from(this.blueprintCache.keys()),
      hasEmergenceBlueprint: !!this._lastEmergenceBlueprint,
      hasBuiltEmergence: this._hasBuiltEmergence,
      viewportHint: this._viewportHint,
      openingPhase: this._openingPhase,
    };
  }
}

// Create and export singleton
const engine = new ConsciousnessEngine();
if (typeof window !== 'undefined') {
  window.consciousnessEngine = engine;
}
export default engine;