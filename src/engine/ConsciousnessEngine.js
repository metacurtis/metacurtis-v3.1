// src/engine/ConsciousnessEngine.js
// Canon-compliant production version with HMR safety, validation, and efficiency

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

    // State / caches
    this.blueprintCache = new Map();
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';
    
    // Opening gates
    this._openingPhase = true;
    this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };

    // Emergence memory - store only targets, not full blueprint
    this._lastEmergenceTargets = null;

    // HMR safety
    this._listeners = [];
    this._initialized = false;

    // Diagnostics
    this._eventLog = [];
    
    // Initialize once
    this.init();
  }

  init() {
    // Idempotent initialization
    if (this._initialized) return;
    this._initialized = true;
    
    this.loadFont();
    this._installListeners();
    console.log('🧠 ConsciousnessEngine: Initialized (Canon-compliant, HMR-safe)');
  }

  // HMR-safe listener installation
  _installListeners() {
    // Clean up any existing listeners first
    this._cleanupListeners();
    
    // Install listeners with stable method references
    this._listeners.push(
      BeatBus.on(this._ev('ENGINE_VIEWPORT_HINT'), this._onViewportHint.bind(this))
    );
    this._listeners.push(
      BeatBus.on(this._ev('ENABLE_SCROLL'), this._onEnableScroll.bind(this))
    );
    this._listeners.push(
      BeatBus.on(this._ev('STAGE_CHANGE'), this._onStageChange.bind(this))
    );
    this._listeners.push(
      BeatBus.on(this._ev('QUALITY_CHANGE'), this._onQualityChange.bind(this))
    );
    this._listeners.push(
      BeatBus.on(this._ev('PREWARM_GENESIS_BLUEPRINT'), this._onPrewarmGenesis.bind(this))
    );
    this._listeners.push(
      BeatBus.on(this._ev('BUILD_EMERGENCE_BLUEPRINT'), this._onBuildEmergence.bind(this))
    );
  }

  // Clean up listeners for HMR
  _cleanupListeners() {
    if (this._listeners?.length) {
      this._listeners.forEach(off => off && off());
      this._listeners = [];
    }
  }

  // Event name tolerance (accept strings or EVENTS constants)
  _ev(eventName) {
    return EVENTS?.[eventName] || eventName;
  }

  // --- Event Handlers (stable method references) ---

  _onViewportHint(hint = {}) {
    if (hint.width && hint.height) {
      this._viewportHint = {
        width: Number(hint.width),
        height: Number(hint.height),
        aspect: Number(hint.aspect || hint.width / hint.height),
      };
      this._log('viewport_hint', {
        width: this._viewportHint.width.toFixed(1),
        height: this._viewportHint.height.toFixed(1),
      });
    }
  }

  _onEnableScroll() {
    console.log('🧠 Engine: Opening phase complete');
    this._openingPhase = false;
    this._log('scroll_enabled');
  }

  _onStageChange(payload = {}) {
    const stage = payload.stage ?? payload.to;
    if (!stage) return;

    // CRITICAL: Block non-genesis stages during opening
    if (this._openingPhase && stage !== 'genesis') {
      console.log(`🧠 Engine: Blocking ${stage} during opening phase`);
      this._log('stage_blocked', { stage, reason: 'opening_phase' });
      return;
    }

    console.log(`🧠 Engine: Stage -> ${stage}`);
    this.currentStage = stage;
    this.buildAndEmitBlueprint(stage, this.currentQuality);
    this._log('stage_change', { stage });
  }

  _onQualityChange(payload = {}) {
    const tier = payload.tier ?? payload.quality;
    if (!tier) return;
    
    console.log(`🧠 Engine: Quality -> ${tier}`);
    this.currentQuality = tier;
    this.buildAndEmitBlueprint(this.currentStage, tier);
    this._log('quality_change', { tier });
  }

  _onPrewarmGenesis() {
    console.log('🧠 Engine: Prewarming genesis blueprint');
    const key = 'genesis|HIGH';
    if (!this.blueprintCache.has(key)) {
      const bp = this.buildBlueprint('genesis', { quality: 'HIGH' });
      if (bp && this._validateBlueprint(bp)) {
        this.blueprintCache.set(key, bp);
      }
    }
    BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
    this._log('prewarm_complete', { key });
  }

  _onBuildEmergence(payload = {}) {
    try {
      console.log('🧠 Engine: BUILD_EMERGENCE_BLUEPRINT received', payload);
      
      // Build the emergence blueprint
      const blueprint = this.buildEmergenceBlueprint(payload);
      
      // Validate before proceeding
      if (!this._validateBlueprint(blueprint)) {
        console.error('🧠 Engine: Invalid emergence blueprint, not emitting');
        this._log('emergence_validation_failed');
        return;
      }

      // Store ONLY the target positions (not the full blueprint)
      this._lastEmergenceTargets = blueprint.text3DPositions;

      // Emit emergence blueprint with mode flag (canonical event)
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
      
      this._log('emergence_built', { count: blueprint.particleCount });

      // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost
      
    } catch (e) {
      console.error('[Engine] BUILD_EMERGENCE_BLUEPRINT error:', e);
      this._log('emergence_error', { error: e.message });
    }
  }

  // --- Blueprint Generation ---

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
    
    // Allocate exact size arrays (not maxParticles)
    const atmosphericPositions = this.generateViewportSpread(count, viewportHint);
    const text3DPositions = this.generateConstellationFormation(count, tierRatios, viewportHint);
    
    // Visual properties - exact size allocation
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
    
    return {
      id: 'emergence-canon',
      mode: 'emergence',
      stageName: 'genesis',
      particleCount: count,
      maxParticles: count,  // Match exact allocation
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

  buildAndEmitBlueprint(stage, quality) {
    if (this._openingPhase && stage !== 'genesis') {
      console.warn('🧠 Engine: Blocked non-genesis during opening:', stage);
      return;
    }
    
    const cacheKey = `${stage}|${quality}`;
    let blueprint = this.blueprintCache.get(cacheKey);

    // Post-emergence genesis: use emergence targets as source
    if (stage === 'genesis' && this._lastEmergenceTargets) {
      console.log('🧠 Engine: Building post-emergence genesis (constellation → text)');

      // Build standard genesis blueprint
      blueprint = this.buildBlueprint(stage, { quality });
      
      if (blueprint) {
        // Use emergence endpoints as atmospheric source
        const targets = this._lastEmergenceTargets;
        const n = Math.min(blueprint.atmosphericPositions.length, targets.length);
        blueprint.atmosphericPositions.set(targets.subarray(0, n), 0);
        
        // Consume targets once
        this._lastEmergenceTargets = null;

        // Validate and emit
        if (this._validateBlueprint(blueprint)) {
          BeatBus.emit(EVENTS.BLUEPRINT_READY, {
            blueprint,
            stage,
            quality,
            cached: false,
          });
          this._log('blueprint_emitted', { stage, quality, mode: 'post-emergence' });
        }
      }
      return;
    }

    // Normal path: cached or fresh build
    if (blueprint) {
      console.log(`🧠 Using cached blueprint for ${stage}|${quality}`);
      if (this._validateBlueprint(blueprint)) {
        BeatBus.emit(EVENTS.BLUEPRINT_READY, {
          blueprint,
          stage,
          quality,
          cached: true,
        });
        this._log('blueprint_emitted', { stage, quality, cached: true });
      }
      return;
    }

    // Build fresh
    console.log(`🧠 Building new blueprint for ${stage}|${quality}`);
    blueprint = this.buildBlueprint(stage, { quality });

    if (blueprint && this._validateBlueprint(blueprint)) {
      this.blueprintCache.set(cacheKey, blueprint);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
        stage,
        quality,
        cached: false,
      });
      this._log('blueprint_emitted', { stage, quality, cached: false });
    }
  }

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

    // EXACT SIZE ALLOCATION - not maxParticles
    const atmosphericPositions = new Float32Array(particleCount * 3);
    const text3DPositions = new Float32Array(particleCount * 3);
    const animationSeeds = new Float32Array(particleCount * 3);
    const sizeMultipliers = new Float32Array(particleCount);
    const opacityData = new Float32Array(particleCount);
    const atlasIndices = new Float32Array(particleCount);
    const tierData = new Float32Array(particleCount);

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
      maxParticles: particleCount,  // Match exact allocation
      activeCount: particleCount,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: { quality, buildTime: performance.now() },
    };
  }

  // --- Validation ---

  _validateBlueprint(bp) {
    if (!bp) return false;
    
    const a = bp.atmosphericPositions;
    const t = bp.text3DPositions;
    
    // Check existence and non-empty
    if (!(a && t && a.length && t.length)) {
      console.error('Blueprint validation failed: missing arrays');
      return false;
    }
    
    // Check alignment (divisible by 3)
    if (a.length % 3 !== 0 || t.length % 3 !== 0) {
      console.error('Blueprint validation failed: array length not divisible by 3');
      return false;
    }
    
    // Check matching lengths
    if (a.length !== t.length) {
      console.error('Blueprint validation failed: array length mismatch');
      return false;
    }
    
    // Check for NaN/Infinity
    for (let i = 0; i < a.length; i++) {
      if (!isFinite(a[i]) || !isFinite(t[i])) {
        console.error('Blueprint validation failed: NaN/Infinity detected');
        return false;
      }
    }
    
    return true;
  }

  // --- Helper Functions ---

  generateViewportSpread(N, hint) {
    const { width = 120, height = 90 } = hint || this._viewportHint;
    const out = new Float32Array(N * 3);
    
    // Use viewport-relative units
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const zDepth = Math.max(width, height) * 0.3;
    
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      out[j]     = (Math.random() * 2 - 1) * halfW;
      out[j + 1] = (Math.random() * 2 - 1) * halfH;
      out[j + 2] = (Math.random() * 2 - 1) * zDepth;
    }
    
    return out;
  }

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
    
    return out;
  }

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

  // --- Diagnostics ---

  _log(type, data = {}) {
    this._eventLog.push({
      type,
      t: performance.now(),
      data
    });
    
    // Keep last 100 events
    if (this._eventLog.length > 100) {
      this._eventLog.shift();
    }
  }

  getStats() {
    return {
      cacheSize: this.blueprintCache.size,
      cachedStages: Array.from(this.blueprintCache.keys()),
      openingPhase: this._openingPhase,
      viewportHint: this._viewportHint,
      hasEmergenceTargets: !!this._lastEmergenceTargets,
      lastEvents: this._eventLog.slice(-20),
    };
  }

  clearCache() {
    this.blueprintCache.clear();
    this._lastEmergenceTargets = null;
    console.log('🧠 Cache cleared');
  }

  // Cleanup for HMR
  destroy() {
    this._cleanupListeners();
    this.clearCache();
    this._initialized = false;
  }
}

// HMR-safe singleton
let engine;
if (typeof window !== 'undefined') {
  // Reuse existing instance on HMR
  if (window.__consciousnessEngine) {
    engine = window.__consciousnessEngine;
    engine.init(); // Safe to call multiple times
  } else {
    engine = new ConsciousnessEngine();
    window.__consciousnessEngine = engine;
  }
} else {
  engine = new ConsciousnessEngine();
}

// Export singleton
export default engine;