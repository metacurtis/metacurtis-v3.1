// src/engine/ConsciousnessEngine.js
// Canon-compliant production version with HMR safety, validation, and efficiency

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { VC } from '@/config/visual-controls.js';
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
    this._emergenceRaf = null;

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
      
      console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
      this._log('emergence_built', { count: blueprint.particleCount });

      // Drive implosion → settle via directives; renderer remains passive
      this._startEmergenceTimeline(blueprint);

      // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost

    } catch (e) {
      console.error('[Engine] BUILD_EMERGENCE_BLUEPRINT error:', e);
      this._log('emergence_error', { error: e.message });
    }
  }

  _startEmergenceTimeline(bp) {
    const count = bp?.activeCount || bp?.particleCount || 0;
    if (!count || typeof window === 'undefined' || !performance?.now) return;

    if (this._emergenceRaf) cancelAnimationFrame(this._emergenceRaf);

    const base = Canonical?.features?.pointSizeDefault ?? 48;
    const smooth = (t) => t * t * (3 - 2 * t);
    const implMs = VC.IMPLODE_MS;
    const settleMs = VC.SETTLE_MS;
    const mid = VC.MID_MORPH;

    const start = performance.now();
    const total = implMs + settleMs;

    const step = () => {
      const el = performance.now() - start;
      const tI = Math.min(1, el / implMs);
      const tS = el <= implMs ? 0 : Math.min(1, (el - implMs) / settleMs);

      const m = el <= implMs ? mid * smooth(tI) : mid + (1 - mid) * smooth(tS);
      const eI = smooth(tI);
      const eS = smooth(tS);

      const draw = Math.max(1, Math.round(count * (el <= implMs ? eI : 1)));
      const ps = base * (el <= implMs
        ? 1 + (VC.POINT_SIZE_KICK - 1) * eI
        : VC.POINT_SIZE_KICK - (VC.POINT_SIZE_KICK - 1) * eS);

      const sig = el <= implMs
        ? VC.SIGMA_BASE + (VC.SIGMA_PEAK - VC.SIGMA_BASE) * eI
        : VC.SIGMA_PEAK - (VC.SIGMA_PEAK - VC.SIGMA_BASE) * eS;

      const t4 = el <= implMs
        ? VC.T4_HI_PEAK
        : VC.T4_HI_PEAK - (VC.T4_HI_PEAK - VC.T4_HI_SETTLE) * eS;

      BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
        morphProgress: +m.toFixed(3),
        drawCount: draw,
        activeCount: draw,
        pointSize: ps,
        gaussianSigma: sig,
        tierHighlight: [1, 1, 1, t4],
      });

      if (el < total) {
        this._emergenceRaf = requestAnimationFrame(step);
      } else {
        BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
          morphProgress: 1,
          drawCount: count,
          activeCount: count,
          pointSize: base,
          gaussianSigma: VC.SIGMA_BASE,
          tierHighlight: [1, 1, 1, VC.T4_HI_SETTLE],
          uniforms: { uChaosSpin: 0, uTrailIntensity: 0, uTrailPersistence: 0 },
        });
        this._emergenceRaf = null;
      }
    };

    this._emergenceRaf = requestAnimationFrame(step);
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

    // derive viewport target radius (same basis as starfield) and widen atmospheric layer
    const vw = width * 0.5;
    const vh = height * 0.5;
    const R = (VC?.STARFIELD_SCALE ?? 0.72) * Math.min(vw, vh);
    const AT = VC?.ATMO_SCALE ?? 1.15;
    const rx = Math.min(R * AT, VC.VIEW_CAP_HALF_W);
    const ry = Math.min(R * AT, VC.VIEW_CAP_HALF_H);
    const zMin = -VC.Z_BACK_MAX;
    const zMax = -VC.Z_BACK_MIN;

    // gaussian helper (clamped) for a natural elliptical cloud
    const rnd = Math.random;
    const gauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(-1.2, Math.min(1.2, g));
    };

    for (let i = 0; i < N; i++) {
      const j = i * 3;
      out[j] = gauss() * rx;
      out[j + 1] = gauss() * ry;
      out[j + 2] = zMin + rnd() * (zMax - zMin);
    }

    return out;
  }

  generateConstellationFormation(N, tierRatios = [0.5, 0.2, 0.15, 0.15], hint) {
    // Starfield (not rings): viewport-scaled, 4 tiers with different spreads/cluster behavior.
    const out = new Float32Array(N * 3);
    const rnd = createSeededRandom('starfield');
    // tier counts
    const tc0 = Math.floor(N * tierRatios[0]);
    const tc1 = Math.floor(N * tierRatios[1]);
    const tc2 = Math.floor(N * tierRatios[2]);
    const tc3 = N - (tc0 + tc1 + tc2);
    // viewport-based radius
    const vw = (hint?.width ?? this._viewportHint.width) * 0.5;
    const vh = (hint?.height ?? this._viewportHint.height) * 0.5;
    const R = (VC?.STARFIELD_SCALE ?? 0.72) * Math.min(vw, vh);
    // helpers
    // Box-Muller with clamp to bound starfield extent (|g| ≤ 1.2)
    const gauss = () => {
      let u = 0, v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(-1.2, Math.min(1.2, g));
    };
    const sampleEllipse = (rx, ry) => {
      // Gaussian-weighted inside ellipse
      const gx = gauss() * rx;
      const gy = gauss() * ry;
      return [gx, gy];
    };
    let k = 0;
    // Tier 0 — diffuse substrate (wider in X, flattened Y)
    for (let i = 0; i < tc0; i++, k++) {
      const j = 3 * k;
      const [x, y] = sampleEllipse(R, R * (VC.T0_SIGMA_Y_FLATTEN ?? 0.70));
      out[j] = x;
      out[j + 1] = y;
      out[j + 2] = (rnd() - 0.5) * (VC.T0_Z_JITTER ?? 4);
    }
    // Tier 1 — denser substrate (slightly tighter spread)
    for (let i = 0; i < tc1; i++, k++) {
      const j = 3 * k;
      const [x, y] = sampleEllipse(R * 0.75, R * 0.75);
      out[j] = x;
      out[j + 1] = y;
      out[j + 2] = (rnd() - 0.5) * (VC.T1_Z_JITTER ?? 3);
    }
    // Tier 2 — few gaussian clusters
    const cCount = VC.T2_CLUSTER_COUNT ?? 3;
    const cSigma = (VC.T2_CLUSTER_SIGMA ?? 0.14) * R; // slightly tighter clusters
    const clusters = Array.from({ length: cCount }, () => {
      const [cx, cy] = sampleEllipse(R * 0.66, R * 0.66);
      return { cx, cy };
    });
    for (let i = 0; i < tc2; i++, k++) {
      const j = 3 * k;
      const c = clusters[Math.floor(rnd() * clusters.length)];
      const x = c.cx + gauss() * cSigma;
      const y = c.cy + gauss() * cSigma;
      out[j] = x;
      out[j + 1] = y;
      out[j + 2] = (rnd() - 0.5) * (VC.T2_Z_JITTER ?? 2);
    }
    // Tier 3 — constellation anchors: try text formation if font present, else compact cluster
    if (tc3 > 0 && (VC.USE_T3_TEXT ?? true) && this.font) {
      const pts = this.generate3DTextFormation(VC.T3_TEXT || 'HELLO CURTIS', tc3);
      // center & scale into frame
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < pts.length; i += 3) {
        const x = pts[i];
        const y = pts[i + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const sx = (VC.T3_TEXT_SCALE ?? 0.70) * R / Math.max(1, (maxX - minX) * 0.5);
      const sy = (VC.T3_TEXT_SCALE ?? 0.70) * R / Math.max(1, (maxY - minY) * 0.5);
      for (let i = 0; i < tc3; i++, k++) {
        const j = 3 * k;
        const s = i * 3;
        out[j] = pts[s] * sx;
        out[j + 1] = pts[s + 1] * sy;
        out[j + 2] = (rnd() - 0.5) * (VC.T3_Z_JITTER ?? 1.5);
      }
    } else {
      for (let i = 0; i < tc3; i++, k++) {
        const j = 3 * k;
        const [x, y] = sampleEllipse(R * 0.28, R * 0.28);
        out[j] = x;
        out[j + 1] = y;
        out[j + 2] = (rnd() - 0.5) * (VC.T3_Z_JITTER ?? 1.5);
      }
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
