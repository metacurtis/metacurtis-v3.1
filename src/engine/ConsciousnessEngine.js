// src/engine/ConsciousnessEngine.js
// Canon-compliant production version with HMR safety, validation, and efficiency

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { Mesh, Vector3 } from 'three';
import { VC } from '@/config/visual-controls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import SST from '@/config/sst-loader.js'; // keep consistent with ESM imports
import { createSeededRandom } from '../utils/random.js';
import BlueprintGenerator from './modules/BlueprintGenerator.js';
import ClimaxController from './modules/ClimaxController.js';
import MorphController from './modules/MorphController.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { trace } from '@/dev/trace.js';
import {
  calculateBounds,
  createBlueprintStructure,
  assignTiersShuffled,
  emitBlueprintReady,
  computeStarfieldMetrics,
  synthesizeBandPositions,
  generateViewportSpread as utilsGenerateViewportSpread,
  generateRandomAtmosphericScatter as utilsGenerateRandomAtmosphericScatter,
} from './utils/blueprintUtils.js';

function aabbOf(arr) {
  const bounds = calculateBounds(arr);
  if (!bounds) return null;
  return { w: bounds.size.x, h: bounds.size.y };
}

const clamp = (value, min, max) => {
  const bounded = value < min ? min : value > max ? max : value;
  return Number.isFinite(bounded) ? bounded : min;
};

const FONT_RESOLVERS = {
  'Courier Prime': () => '/fonts/CourierPrime_Regular.typeface.json',
  'JetBrains Mono': () => '/fonts/CourierPrime_Regular.typeface.json',
  Inter: () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
  'Archivo Black': () => '/fonts/helvetiker_bold.typeface.json',
  Montserrat: () => '/fonts/helvetiker_bold.typeface.json',
  'Playfair Display': () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
  'Cormorant Garamond': () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
  default: () => '/fonts/CourierPrime_Regular.typeface.json',
};

export const __computeStarfieldMetrics = computeStarfieldMetrics;
export const __synthesizeBandPositions = synthesizeBandPositions;
// =============================================================================

class ConsciousnessEngine {
  #blueprintGenerator = null;
  #climaxController = null;
  #morphController = null;

  constructor() {
    // Text / font
    this.font = null;
   this._fontReady = false;
   this._fontReadyPromise = null;
   this._text3DCache = new Map();
   this._lastText3DFallbackUsed = false;
   this._lastBlueprint = null;
   this.text2DFallback = true;
   this._fontCache = new Map();
   this._activeFontKey = null;
   this._fontLoadingKey = null;

   // State / caches
   this.blueprintCache = new Map();
   this._guardInvalidations = [];
   this.#blueprintGenerator = new BlueprintGenerator(this);
   this.#climaxController = new ClimaxController(this);
   this.#morphController = new MorphController(this);

    // Expose engine debug helpers when running in the browser
    if (typeof window !== 'undefined') {
      window.__consciousnessEngine = this;
      window.engineDebug = {
        getStats: () => this.getStats(),
        clearCache: () => this.clearCache(),
        getCurrentStage: () => this.currentStage,
        getCurrentQuality: () => this.currentQuality,
        getCacheSize: () => this.blueprintCache.size,
        getCacheKeys: () => Array.from(this.blueprintCache.keys()),
        getGuardInvalidations: () => this._guardInvalidations?.slice() || [],
        getBlueprintCache: () => {
          const entries = {};
          this.blueprintCache.forEach((bp, key) => {
            entries[key] = {
              stage: bp?.stageName || bp?.stage || null,
              particleCount: bp?.particleCount || bp?.activeCount || bp?.maxParticles || null,
              mode: bp?.mode || bp?.metadata?.mode || null,
            };
          });
          return entries;
        },
      };

      console.log('🔧 Engine debug API exposed at window.engineDebug');
    }
    this.currentStage = 'genesis';
    this.currentQuality = 'HIGH';
    this._emergenceActive = false;
    this._emergenceDone = false;
    this._rendererFencepostSeen = false;
    this._openingPreboundBlueprint = null;

    // Opening gates
    this._openingPhase = true;
    this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };

    // Emergence memory - store only targets, not full blueprint
    this._lastEmergenceTargets = null;
    this._emergenceRaf = null;
    this._pendingEmergenceBlueprint = null;

    // HMR safety
    this._listeners = [];
    this._initialized = false;
    
