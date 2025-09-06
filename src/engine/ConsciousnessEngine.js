// src/engine/ConsciousnessEngine.js
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as _THREE from "three";
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
    this.currentStage   = 'genesis';
    this.currentQuality = 'HIGH';
    // Opening gates / fences
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;

    // Emergence memory (for post-emergence genesis rebuild)
    this._lastEmergenceCloud = null;
    this._hasBuiltEmergence  = false;

    // Viewport hint from renderer
    this._viewportHint = { width: 120, height: 90, aspect: 4/3 };

    // Opening phase gate (until ENABLE_SCROLL)
    this._openingPhase = true;

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
          width:  Number(hint.width),
          height: Number(hint.height),
          aspect: Number(hint.aspect || hint.width / hint.height),
        };
        console.log('🧠 Engine: viewport hint received', {
          width: this._viewportHint.width.toFixed(1),
          height: this._viewportHint.height.toFixed(1)
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
  console.log('🧠 Engine: Prewarming emergence blueprint');
  const key = this._emergenceKey('HELLO CURTIS', 2000);
  if (!this.blueprintCache.has(key)) {
    const bp = this.buildEmergenceBlueprint({ text: 'HELLO CURTIS', count: 2000 });
    this.blueprintCache.set(key, bp);
  }
  BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key }); // THIS LINE IS ALREADY THERE
});

    // BUILD EMERGENCE - Critical for T1
    BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
      const text  = opts.sourceText || 'HELLO CURTIS';
      const count = opts.count || 2000;

      console.log('🧠 Engine: Building emergence blueprint for', text);
      const key = this._emergenceKey(text, count);
      let bp = this.blueprintCache.get(key);

      if (!bp) {
        bp = this.buildEmergenceBlueprint({ text, count });
        this.blueprintCache.set(key, bp);
      }

      // Remember ember cloud for post-emergence Stage-0
      this._lastEmergenceCloud = bp.text3DPositions.slice(0);
      this._hasBuiltEmergence  = true;

      // Emit emergence blueprint with mode flag
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint: bp,
        stage: 'genesis',
        quality: this.currentQuality,
        cached: false,
        mode: 'emergence' // CRITICAL: renderer needs this to identify emergence
      });
    });
  }

  _emergenceKey(text, count) {
    return `emergence|${text}|${count}`;
  }

  // Canvas-based glyph sampler for "HELLO CURTIS"
  _makeCanvas(w, h) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = Math.max(64, Math.floor(w));
    c.height = Math.max(64, Math.floor(h));
    return c;
  }

  _sampleTextToPositions(text, count, opts = {}) {
    const {
      font = 'bold 96px Courier New, monospace',
      padding = 32,
      threshold = 0.5,
      worldScale = 0.12
    } = opts;

    const W = Math.max(320, text.length * 58) + padding * 2;
    const H = 140 + padding * 2;
    const canvas = this._makeCanvas(W, H);
    
    if (!canvas) {
      // Fallback grid if no DOM
      const positions = new Float32Array(count * 3);
      const side = Math.ceil(Math.sqrt(count));
      let k = 0;
      for (let y = 0; y < side && k < count; y++) {
        for (let x = 0; x < side && k < count; x++, k++) {
          positions[k*3+0] = (x - side/2);
          positions[k*3+1] = (y - side/2);
          positions[k*3+2] = 0;
        }
      }
      return positions;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, W/2, H/2);

    const img = ctx.getImageData(0, 0, W, H).data;
    const hits = [];
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const a = img[(j * W + i) * 4 + 3] / 255;
        if (a >= threshold) hits.push([i, j]);
      }
    }

    console.log(`🧠 Glyph sampler: found ${hits.length} pixels for "${text}"`);

    const positions = new Float32Array(count * 3);
    for (let k = 0; k < count; k++) {
      const r = Math.floor(Math.random() * hits.length);
      const [px, py] = hits[r] || [W/2, H/2];
      positions[k*3+0] = (px - W/2) * worldScale;
      positions[k*3+1] = (H/2 - py) * worldScale;
      positions[k*3+2] = 0;
    }
    
    return positions;
  }

  // Build emergence: glyph → viewport-scaled ember burst
  buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000 } = {}) {
    console.log(`🌟 BigBang emergence: "${text}" with ${count} particles`);
    const { width: vw, height: vh } = this._viewportHint || { width:120, height:90 };

    const atmosphericPositions = new Float32Array(count * 3); // SOURCE = gas cloud
    const text3DPositions      = new Float32Array(count * 3); // TARGET = swirl

    const sizeMultipliers      = new Float32Array(count);
    const opacityData          = new Float32Array(count);
    const atlasIndices         = new Float32Array(count);
    const tierData             = new Float32Array(count);
    const animationSeeds       = new Float32Array(count * 3);

    const gasRadius = Math.min(vw, vh) * 0.35;
    for (let i=0;i<count;i++){
      const j=i*3;
      const ang = Math.random() * Math.PI * 2;
      const r   = Math.random() * gasRadius;
      atmosphericPositions[j+0] = Math.cos(ang) * r;
      atmosphericPositions[j+1] = Math.sin(ang) * r;
      atmosphericPositions[j+2] = (Math.random()-0.5) * 20.0;
    }

    const swirlRadius = Math.min(vw, vh) * 0.40;
    for (let i=0;i<count;i++){
      const j=i*3, t = i / count;
      const ang = t * Math.PI * 8.0; // multi-rotations
      const r   = t * swirlRadius;
      text3DPositions[j+0] = Math.cos(ang) * r;
      text3DPositions[j+1] = Math.sin(ang) * r;
      text3DPositions[j+2] = Math.sin(ang * 2.0) * 10.0;
    }

    for (let i=0;i<count;i++){
      const j=i*3;
      const t=(tierData[i]=Math.floor(Math.random()*4))|0;
      sizeMultipliers[i]=0.5+Math.random()*1.5;
      opacityData[i]=0.3+Math.random()*0.7;
      atlasIndices[i]=Math.floor(Math.random()*8);
      animationSeeds[j+0]=Math.random(); animationSeeds[j+1]=Math.random(); animationSeeds[j+2]=Math.random();
    }

    return {
      id:'emergence-genesis',
      mode:'emergence',
      stageName:'genesis',
      count, particleCount:count, maxParticles:count, activeCount:count,
      atmosphericPositions, text3DPositions, animationSeeds,
      sizeMultipliers, opacityData, atlasIndices, tierData,
      metadata:{ sourceText:text, viewport:this._viewportHint }
    };
  }// Build standard stages with post-emergence handling
  buildAndEmitBlueprint(stage, quality) {
    if (this._openingPhase && stage !== 'genesis') {
      console.warn('🧠 Engine: blocked non-genesis during opening:', stage);
      return;
    }
const cacheKey = `${stage}|${quality}`;
    let blueprint = this.blueprintCache.get(cacheKey);

    // T2: After emergence, rebuild genesis as cloud → constellation
    if (stage === 'genesis' && this._hasBuiltEmergence && this._lastEmergenceCloud) {
      console.log('🧠 Engine: Rebuilding genesis from emergence cloud → constellation');

      const baseCount     = 2000;
      const particleCount = this.getParticleCountForQuality(baseCount, quality);
      const tierRatios    = [0.50, 0.20, 0.15, 0.15];
      const view          = this._viewportHint || { width: 120, height: 90 };

      blueprint = this.buildBlueprint(stage, { quality });

      // SOURCE = emergence cloud (from T1)
      const n = Math.min(particleCount * 3, this._lastEmergenceCloud.length);
      for (let i = 0; i < n; i++) {
        blueprint.atmosphericPositions[i] = this._lastEmergenceCloud[i];
      }

      // TARGET = viewport-scaled constellation
      blueprint.text3DPositions = this.generateConstellationFormation(particleCount, tierRatios, view);

      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
        stage,
        quality,
        cached: false
      });

      // Clear flag after use
      this._hasBuiltEmergence = false;
      return;
    }

    // Normal path: cached or fresh build
    if (blueprint) {
      console.log(`🧠 Using cached blueprint for ${stage}|${quality}`);
      BeatBus.emit(EVENTS.BLUEPRINT_READY, { 
        blueprint, 
        stage, 
        quality, 
        cached: true 
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
        cached: false 
      });
    }
  }

  // Generate viewport-scaled 4-tier constellation
  generateConstellationFormation(count, tierRatios = [0.50, 0.20, 0.15, 0.15], viewport = { width: 120, height: 90 }) {
    const positions = new Float32Array(count * 3);
    const rnd = createSeededRandom('constellation');

    const tierCounts = [
      Math.floor(count * tierRatios[0]),
      Math.floor(count * tierRatios[1]),
      Math.floor(count * tierRatios[2]),
      Math.floor(count * tierRatios[3]),
    ];
    tierCounts[3] += count - (tierCounts[0] + tierCounts[1] + tierCounts[2]);

    let k = 0;
    const pushRect = (n, w, h, jitter = 1.0, z = 12.0) => {
      for (let i = 0; i < n; i++) {
        const x = (rnd()*2 - 1) * (w/2) + (rnd()-0.5)*jitter;
        const y = (rnd()*2 - 1) * (h/2) + (rnd()-0.5)*jitter;
        positions[k*3+0] = x;
        positions[k*3+1] = y;
        positions[k*3+2] = (rnd()-0.5) * z;
        k++;
      }
    };

    // 4 tiers, each smaller than the last
    pushRect(tierCounts[0], viewport.width * 0.95, viewport.height * 0.95, 2.0, 30);
    pushRect(tierCounts[1], viewport.width * 0.80, viewport.height * 0.80, 1.5, 10);
    pushRect(tierCounts[2], viewport.width * 0.60, viewport.height * 0.60, 1.0,  6);
    pushRect(tierCounts[3], viewport.width * 0.45, viewport.height * 0.45, 0.8,  8);

    return positions;
  }

  // Build generic stage blueprint
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

    const maxParticles         = 15000;
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const text3DPositions      = new Float32Array(maxParticles * 3);
    const animationSeeds       = new Float32Array(maxParticles * 3);
    const sizeMultipliers      = new Float32Array(maxParticles);
    const opacityData          = new Float32Array(maxParticles);
    const atlasIndices         = new Float32Array(maxParticles);
    const tierData             = new Float32Array(maxParticles);

    const textFormation = this.generate3DTextFormation(
      STAGE_TEXTS[stageName] || stageName.toUpperCase(), 
      particleCount
    );

    const rnd = createSeededRandom(stageName);
    for (let i = 0; i < particleCount; i++) {
      const j = i * 3;

      // Default atmospheric positions
      atmosphericPositions[j+0] = (rnd() - 0.5) * 120;
      atmosphericPositions[j+1] = (rnd() - 0.5) * 90;
      atmosphericPositions[j+2] = (rnd() - 0.5) * 40;

      // Text formation positions
      if (textFormation && j+2 < textFormation.length) {
        text3DPositions[j+0] = textFormation[j+0] * 4;
        text3DPositions[j+1] = textFormation[j+1] * 4;
        text3DPositions[j+2] = textFormation[j+2] * 4;
      }

      animationSeeds[j+0] = rnd();
      animationSeeds[j+1] = rnd();
      animationSeeds[j+2] = rnd();
      
      sizeMultipliers[i]  = 0.5 + rnd() * 1.5;
      opacityData[i]      = 0.3 + rnd() * 0.7;
      atlasIndices[i]     = Math.floor(rnd() * 8);
      tierData[i]         = Math.floor(rnd() * 4);
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
      metadata: { quality, buildTime: 0 }
    };
  }

  // Utility functions
  textToParticlePositions(text, count) {
    const positions = new Float32Array(count * 3);
    const charWidth = 8.0, textHeight = 12.0;
    for (let i = 0; i < count; i++) {
      const ci = Math.floor(Math.random() * text.length);
      const baseX = (ci - text.length/2) * charWidth;
      positions[i*3+0] = baseX + (Math.random()-0.5) * charWidth * 0.8;
      positions[i*3+1] = (Math.random()-0.5) * textHeight;
      positions[i*3+2] = (Math.random()-0.5) * 0.5;
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
      bevelEnabled: false
    });
    geometry.computeBoundingBox();
    geometry.center();

    const pos = [];
    const attr = geometry.attributes.position;
    for (let i = 0; i < attr.count && pos.length < count*3; i++) {
      pos.push(attr.getX(i), attr.getY(i), attr.getZ(i) * 0.1);
    }

    const result = new Float32Array(count * 3);
    for (let i = 0; i < count*3; i++) {
      result[i] = pos[i] ?? ((Math.random()-0.5) * 10);
    }

    geometry.dispose();
    this.text3DCache.set(cacheKey, result);
    return result;
  }

  clearCache() {
    this.blueprintCache.clear();
    this._lastEmergenceCloud = null;
    this._hasBuiltEmergence  = false;
    console.log('🧠 Cache cleared');
  }

  getCacheStats() {
    return {
      size: this.blueprintCache.size,
      keys: Array.from(this.blueprintCache.keys()),
      hasEmergenceCloud: !!this._lastEmergenceCloud,
      hasBuiltEmergence: this._hasBuiltEmergence,
      viewportHint: this._viewportHint,
      openingPhase: this._openingPhase
    };
  }
}

// Create and export singleton
const engine = new ConsciousnessEngine();
if (typeof window !== 'undefined') {
  window.consciousnessEngine = engine;
}
export default engine;