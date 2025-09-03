// src/engine/ConsciousnessEngine.js
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as THREE from "three";
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { createSeededRandom } from '../utils/random.js';
import BeatBus from '@/modules/orchestration/core/BeatBus.js';
import { EVENTS } from '@/theater/events.js';

class ConsciousnessEngine {
  constructor() {
    // 3D Text support
    this.font = null;
    this.text3DCache = new Map();
    this.text2DFallback = true;
    this.loadFont();
    
    // Caches & state
    this.blueprintCache = new Map();
    this.emergenceBuilt = false;
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';

    // BeatBus wire-up
    this.initializeBeatBusListeners();
    console.log('🧠 ConsciousnessEngine initialized');
  }

  async init() {
    // Request initial blueprint after delay
    setTimeout(() => this.buildAndEmitBlueprint(this.currentStage, this.currentQuality), 200);
  }

  initializeBeatBusListeners() {
    // Stage changes
    BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => {
      for (const key of Array.from(this.blueprintCache.keys())) {
        if (key.includes('emergence')) this.blueprintCache.delete(key);
      }
      const stage = payload.stage ?? payload.to;
      if (!stage) return;
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

    // Prewarm
    BeatBus.on(EVENTS.PREWARM_GENESIS_BLUEPRINT, () => {
      console.log('🧠 Engine: Prewarming genesis blueprint');
      const key = this._emergenceKey('HELLO CURTIS', 2000);
      if (!this.blueprintCache.has(key)) {
        const bp = this.buildEmergenceBlueprint({ text: 'HELLO CURTIS', count: 2000 });
        this.blueprintCache.set(key, bp);
      }
      BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
    });

    // Build emergence
    BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
      if (this.emergenceBuilt) return;
      this.emergenceBuilt = true;

      const text = opts.sourceText || 'HELLO CURTIS';
      const count = opts.count || 2000;
      
      console.log('🧠 Engine: Building emergence blueprint');
      const key = this._emergenceKey(text, count);
      let bp = this.blueprintCache.get(key);
      const cached = !!bp;

      if (!bp) {
        bp = this.buildEmergenceBlueprint({ text, count });
        this.blueprintCache.set(key, bp);
      }

      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: bp,
        stage: 'genesis',
        quality: this.currentQuality,
        cached,
      });
    });

    // Initial request
    setTimeout(() => {
      console.log('🧠 Engine: Requesting initial state');
      this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
    }, 500);
  }

  _emergenceKey(text, count) {
    return `emergence|${text}|${count}`;
  }

  buildAndEmitBlueprint(stage, quality) {
    const cacheKey = `${stage}|${quality}`;
    if (this.blueprintCache.has(cacheKey)) {
      const cachedBlueprint = this.blueprintCache.get(cacheKey);
      console.log(`🧠 Using cached blueprint for ${stage}|${quality}`);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: cachedBlueprint,
        stage,
        quality,
        cached: true,
      });
      return;
    }

    console.log(`🧠 Building new blueprint for ${stage}|${quality}`);
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

  buildBlueprint(stageName, options = {}) {
    const STAGE_TEXTS = {
      genesis: "HELLO CURTIS",
      discipline: "STRUCTURE",
      neural: "AWAKENING",
      velocity: "VELOCITY",
      architecture: "SYSTEMS",
      harmony: "FLOW STATE",
      transcendence: "CONSCIOUSNESS"
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

    // Generate text positions
    const textFormation = this.generate3DTextFormation(
      STAGE_TEXTS[stageName] || stageName.toUpperCase(),
      particleCount
    );

    // Fill atmospheric and text positions
    const rnd = createSeededRandom(stageName);
    for (let i = 0; i < particleCount; i++) {
      const idx3 = i * 3;
      
      // Atmospheric positions
      atmosphericPositions[idx3] = (rnd() - 0.5) * 120;
      atmosphericPositions[idx3 + 1] = (rnd() - 0.5) * 90;
      atmosphericPositions[idx3 + 2] = (rnd() - 0.5) * 40;
      
      // Text positions
      if (textFormation && i * 3 < textFormation.length) {
        text3DPositions[idx3] = textFormation[i * 3] * 4;
        text3DPositions[idx3 + 1] = textFormation[i * 3 + 1] * 4;
        text3DPositions[idx3 + 2] = textFormation[i * 3 + 2] * 4;
      }
      
      // Animation seeds
      animationSeeds[idx3] = rnd();
      animationSeeds[idx3 + 1] = rnd();
      animationSeeds[idx3 + 2] = rnd();
      
      // Visual properties
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
      metadata: {
        quality,
        buildTime: 0,
      },
    };
  }

  // HOTDORS_FULL_EMERGENCE: Engine emits full arrays; renderer remains a dumb sink
  buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000 } = {}) {
    console.log(`🌟 Building emergence: "${text}" with ${count} particles`);

    // Base 2D text particle positions
    const positions = this.textToParticlePositions(text, count);
    const tiers = new Uint8Array(count);
    for (let i = 0; i < count; i++) tiers[i] = Math.floor(Math.random() * 4);

    // Derive full blueprint arrays here (moved from renderer)
    const sizeByTier = [0.6, 0.8, 1.2, 1.5];
    const opacityByTier = [0.5, 0.6, 0.75, 0.9];
    const atlasByTier = [7, 1, 4, 1];

    const maxParticles = count;
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const text3DPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    // Use a seeded rnd so emergence is stable
    const rnd = (Math.random && Math.random.bind(Math)) || (()=>0.5);

    for (let i = 0; i < count; i++) {
      const j = i * 3;
      // Atmospheric: spread around the text area
      atmosphericPositions[j + 0] = positions[j + 0] + (Math.random() - 0.5) * 60;
      atmosphericPositions[j + 1] = positions[j + 1] + (Math.random() - 0.5) * 45;
      atmosphericPositions[j + 2] = (Math.random() - 0.5) * 40;

      // Text target = same glyph positions (shallow Z)
      text3DPositions[j + 0] = positions[j + 0];
      text3DPositions[j + 1] = positions[j + 1];
      text3DPositions[j + 2] = positions[j + 2];

      const t = tiers[i] | 0;
      tierData[i] = t;
      sizeMultipliers[i] = sizeByTier[t] ?? 1.0;
      opacityData[i] = opacityByTier[t] ?? 0.8;
      atlasIndices[i] = atlasByTier[t] ?? 1;

      animationSeeds[j + 0] = Math.random();
      animationSeeds[j + 1] = Math.random();
      animationSeeds[j + 2] = Math.random();
    }

    return {
      id: 'emergence-genesis',
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
        sourceText: text,
        createdAt: Date.now(),
      },
    };
  }

  textToParticlePositions(text, count) {
    const positions = new Float32Array(count * 3);
    const charWidth = 8.0;
    const textHeight = 12.0;

    for (let i = 0; i < count; i++) {
      const charIndex = Math.floor(Math.random() * text.length);
      const baseX = (charIndex - text.length / 2) * charWidth;
      positions[i * 3] = baseX + (Math.random() - 0.5) * charWidth * 0.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * textHeight;
     positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Very shallow Z
    }
    return positions;
  }

  getParticleCountForQuality(baseCount, quality) {
    const multipliers = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 1.0,
      ULTRA: 1.5,
    };
    return Math.min(Math.floor(baseCount * (multipliers[quality] || 1.0)), 15000);
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
    if (this.text3DCache.has(cacheKey)) {
      return this.text3DCache.get(cacheKey);
    }

    if (!this.font) { // Force 2D for testing 
      return this.textToParticlePositions(text, count);
    }

    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 8,
      height: .5,
      curveSegments: 4,
      bevelEnabled: false
    });
    
    geometry.computeBoundingBox();
    geometry.center();
    
    const positions = [];
    const posAttr = geometry.attributes.position;
    
    for (let i = 0; i < posAttr.count && positions.length < count * 3; i++) {
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i) * 0.1);
    }
    
    const result = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      result[i] = positions[i] || ((Math.random() - 0.5) * 10);
    }
    
    geometry.dispose();
    this.text3DCache.set(cacheKey, result);
    return result;
  }

  clearCache() {
    this.blueprintCache.clear();
    console.log('🧠 Cache cleared');
  }

  getCacheStats() {
    return {
      size: this.blueprintCache.size,
      keys: Array.from(this.blueprintCache.keys()),
    };
  }
}

const engine = new ConsciousnessEngine();

if (typeof window !== 'undefined') {
  window.consciousnessEngine = engine;
}

export default engine;