    // Initialize once
    this.init();
  }

  _preloadNextStage(currentStageName, quality) {
    const stageNames = Object.keys(Canonical?.stages || {});
    if (!stageNames.length) return;

    const currentIndex = stageNames.indexOf(currentStageName);
    if (currentIndex === -1 || currentIndex >= stageNames.length - 1) {
      return;
    }

    const resolvedQuality = quality || this.currentQuality;
    const nextStageName = stageNames[currentIndex + 1];
    const nextCacheKey = this._cacheKey(nextStageName, resolvedQuality);

    if (this.blueprintCache.has(nextCacheKey)) {
      console.log('🔮 Preload: Next stage already cached', nextStageName);
      return;
    }

    setTimeout(() => {
      console.log('🔮 Preloading next stage:', nextStageName);

      try {
        if (this.blueprintCache.has(nextCacheKey)) {
          console.log('🔮 Preload: Skipped, cache filled before execution', nextStageName);
          return;
        }

        const nextBlueprint = this._buildBlueprintForStage(nextStageName, resolvedQuality);
        if (!nextBlueprint) {
          console.warn('⚠️ Preload skipped: builder returned null', nextStageName);
          return;
        }

        this.blueprintCache.set(nextCacheKey, nextBlueprint);

        const particleCount = nextBlueprint?.atmosphericPositions?.length
          ? nextBlueprint.atmosphericPositions.length / 3
          : 0;

        console.log('✅ Preload complete:', {
          stage: nextStageName,
          quality: resolvedQuality,
          particles: particleCount,
          cacheSize: this.blueprintCache.size,
        });
      } catch (err) {
        console.warn('⚠️ Preload failed (non-critical):', err);
      }
    }, 150);
  }

  init() {
    // Idempotent initialization
    if (this._initialized) return;
    this._initialized = true;
    
    const queueFontLoad = () => {
      this.loadFont().catch(() => {});
    };
    if (typeof window !== 'undefined') {
      const schedule =
        window.requestIdleCallback ||
        ((cb) => window.setTimeout(cb, 600));
      schedule(() => queueFontLoad());
    } else {
      queueFontLoad();
    }
    this._installListeners();
    console.log('🧠 ConsciousnessEngine: Initialized (Canon-compliant, HMR-safe)');
  }

  // HMR-safe listener installation
  _installListeners() {
    // Clean up any existing listeners first
    this._cleanupListeners();

    const subscribe = (eventKey, handler, { optional = false } = {}) => {
      if (typeof BeatBus?.on !== 'function') {
        if (!optional) {
          console.warn('[ConsciousnessEngine] BeatBus.on unavailable for event', eventKey);
        }
        return;
      }
      const off = BeatBus.on(this._ev(eventKey), handler);
      if (typeof off === 'function') {
        this._listeners.push(off);
      } else if (!optional) {
        console.warn('[ConsciousnessEngine] BeatBus.on returned non-function for', eventKey);
      }
    };
    
    // Install listeners with stable method references
    subscribe('ENGINE_VIEWPORT_HINT', this._onViewportHint.bind(this));
    subscribe('ENABLE_SCROLL', this._onEnableScroll.bind(this));
    subscribe('STAGE_CHANGE', this._onStageChange.bind(this));
    subscribe('QUALITY_CHANGE', this._onQualityChange.bind(this));
    subscribe('PREWARM_GENESIS_BLUEPRINT', this._onPrewarmGenesis.bind(this));
    subscribe('BUILD_EMERGENCE_BLUEPRINT', this._onBuildEmergence.bind(this));
    subscribe('START_CLIMAX', this._handleStartClimax.bind(this));
    subscribe('PARTICLES_EMERGED', () => {
      this._rendererFencepostSeen = true;
      this._emergenceActive = false;
      this._emergenceDone = true;
      if (this._emergenceRaf) {
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._emergenceRaf);
        else clearTimeout(this._emergenceRaf);
        this._emergenceRaf = null;
      }
      this.#morphController?.stopEmergenceTimeline({ markDone: true });
    });
    subscribe('BLUEPRINT_INVALIDATED', this._onBlueprintInvalidated.bind(this), { optional: true });
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

  _cacheKey(stage, quality) {
    const stageKey = stage || this.currentStage || 'genesis';
    const qualityKey = quality || this.currentQuality || 'HIGH';
    return `${stageKey}|${qualityKey}`;
  }

  // --- Event Handlers (stable method references) ---

  _onViewportHint(hint = {}) {
    let width = Number(hint.width);
    let height = Number(hint.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    let aspect = Number(hint.aspect);
    if (!Number.isFinite(aspect) || aspect <= 0) {
      aspect = width / height;
    }

    if (width < height) {
      [width, height] = [height, width];
    }

    aspect = width / height;
    const orientation = 'landscape';

    this._viewportHint = { width, height, aspect, orientation };
    this._log('viewport_hint', {
      width: width.toFixed(1),
      height: height.toFixed(1),
      aspect: aspect.toFixed(2),
      orientation,
    });
  }

  _onEnableScroll() {
    console.log('🧠 Engine: Opening phase complete');
    this._openingPhase = false;
    this._log('scroll_enabled');
  }

  _onStageChange(payload = {}) {
    const stage = payload.stage ?? payload.to;
    if (!stage) return;
    const skipBlueprint = payload.skipBlueprint === true;
    const preserveEmergence = payload.preserveEmergence !== false;

    // CRITICAL: Block non-genesis stages during opening
    if (this._openingPhase && stage !== 'genesis') {
      console.log(`🧠 Engine: Blocking ${stage} during opening phase`);
      this._log('stage_blocked', { stage, reason: 'opening_phase' });
      return;
    }

    console.log(`🧠 Engine: Stage -> ${stage}`);
    this.currentStage = stage;
    if (skipBlueprint) {
      this._log('stage_change', { stage, skippedBlueprint: true });
      if (preserveEmergence && stage === 'genesis') {
        this._log('stage_preserve_emergence', { preserved: !!this._lastEmergenceTargets });
      }
      return;
    }
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
    // Clear stale emergence targets so prewarm rebuilds with current VC tuning
    this._lastEmergenceTargets = null;
    console.log('🧠 Engine: Prewarming genesis blueprint');
    const key = this._cacheKey('genesis', 'HIGH');
    if (!this.blueprintCache.has(key)) {
      const bp = this.buildBlueprint('genesis', { quality: 'HIGH' });
      if (bp && this._validateBlueprint(bp)) {
        this.blueprintCache.set(key, bp);
      }
    }
    BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
    this._log('prewarm_complete', { key });
  }

  _onBlueprintInvalidated(payload = {}) {
    const stage = payload.stage || null;
    const quality = payload.quality || null;
    const cacheKey = payload.cacheKey || (stage ? this._cacheKey(stage, quality) : null);
    const issues = Array.isArray(payload.issues) ? payload.issues.slice(0, 6) : null;
    const fallback = payload.fallback === true || payload.guardFallback === true;
    const origin = payload.guardVersion || 'guard-v2';

    if (cacheKey && this.blueprintCache.has(cacheKey)) {
      this.blueprintCache.delete(cacheKey);
      console.warn('🧠 Engine: Guard invalidated blueprint cache entry', { cacheKey, stage, quality, issues });
      this._log('blueprint_guard_invalidate', { cacheKey, stage, quality, issues });
    } else {
      this._log('blueprint_guard_miss', { cacheKey, stage, quality, issues });
    }

    this._guardInvalidations.push({
      at: typeof performance !== 'undefined' && performance?.now ? performance.now() : Date.now(),
      stage,
      quality: quality || null,
      cacheKey,
      issues,
      fallback,
      origin,
    });
    if (this._guardInvalidations.length > 50) {
      this._guardInvalidations.shift();
    }

    if (stage === 'genesis' && fallback) {
      this._lastEmergenceTargets = null;
      this._emergenceDone = false;
      this._rendererFencepostSeen = false;
    }
  }

  async _onBuildEmergence(payload = {}) {
    try {
      console.log('🧠 Engine: BUILD_EMERGENCE_BLUEPRINT received', payload);
      const openingChaosMode = payload?.mode === 'opening_chaos';
      
      this._emergenceDone = false;
      this._emergenceActive = false;
      this._rendererFencepostSeen = false;

      // Build the emergence blueprint
      const blueprint = await this.buildEmergenceBlueprint(payload);
      
      // Validate before proceeding
      if (!this._validateBlueprint(blueprint)) {
        console.error('🧠 Engine: Invalid emergence blueprint, not emitting');
        this._log('emergence_validation_failed');
        this._emergenceActive = false;
        this._emergenceDone = false;
        return;
      }

      // Store ONLY the target positions (not the full blueprint)
      this._lastEmergenceTargets = blueprint.text3DPositions;

      // Emit emergence blueprint with mode flag (canonical event)
      const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
      const emissionMode = 'emergence';
      emitBlueprintReady(BeatBus, EVENTS, blueprint, {
        stage: 'genesis',
        quality: this.currentQuality,
        mode: emissionMode,
        variantMode,
        cached: false,
        skipMorphAnimation: !!payload.skipMorphAnimation,
        targetState: payload.targetState,
        fastForward: !!payload.fastForward,
        cacheKey: this._cacheKey('genesis', this.currentQuality),
      });
      
      if (openingChaosMode) {
        console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount, mode: variantMode });
        this._openingPreboundBlueprint = blueprint;
        this._log('emergence_built', { count: blueprint.particleCount, mode: variantMode });
      } else {
        console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: emissionMode });
        this._openingPreboundBlueprint = null;
        this._log('emergence_built', { count: blueprint.particleCount, mode: emissionMode });
      }

      // Drive implosion → settle via directives; renderer remains passive
      const shouldRunTimeline = !openingChaosMode && !payload.skipMorphAnimation;
      if (shouldRunTimeline && !this._startEmergenceTimeline(blueprint)) {
        this._emergenceActive = false;
        this._emergenceDone = false;
      }

      // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost

    } catch (e) {
      console.error('[Engine] BUILD_EMERGENCE_BLUEPRINT error:', e);
      this._log('emergence_error', { error: e.message });
      this._emergenceActive = false;
      this._emergenceDone = false;
    }
  }

  _startEmergenceTimeline(bp) {
    console.log('🌀 [Engine] Starting emergence timeline, delegating to MorphController');
    if (!this.#morphController) {
      console.error('[ConsciousnessEngine] MorphController not initialized');
      return false;
    }
    return this.#morphController.startEmergenceTimeline(bp);
  }

  /**
   * Kick off the climax sequence orchestration.
   * Engine owns this flow so renderer + diagnostics stay in sync.
   */
  _handleStartClimax() {
    console.log('🎬 [Engine] START_CLIMAX event received, delegating to ClimaxController');
    if (!this.#climaxController) {
      console.error('[ConsciousnessEngine] ClimaxController not initialized');
      return;
    }
    this.#climaxController.startClimaxSequence();
  }

  // --- Blueprint Generation ---

  _createEmptyBlueprint(count, { mode, quality } = {}) {
    const blueprint = createBlueprintStructure(count, {
      stageName: 'genesis',
      mode,
      quality,
    });

    if (blueprint.particleCount > 0) {
      const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
      for (let i = 0; i < blueprint.particleCount; i++) {
        const j = i * 3;
        blueprint.animationSeeds[j + 0] = rnd();
        blueprint.animationSeeds[j + 1] = rnd();
        blueprint.animationSeeds[j + 2] = rnd();
        blueprint.sizeMultipliers[i] = 0.5 + rnd() * 1.5;
        blueprint.opacityData[i] = 0.3 + rnd() * 0.7;
        blueprint.atlasIndices[i] = Math.floor(rnd() * 8);
      }
    }

    return blueprint;
  }

  /**
   * Normalize tier ratios (array of numbers) to fractions that sum to 1.0.
   * Fallback to SST v3.5 spec default [0.5, 0.2, 0.15, 0.15].
   */
  _normalizeTierRatios(ratiosIn) {
    const fallback = [0.5, 0.2, 0.15, 0.15];
    const arr = Array.isArray(ratiosIn) && ratiosIn.length === 4 ? ratiosIn.slice(0, 4) : fallback.slice();
    let sum = arr.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
    if (!isFinite(sum) || sum <= 0) return fallback;
    return arr.map(v => (isFinite(v) ? v / sum : 0));
  }

  /**
   * Pull tier ratios from SST v3.5 if available.
   * Preferred order:
   *   1) SST?.stages?.genesis?.tiers?.ratios
   *   2) SST?.visual?.tiers?.ratios
   *   3) fallback [0.5, 0.2, 0.15, 0.15]
   */
  _getGenesisTierRatiosFromSST() {
    const a = SST?.stages?.genesis?.tiers?.ratios;
    const b = SST?.visual?.tiers?.ratios;
    return this._normalizeTierRatios(a || b || [0.5, 0.2, 0.15, 0.15]);
  }

  /**
   * Generate randomized atmospheric scatter (cube within view-scaled bounds).
   * Count * 3 float32 output.
   */
  _generateRandomAtmosphericScatter(count, viewportHint, opts = {}) {
    return utilsGenerateRandomAtmosphericScatter(count, viewportHint, opts, VC);
  }

  /**
   * Given ratios and particle count, compute per-tier counts and a shuffled tier map.
   * Returns { counts:[c0,c1,c2,c3], tiers:Uint8Array(count) }
  */
  _assignTiersShuffled(count, ratios) {
    return assignTiersShuffled(count, ratios, Math.random);
  }

  /**
   * Ensure two position arrays (Float32Array) have the same length (count*3).
   * Currently trims the longer array to the shorter length.
   */
  _harmonizeAttributeLengths(a, b) {
    const n = Math.min(a.length, b.length);
    if (a.length !== b.length) {
      const a2 = a.length === n ? a : a.slice(0, n);
      const b2 = b.length === n ? b : b.slice(0, n);
      return { a: a2, b: b2 };
    }
    return { a, b };
  }

  _emitBlueprint(blueprint) {
    this._pendingEmergenceBlueprint = blueprint;
    this._lastBlueprint = blueprint;
    return blueprint;
  }

  _logEmergenceSummary(data) {
    this._log('emergence_blueprint_summary', data);
  }

  /**
   * Build + emit the Emergence blueprint for the opening sequence.
   */
  async buildEmergenceBlueprint(options = {}) {
    const {
      mode: requestedMode = 'emergence',
      source = 'viewportSpread',
      target = 'constellation',
      count = SST?.performance?.particleCount?.genesis ?? 2000,
      tierRatios = undefined,
      viewportHint = this._viewportHint,
      quality = 'HIGH',
      fastForward = false,
      skipMorphAnimation = false,
      targetState = undefined,
    } = options || {};

    const sanitizedRatios = this._normalizeTierRatios(
      tierRatios || this._getGenesisTierRatiosFromSST()
    );

    const blueprint = this._createEmptyBlueprint(count, { mode: requestedMode, quality });
    if (!blueprint) return null;

    const blueprintCount = blueprint.particleCount;
    const atmospheric = this._generateRandomAtmosphericScatter(blueprintCount, viewportHint, { band: false });

    // Target: prefer SST kinetic typography (“HELLO CURTIS”) with safe fallback
    const lg = SST?.visual?.letterGeometry?.genesis || {};
    const canonicalWord = Canonical?.visual?.letterGeometry?.genesis?.word;
    const stageWordFallback = typeof canonicalWord === 'string' && canonicalWord.trim()
      ? canonicalWord.trim()
      : 'GENESIS';
    const wordRaw = typeof lg.word === 'string' && lg.word.trim()
      ? lg.word.trim()
      : stageWordFallback;
    const depth = Number.isFinite(lg.depth) && lg.depth > 0 ? lg.depth : 0.3;
    const use3D = SST?.visual?.system === '3d_kinetic_typography';

    await this._ensureFontReady(1500);

    let targetPositions;
    let usedFallback = false;
    try {
      if (use3D && typeof this.generate3DTextFormation === 'function') {
        targetPositions = this.generate3DTextFormation(wordRaw, {
          depth,
          particles: blueprintCount,
          viewportHint,
        });
        usedFallback = this._lastText3DFallbackUsed;
        if (usedFallback) {
          console.warn('⚠️ Emergence used text3D FALLBACK (band). FontReady:', this._fontReady);
        }
      } else {
        targetPositions = this.generateConstellationFormation(blueprintCount, sanitizedRatios, viewportHint, { band: false, clampToViewCaps: false });
        this._lastText3DFallbackUsed = false;
      }
    } catch (err) {
      console.warn('⚠️ 3D text formation failed, falling back to constellation:', err);
      targetPositions = this.generateConstellationFormation(blueprintCount, sanitizedRatios, viewportHint, { band: false, clampToViewCaps: false });
      usedFallback = false;
      this._lastText3DFallbackUsed = false;
    }
    if (!(targetPositions instanceof Float32Array)) {
      targetPositions = this.generateConstellationFormation(blueprintCount, sanitizedRatios, viewportHint, { band: false, clampToViewCaps: false });
      usedFallback = false;
      this._lastText3DFallbackUsed = false;
    }

    const { a: atmH, b: tgtH } = this._harmonizeAttributeLengths(atmospheric, targetPositions);
    blueprint.atmosphericPositions.set(atmH);
    blueprint.text3DPositions.set(tgtH);
    if (blueprint.positions?.length === atmH.length) {
      blueprint.positions.set(atmH);
    }

    const vw = (viewportHint?.width ?? this._viewportHint.width ?? 120) * 0.5;
    const vh = (viewportHint?.height ?? this._viewportHint.height ?? 90) * 0.5;

    if (import.meta?.env?.DEV) {
      const aabbExtents = (arr) => {
        const bounds = calculateBounds(arr);
        if (!bounds) return { w: 0, h: 0 };
        return {
          w: +bounds.size.x.toFixed(2),
          h: +bounds.size.y.toFixed(2),
        };
      };
      console.debug('[CE] AABB post-fit',
        { text: aabbExtents(blueprint.text3DPositions) },
        { atm: aabbExtents(blueprint.atmosphericPositions) },
        { vw: +vw.toFixed(2), vh: +vh.toFixed(2) }
      );
    }

    const { counts, tiers } = this._assignTiersShuffled(blueprintCount, sanitizedRatios);
    blueprint.tierOf.set(tiers);
    if (blueprint.tierData?.length === tiers.length) {
      for (let i = 0; i < tiers.length; i++) {
        blueprint.tierData[i] = tiers[i];
      }
    }

    const forwardFlag = !!(fastForward || skipMorphAnimation);

    const variantMode = requestedMode;
    const emissionMode = 'emergence';

    blueprint.metadata = {
      mode: emissionMode,
      variantMode,
      source,
      target: use3D ? `text3D:${wordRaw}${usedFallback ? ':FALLBACK' : ''}` : target,
      tierRatios: sanitizedRatios,
      counts,
      sstVersion: SST?.version || '3.5',
      viewport: viewportHint,
      fastForward: forwardFlag,
      skipMorphAnimation: !!skipMorphAnimation,
      targetState: targetState || null,
      note: usedFallback
        ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
        : 'Emergence endpoints separated: random atmospheric → 3D text target',
    };

    blueprint.mode = emissionMode;
    blueprint.fastForward = forwardFlag;
    if (skipMorphAnimation) blueprint.skipMorphAnimation = true;
    if (targetState) blueprint.targetState = targetState;

    trace('CE:EMIT', {
      mode: emissionMode,
      variantMode,
      stage: 'genesis',
      atmoAABB: aabbOf(blueprint.atmosphericPositions),
      textAABB: aabbOf(blueprint.text3DPositions),
      note: blueprint.metadata?.note || null,
    });

    this._emitBlueprint(blueprint);
    this._logEmergenceSummary({ count: blueprintCount, ratios: sanitizedRatios, counts, quality });

    return blueprint;
  }

  buildAndEmitBlueprint(stage, quality) {
    if (this._openingPhase && stage !== 'genesis') {
      console.warn('🧠 Engine: Blocked non-genesis during opening:', stage);
      return;
    }

    if (this._emergenceActive && stage !== 'genesis') {
      console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
      this._log('rebuild_blocked_emergence', { stage, quality });
      return;
    }
    
    const cacheKey = this._cacheKey(stage, quality);
    let blueprint = this.blueprintCache.get(cacheKey);

    // Post-emergence genesis: optionally preserve settled emergence
    if (stage === 'genesis' && this._lastEmergenceTargets) {
      if (this._lastText3DFallbackUsed) {
        console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
        this._lastEmergenceTargets = null;
        this._emergenceDone = false;
        this._rendererFencepostSeen = false;
      } else if (!this._emergenceDone) {
        console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
        this._lastEmergenceTargets = null;
        this._emergenceDone = false;
        this._rendererFencepostSeen = false;
      } else if (!this._rendererFencepostSeen) {
        console.warn('🧠 Engine: Renderer fencepost missing; rebuilding genesis cleanly');
        this._lastEmergenceTargets = null;
        this._emergenceDone = false;
        this._rendererFencepostSeen = false;
      } else {
        console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');

        const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
        blueprint = this.buildBlueprint(stage, {
          quality,
          overrideCount: emergenceCount,
        });

        if (blueprint) {
          const targets = this._lastEmergenceTargets;
          blueprint.atmosphericPositions.set(targets);
          blueprint.text3DPositions.set(targets);
          if (blueprint.positions?.length === targets.length) {
            blueprint.positions.set(targets);
          }

          this._lastEmergenceTargets = null;
          this._emergenceDone = false;

          if (this._validateBlueprint(blueprint)) {
            console.log('🔬 [BLUEPRINT] Final blueprint check:', {
              stage: blueprint.stage ?? blueprint.stageName,
              hasPositions: !!blueprint.positions,
              positionsLength: blueprint.positions?.length,
              metadata: blueprint.metadata,
            });
            emitBlueprintReady(BeatBus, EVENTS, blueprint, {
              stage,
              quality,
              mode: 'post-emergence-guarded',
              cacheKey,
              preservedEmergence: true,
            });
            this._preloadNextStage(stage, quality);
            this._log('blueprint_emitted', { stage, quality, cacheKey, mode: 'post-emergence-guarded' });
          }
          this._rendererFencepostSeen = false;
          return;
        }
      }
    }

    // Normal path: cached or fresh build
    if (blueprint) {
      console.log(`🧠 Using cached blueprint for ${stage}|${quality}`);
      if (this._validateBlueprint(blueprint)) {
        console.log('🔬 [BLUEPRINT] Final blueprint check:', {
          stage: blueprint.stage ?? blueprint.stageName,
          hasPositions: !!blueprint.positions,
          positionsLength: blueprint.positions?.length,
          metadata: blueprint.metadata,
        });
        emitBlueprintReady(BeatBus, EVENTS, blueprint, {
          stage,
          quality,
          cached: true,
          cacheKey,
        });
        this._preloadNextStage(stage, quality);
        this._log('blueprint_emitted', { stage, quality, cacheKey, cached: true });
      }
      return;
    }

    // Build fresh
    console.log(`🧠 Building new blueprint for ${stage}|${quality}`);
    blueprint = this.buildBlueprint(stage, { quality });

    if (blueprint && this._validateBlueprint(blueprint)) {
      this.blueprintCache.set(cacheKey, blueprint);
      console.log('🔬 [BLUEPRINT] Final blueprint check:', {
        stage: blueprint.stage ?? blueprint.stageName,
        hasPositions: !!blueprint.positions,
        positionsLength: blueprint.positions?.length,
        metadata: blueprint.metadata,
      });
      emitBlueprintReady(BeatBus, EVENTS, blueprint, {
        stage,
        quality,
        cached: false,
        cacheKey,
      });
      this._preloadNextStage(stage, quality);
      this._log('blueprint_emitted', { stage, quality, cacheKey, cached: false });
    }
  }

  _buildBlueprintForStage(stageName, requestedQuality, options = {}) {
    if (!stageName) return null;
    if (!this.#blueprintGenerator) {
      console.error('[ConsciousnessEngine] BlueprintGenerator unavailable');
      return null;
    }

    try {
      return this.#blueprintGenerator.buildStage(stageName, requestedQuality, options);
    } catch (error) {
      console.error(`[ConsciousnessEngine] Stage build failed for ${stageName}:`, error);
      return null;
    }
  }

  buildBlueprint(stageName, options = {}) {
    const quality = options.quality || this.currentQuality;
    return this._buildBlueprintForStage(stageName, quality, options);
  }

  // --- Validation ---

  _validateBlueprint(bp) {
    if (!bp) return false;
    
    const a = bp.atmosphericPositions;
    const t = bp.text3DPositions;
    const p = bp.positions;

    const arrays = [
      ['atmosphericPositions', a],
      ['text3DPositions', t],
      ['positions', p],
    ];

    for (const [name, arr] of arrays) {
      if (!(arr instanceof Float32Array) || !arr.length) {
        console.error(`Blueprint validation failed: missing or invalid ${name}`);
        return false;
      }
      if (arr.length % 3 !== 0) {
        console.error(`Blueprint validation failed: ${name} length not divisible by 3`);
        return false;
      }
    }

    const baseLength = a.length;
    if (t.length !== baseLength || p.length !== baseLength) {
      console.error('Blueprint validation failed: attribute length mismatch');
      return false;
    }

    for (let i = 0; i < baseLength; i++) {
      if (!isFinite(a[i]) || !isFinite(t[i]) || !isFinite(p[i])) {
        console.error('Blueprint validation failed: NaN/Infinity detected');
        return false;
      }
    }

    return true;
  }

  // --- Helper Functions ---

  generateViewportSpread(N, hint) {
    const viewportHint = hint || this._viewportHint || { width: 120, height: 90 };
    return utilsGenerateViewportSpread(N, viewportHint, { vc: VC });
  }

  generateConstellationFormation(
    N,
    tierRatios = VC?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15],
    hint,
    opts = {},
  ) {
    if (!this.#blueprintGenerator) {
      console.error('[ConsciousnessEngine] BlueprintGenerator unavailable');
      return new Float32Array(Math.max(0, (N || 0) * 3));
    }
    return this.#blueprintGenerator.generateConstellationFormation(N, tierRatios, hint, opts);
  }

  textToParticlePositions(text, count, viewportHint, options = {}) {
    const { letterSpacing = 1, scale = 1 } = options;
    const positions = new Float32Array(count * 3);
    const charWidth = 8.0 * letterSpacing * scale;
    const textHeight = 12.0 * scale;
    const depthJitter = 0.5 * scale;
    const length = Math.max(1, text.length);
    const halfLength = length / 2;

    for (let i = 0; i < count; i++) {
      const ci = Math.floor(Math.random() * length);
      const baseX = (ci - halfLength) * charWidth;
      positions[i * 3 + 0] = baseX + (Math.random() - 0.5) * charWidth * 0.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * textHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * depthJitter;
    }
    return positions;
  }

  getParticleCountForQuality(baseCount, quality) {
    const mult = { LOW: 0.3, MEDIUM: 0.6, HIGH: 1.0, ULTRA: 1.5 }[quality] ?? 1.0;
    return Math.min(Math.floor(baseCount * mult), 15000);
  }

  async loadFont(url = VC?.FONT_URL) {
    if (this._fontReady) return this.font;

    let primaryUrl = url || '/fonts/CourierPrime_Regular.typeface.json';
    let backupUrl = null;
    try {
      backupUrl = (await import('three/examples/fonts/helvetiker_regular.typeface.json?url')).default;
    } catch (e) {
      console.warn('⚠️ Unable to resolve bundled backup font URL', e);
    }

    try {
      const res = await fetch(primaryUrl, { method: 'HEAD' });
      console.log(`🔎 Font HEAD ${res.status} @ ${res.url || primaryUrl}`);
      if (!res.ok) {
        console.warn(`⚠️ Primary font not reachable (${res.status}); backup will be used if available.`);
      }
    } catch (e) {
      console.warn(`⚠️ Primary font HEAD failed (${primaryUrl})`, e);
    }

    if (!this._fontReadyPromise) {
      this._fontReadyPromise = new Promise((resolve, reject) => {
        const loader = new FontLoader();

        const onSuccess = (font, usedUrl) => {
          this.font = font;
          this._fontReady = true;
          const oldSize = this._text3DCache.size;
          this._text3DCache.clear();
          console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
          try {
            if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
              console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
              this.buildEmergenceBlueprint({ mode: 'emergence' });
            }
          } catch {}
          resolve(font);
        };

        const tryBackup = () => {
          if (!backupUrl) {
            console.warn('⚠️ No backup font URL available; remaining on fallback band until primary is served.');
            reject(new Error('No backup font URL'));
            return;
          }
          loader.load(
            backupUrl,
            (font) => onSuccess(font, backupUrl),
            undefined,
            (err) => {
              console.warn('⚠️ Backup font load failed', err);
              reject(err);
            }
          );
        };

        loader.load(
          primaryUrl,
          (font) => onSuccess(font, primaryUrl),
          undefined,
          (err) => {
            console.warn('⚠️ Primary font load failed; trying bundled backup', err);
            tryBackup();
          }
        );
      });
    }

    return this._fontReadyPromise;
  }

  async _ensureFontReady(timeoutMs = 1500) {
    if (this._fontReady) return true;
    if (!this._fontReadyPromise) this.loadFont().catch(() => {});
    if (!this._fontReadyPromise) return false;

    if (timeoutMs == null) {
      await this._fontReadyPromise.catch(() => {});
      return this._fontReady;
    }

    await Promise.race([
      this._fontReadyPromise.catch(() => {}),
      new Promise(r => setTimeout(r, timeoutMs)),
    ]);

    return this._fontReady;
  }

  _ensureFontForStage(stageKey, fontName) {
    if (!fontName) return;
    this._fontCache = this._fontCache || new Map();
    if (this._fontCache.has(fontName) && this._fontCache.get(fontName)) {
      this.font = this._fontCache.get(fontName);
      this._activeFontKey = fontName;
      this._fontReady = true;
      return;
    }
    if (this._fontLoadingKey === fontName) return;

    const resolver = FONT_RESOLVERS[fontName] || FONT_RESOLVERS.default;
    const loadPromise = Promise.resolve(
      typeof resolver === 'function' ? resolver({ stage: stageKey }) : resolver
    )
      .then((url) => this.loadFont(url))
      .then((font) => {
        if (font) {
          this._fontCache.set(fontName, font);
          this._activeFontKey = fontName;
        }
      })
      .catch((error) => {
        console.warn(`⚠️ Font load failed for "${fontName}" (stage ${stageKey})`, error);
        this._fontCache.set(fontName, null);
      })
      .finally(() => {
        this._fontLoadingKey = null;
      });

    this._fontLoadingKey = fontName;
    return loadPromise;
  }

  _build3DLetters(word, { particles, depth, letterSpacing = 1, scale = 1 }) {
    if (!particles || particles <= 0) {
      return new Float32Array();
    }

    const prevSuspend = globalThis.__GPU_WATCHDOG_SUSPEND__ === true;
    globalThis.__GPU_WATCHDOG_SUSPEND__ = true;

    let geometry;
    try {
      geometry = new TextGeometry(word, {
        font: this.font,
        size: 32,
        height: 1,
        curveSegments: 6,
        bevelEnabled: false,
      });
      geometry.computeBoundingBox();
      geometry.center();

      const bbox = geometry.boundingBox;
      const width = (bbox?.max.x ?? 0) - (bbox?.min.x ?? 0);
      const height = (bbox?.max.y ?? 0) - (bbox?.min.y ?? 0);
      const area = Math.max(1, width * height);

      const mesh = new Mesh(geometry);
      const sampler = new MeshSurfaceSampler(mesh).build();
      const out = new Float32Array(particles * 3);
      const scratch = new Vector3();
      const normal = new Vector3();

      const baseDepth = depth ?? 0.3;
      const thickness = Math.max(0.002, baseDepth * 0.25);
      const tangentJitter = thickness * 0.4;

      const spacingFactor = Math.max(0.12, Math.sqrt(area / particles) * 0.55);
      const minDistance = spacingFactor / Math.max(0.5, Math.min(1.6, letterSpacing));
      const minDistSq = minDistance * minDistance;
      const cellSize = minDistance / Math.SQRT2;
      const invCell = cellSize > 0 ? 1 / cellSize : 1;
      const buckets = new Map();

      let accepted = 0;
      let attempts = 0;
      const maxAttempts = particles * 40;

      const registerPoint = (dest, x, y) => {
        const cellX = Math.floor(x * invCell);
        const cellY = Math.floor(y * invCell);
        const key = `${cellX}:${cellY}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.push(dest);
        } else {
          buckets.set(key, [dest]);
        }
      };

      while (accepted < particles && attempts < maxAttempts) {
        attempts += 1;
        sampler.sample(scratch, normal);

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * tangentJitter;
        const px = scratch.x + Math.cos(angle) * radius;
        const py = scratch.y + Math.sin(angle) * radius;
        const pz = (Math.random() - 0.5) * thickness;

        const cellX = Math.floor(px * invCell);
        const cellY = Math.floor(py * invCell);
        let tooClose = false;
        for (let gx = cellX - 1; gx <= cellX + 1 && !tooClose; gx++) {
          for (let gy = cellY - 1; gy <= cellY + 1 && !tooClose; gy++) {
            const bucket = buckets.get(`${gx}:${gy}`);
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i += 1) {
              const idx = bucket[i];
              const dx = px - out[idx];
              const dy = py - out[idx + 1];
              if (dx * dx + dy * dy < minDistSq) {
                tooClose = true;
                break;
              }
            }
          }
        }
        if (tooClose) continue;

        const dest = accepted * 3;
        out[dest] = px;
        out[dest + 1] = py;
        out[dest + 2] = pz;
        registerPoint(dest, px, py);
        accepted += 1;
      }

      if (accepted < particles) {
        while (accepted < particles) {
          sampler.sample(scratch);
          const dest = accepted * 3;
          out[dest] = scratch.x;
          out[dest + 1] = scratch.y;
          out[dest + 2] = (Math.random() - 0.5) * thickness;
          accepted += 1;
        }
      }

      if (baseDepth && baseDepth !== 1) {
        for (let i = 2; i < out.length; i += 3) {
          out[i] *= baseDepth;
        }
      }

      if (letterSpacing && letterSpacing !== 1) {
        for (let i = 0; i < out.length; i += 3) {
          out[i] *= letterSpacing;
        }
      }

      if (scale && scale !== 1) {
        for (let i = 0; i < out.length; i += 3) {
          out[i] *= scale;
          out[i + 1] *= scale;
          out[i + 2] *= scale;
        }
      }

      return out;
    } finally {
      if (geometry) geometry.dispose();
      globalThis.__GPU_WATCHDOG_SUSPEND__ = prevSuspend;
    }
  }

  isEmergenceActive() {
    if (this.#morphController && typeof this.#morphController.isActive === 'function') {
      return this.#morphController.isActive();
    }
    return !!this._emergenceActive;
  }

  getEmergencePhase() {
    if (this.#morphController && typeof this.#morphController.getCurrentPhase === 'function') {
      return this.#morphController.getCurrentPhase();
    }
    return null;
  }

  generate3DTextFormation(word, opts = {}) {
    const {
      particles = 2000,
      depth = 0.3,
      viewportHint,
      letterSpacing = 1,
      scale = 1,
      fontKey = null,
      stage = null,
    } = opts;
    const key = `${word}_${particles}_${depth}_${letterSpacing}_${scale}_${fontKey || 'default'}`;

    const cached = this._text3DCache.get(key);
    if (cached) {
      this._lastText3DFallbackUsed = !!cached.isFallback;
      return cached.positions;
    }

    if (fontKey) {
      this._ensureFontForStage(stage || 'stage', fontKey);
      if (this._fontCache?.has(fontKey) && this._fontCache.get(fontKey)) {
        this.font = this._fontCache.get(fontKey);
        this._activeFontKey = fontKey;
        this._fontReady = true;
      }
    }

    if (!this.font) {
      const band = this.textToParticlePositions(word, particles, viewportHint, {
        letterSpacing,
        scale,
      });
      console.warn('⚠️ text3D fallback (font not ready) — NOT caching fallback');
      this._lastText3DFallbackUsed = true;
      return band;
    }

    const positions = this._build3DLetters(word, {
      particles,
      depth,
      letterSpacing,
      scale,
    });
    const entry = { positions, isFallback: false };
    this._text3DCache.set(key, entry);
    this._lastText3DFallbackUsed = false;
    return entry.positions;
  }

  // --- Diagnostics ---

  _log(type, data = {}) {
    // Intentional no-op: diagnostic trail removed for performance.
  }

  getStats() {
    return {
      cacheSize: this.blueprintCache.size,
      currentStage: this.currentStage,
      currentQuality: this.currentQuality,
      guardInvalidations: this._guardInvalidations.slice(-10),
    };
  }

  clearCache() {
    this.blueprintCache.clear();
    this._lastEmergenceTargets = null;
    this._text3DCache.clear();
    console.log('🧹 ConsciousnessEngine: caches cleared');
  }

  // Cleanup for HMR
  destroy() {
    console.log('[Engine] Destroying engine instance');
    if (this.#climaxController) {
      this.#climaxController.stopClimaxSequence({ emitComplete: false });
    }
    if (this.#morphController) {
      this.#morphController.stopEmergenceTimeline();
    }
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
