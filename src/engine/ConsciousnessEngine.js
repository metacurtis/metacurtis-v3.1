// src/engine/ConsciousnessEngine.js
// Canon-compliant production version with HMR safety, validation, and efficiency

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { Mesh, Vector3 } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import SST from '@/config/sst-loader.js'; // keep consistent with ESM imports
import { createSeededRandom } from '../utils/random.js';
import BlueprintGenerator from './modules/BlueprintGenerator.js';
import {
  generatePortraitPositions,
  generateQRPositions,
  generateScatterPositions,
  DEFAULT_QR_URL,
  DEFAULT_QUIET_ZONE,
  DEFAULT_ERROR_CORRECTION,
} from '@/utils/portraitPositions.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { trace } from '@/dev/trace.js';
import qrCurtis from '@/assets/climax/qr-curtis.json';
import {
  calculateBounds,
  gaussianRandom,
  createBlueprintStructure,
  assignTiersShuffled,
  emitBlueprintReady,
  makeBandFrame,
} from './utils/blueprintUtils.js';
import { emitTextPositionsReady } from '@/theater/bus/emitters.js';
import { morphController } from '@/theater/controllers/MorphAnimationController.js';
import { buildHotspotLookup } from '@/utils/hotspotMapping.js';
import { glyphSpace } from '@/engine/GlyphSpace.js';

// Visual behavior constants (formerly VC knobs)
const STARFIELD_FIT_FRAC = 0.92;
const STARFIELD_SCALE = 0.95;
const TIER_RATIOS = [0.7, 0.12, 0.13, 0.05];
const GAUSS_CLAMP = 1.0;
const T0_SIGMA_Y_FLATTEN = 1.0;
const T0_BAND_PROB = 0.25;
const BAND_ENABLED = true;
const BAND_T1_PROB = 0.95;
const BAND_T2_PROB = 0.98;
const T2_CLUSTER_COUNT = 8;
const T2_CLUSTER_SIGMA = 0.035;
const BAND_FRAME_SETTINGS = Object.freeze({
  BAND_ANGLE_DEG: 0,
  BAND_LENGTH_SCALE: 2.8,
  BAND_CORE_WIDTH: 0.06,
  BAND_FADE_WIDTH: 0.35,
});
const POINT_SIZE_KICK = 1.4;
const SIGMA_BASE = 2.5;
const SIGMA_PEAK = 3.8;
const T4_HI_PEAK = 1.0;
const T4_HI_SETTLE = 0.25;
const MID_MORPH_TARGET = 0.88;
const IMPLODE_MS = 2000;
const SETTLE_MS = 1500;
const SKIP_IMPL_MS = 320;
const SKIP_SETTLE_MS = 260;
const MORPH_HOLD_MS = 250;
const Z_BACK_MIN = 80;
const Z_BACK_MAX = 120;
const ATMO_SCALE = 1.0;
const ATMO_USE_BAND = true;

const CURATED_QR_POINTS = (() => {
  if (Array.isArray(qrCurtis?.points)) return new Float32Array(qrCurtis.points);
  if (Array.isArray(qrCurtis?.positions)) return new Float32Array(qrCurtis.positions);
  return null;
})();

const CURATED_QR_META = {
  moduleCount: Number.isFinite(qrCurtis?.moduleCount)
    ? qrCurtis.moduleCount
    : Number.isFinite(qrCurtis?.size)
      ? qrCurtis.size
      : undefined,
  moduleSize: Number.isFinite(qrCurtis?.moduleSize) ? qrCurtis.moduleSize : undefined,
  quietZone: Number.isFinite(qrCurtis?.quietZone) ? qrCurtis.quietZone : undefined,
};

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

/** Compute centroid/AABB/fit/anisotropy for a flat Float32Array xyz... */
export function __computeStarfieldMetrics(arr, hint, fitFrac = STARFIELD_FIT_FRAC) {
  const n = ((arr?.length || 0) / 3) | 0;
  let cx = 0;
  let cy = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = arr[3 * i];
    const y = arr[3 * i + 1];
    cx += x;
    cy += y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (n) {
    cx /= n;
    cy /= n;
  }
  const extX = maxX - minX;
  const extY = maxY - minY;
  const minView = Math.min(hint?.width ?? 120, hint?.height ?? 90);
  const rx = minView ? extX / minView : null;
  const ry = minView ? extY / minView : null;
  const anis = (extX > extY ? extX / extY : extY / extX) || 0;
  return { count: n, centroid: { x: cx, y: cy }, extents: { w: extX, h: extY }, ratios: { rx, ry }, anis, fitFrac };
}

/** Synthesize band starfield positions (N*3 Float32Array) - no side-effects */
export function __synthesizeBandPositions(N, hint) {
  const out = new Float32Array(N * 3);
  const rnd = createSeededRandom('probe-band');
  const clampG = GAUSS_CLAMP;
  const vw = (hint?.width ?? 120) * 0.5;
  const vh = (hint?.height ?? 90) * 0.5;
  const R = STARFIELD_SCALE * vw;
  const band = makeBandFrame(BAND_FRAME_SETTINGS, rnd, () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(-clampG, Math.min(clampG, g));
  });
  const sampleEllipse = (rx, ry) => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const gx = Math.max(-clampG, Math.min(clampG, g)) * rx;
    const gy = Math.max(-clampG, Math.min(clampG, g)) * ry;
    return [gx, gy];
  };
  // Tier distribution
  const ratios = TIER_RATIOS;
  const tc0 = Math.floor(N * ratios[0]);
  const tc1 = Math.floor(N * ratios[1]);
  const tc2 = Math.floor(N * ratios[2]);
  const tc3 = N - (tc0 + tc1 + tc2);
  const t0y = T0_SIGMA_Y_FLATTEN;
  let k = 0;
  // T0: 85% band-biased
  for (let i = 0; i < tc0; i++, k++) {
    const j = 3 * k;
    const useBand = BAND_ENABLED && rnd() < T0_BAND_PROB;
    const [x, y] = useBand
      ? band.sampleBand(1.4, R, R * t0y)
      : sampleEllipse(R, R * t0y);
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = 0;
  }
  // T1: band preference
  for (let i = 0; i < tc1; i++, k++) {
    const j = 3 * k;
    const useBand = BAND_ENABLED && rnd() < BAND_T1_PROB;
    const [x, y] = useBand
      ? band.sampleBand(1.0, R * 0.75, R * 0.75)
      : sampleEllipse(R * 0.75, R * 0.75);
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = 0;
  }
  // T2: clusters along band
  const cCount = T2_CLUSTER_COUNT;
  const cSigma = T2_CLUSTER_SIGMA * R;
  const clusters = Array.from({ length: cCount }, () => {
    if (BAND_ENABLED && rnd() < BAND_T2_PROB) {
      const [bx, by] = band.sampleBand(0.8, R * 0.66, R * 0.66);
      return { cx: bx, cy: by };
    }
    const [cx, cy] = sampleEllipse(R * 0.66, R * 0.66);
    return { cx, cy };
  });
  for (let i = 0; i < tc2; i++, k++) {
    const j = 3 * k;
    const c = clusters[Math.floor(rnd() * clusters.length)];
    out[j] = c.cx + (rnd() * 2 - 1) * cSigma;
    out[j + 1] = c.cy + (rnd() * 2 - 1) * cSigma;
    out[j + 2] = 0;
  }
  // T3: anchors on band
  for (let i = 0; i < tc3; i++, k++) {
    const j = 3 * k;
    const [x, y] = BAND_ENABLED
      ? band.sampleBand(0.6, R * 0.28, R * 0.28)
      : sampleEllipse(R * 0.28, R * 0.28);
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = 0;
  }
  // recenter + panoramic fit
  const metrics = __computeStarfieldMetrics(out, hint, STARFIELD_FIT_FRAC);
  const minView = Math.min(hint?.width ?? 120, hint?.height ?? 90);
  const currentR = Math.max(metrics.extents.w, metrics.extents.h) * 0.5;
  const targetR = STARFIELD_FIT_FRAC * minView;
  const scale = currentR > 0 ? targetR / currentR : 1;
  if (scale > 0 && Math.abs(scale - 1) > 1e-3) {
    for (let i = 0; i < out.length; i += 3) {
      out[i] *= scale;
      out[i + 1] *= scale;
    }
  }
  return out;
}
// =============================================================================

class ConsciousnessEngine {
  #blueprintGenerator = null;

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
    this._pendingQrMetadata = null;
    this._openingPreboundBlueprint = null;
    this._textMorphTimers = [];
    this._textMorphRaf = null;
    this._textMorphLastValue = null;

    // Opening gates
    this._openingPhase = true;
    this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };

    // Emergence memory - store only targets, not full blueprint
    this._lastEmergenceTargets = null;
    this._emergenceRaf = null;
    this._pendingEmergenceBlueprint = null;

    // Climax sequencing
    this._climaxState = {
      active: false,
      currentStep: null,
      stepIndex: -1,
      stepStartTime: 0,
      stepTransitionStart: 0,
      holdDuration: 0,
      transitionDuration: 0,
      progress: 0,
      phase: 'idle',
      previousPositions: null,
      rafId: null,
      usesRAF: false,
      lastMorphValue: null,
      holdStartTime: 0,
    };
    this._climaxSteps = [];

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

    setTimeout(async () => {
      console.log('🔮 Preloading next stage:', nextStageName);

      try {
        if (this.blueprintCache.has(nextCacheKey)) {
          console.log('🔮 Preload: Skipped, cache filled before execution', nextStageName);
          return;
        }

        const nextBlueprint = await this._buildBlueprintForStage(nextStageName, resolvedQuality);
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
    subscribe('TEXT_MORPH', this._onTextMorph.bind(this));
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
    const stage = payload.to;
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

  async _onPrewarmGenesis() {
    // Clear stale emergence targets so prewarm rebuilds with current canonical tuning
    this._lastEmergenceTargets = null;
    console.log('🧠 Engine: Prewarming genesis blueprint');
    const key = this._cacheKey('genesis', 'HIGH');
    if (!this.blueprintCache.has(key)) {
      const bp = await this.buildBlueprint('genesis', { quality: 'HIGH' });
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

  _clearTextMorphTimers() {
    if (Array.isArray(this._textMorphTimers) && this._textMorphTimers.length) {
      this._textMorphTimers.forEach((id) => clearTimeout(id));
    }
    this._textMorphTimers = [];
    if (this._textMorphRaf != null) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._textMorphRaf);
      } else {
        clearTimeout(this._textMorphRaf);
      }
      this._textMorphRaf = null;
    }
  }

  _onTextMorph(payload = {}) {
    const wordRaw = typeof payload.word === 'string' ? payload.word.trim() : '';
    if (!wordRaw) return;
    if (typeof globalThis !== 'undefined') {
      globalThis.__LAST_TEXT_MORPH_WORD__ = wordRaw;
    }

    const stage =
      typeof payload.stage === 'string'
        ? payload.stage
        : (this.currentStage || this._lastBlueprint?.stageName || 'genesis');

    const countCandidate = Number.isFinite(payload.particles)
      ? Math.max(1, Math.floor(payload.particles))
      : (this._lastBlueprint?.particleCount
          || this._lastBlueprint?.activeCount
          || SST?.performance?.particleCount?.[stage]
          || SST?.performance?.particleCount?.genesis
          || 12000);
    const count = Math.max(1, Math.floor(countCandidate));

    const letterGeom =
      Canonical?.getStageTypography?.(stage) ||
      Canonical?.visual?.letterGeometry?.[stage] ||
      {};
    const depth = Number(letterGeom.depth) || 0.3;
    const letterSpacing = Number(letterGeom.spacing ?? letterGeom.letterSpacing) || 1;
    const scale = Number(letterGeom.scale) || 1;
    const fontKey = typeof letterGeom.font === 'string' ? letterGeom.font : null;

    const transitionDuration = Number.isFinite(payload.transitionDuration)
      ? payload.transitionDuration
      : 2000;
    const durationMs = Math.max(0, transitionDuration);
    const dissolveDuration = 800;
    const reformDelay = 200;
    const reformDuration = Math.max(0, durationMs - dissolveDuration - reformDelay);

    this._clearTextMorphTimers();

    const morphSource = 'engine_text_morph_intent';
    const setMorphImmediate = (value, source = morphSource) => {
      const clamped = clamp(value, 0, 1);
      morphController.setImmediate(clamped, { source });
      this._textMorphLastValue = clamped;
      return clamped;
    };
    const setMorphTarget = ({ from, to, duration, source = morphSource }) => {
      const clampedFrom = clamp(
        Number.isFinite(from) ? from : (Number.isFinite(this._textMorphLastValue) ? this._textMorphLastValue : 1),
        0,
        1
      );
      const clampedTo = clamp(to, 0, 1);
      const safeDuration = Math.max(0, Number(duration) || 0);
      if (safeDuration <= 0) {
        return setMorphImmediate(clampedTo, source);
      }
      morphController.setTarget({
        from: clampedFrom,
        to: clampedTo,
        duration: safeDuration,
        source,
      });
      this._textMorphLastValue = clampedTo;
      return clampedTo;
    };

    const emitPositions = () => {
      const positions = this.generate3DTextFormation(wordRaw, {
        particles: count,
        depth,
        letterSpacing,
        scale,
        fontKey,
        stage,
        viewportHint: this._viewportHint,
      });
      if (this._lastBlueprint?.text3DPositions instanceof Float32Array
        && this._lastBlueprint.text3DPositions.length === positions.length) {
        this._lastBlueprint.text3DPositions.set(positions);
      }
      emitTextPositionsReady({
        positions,
        word: wordRaw,
        stage,
        count,
      });
      const shouldRegisterGlyphMap =
        (typeof globalThis !== 'undefined' && globalThis.__DEMO_KEY__ === 'landing_stage_slice') ||
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('slice') === 'landing_stage');
      if (shouldRegisterGlyphMap) {
        try {
          const hotspotLookup = buildHotspotLookup({
            stageName: stage,
            text3DPositions: positions,
            wordOverride: wordRaw,
          });
          glyphSpace.register(wordRaw, hotspotLookup);
        } catch (error) {
          console.warn('[Engine] GlyphSpace registration failed', error);
        }
      }
      console.log(`[Engine] TEXT_MORPH: Generated ${count} positions for "${wordRaw}"`);
    };

    if (!durationMs) {
      emitPositions();
      setMorphImmediate(1, 'engine_text_morph_immediate');
      return;
    }

    const startValue = Number.isFinite(this._textMorphLastValue) ? this._textMorphLastValue : 1;
    setMorphTarget({
      from: startValue,
      to: 0,
      duration: dissolveDuration,
      source: 'engine_text_morph_dissolve_intent',
    });
    const scheduleReform = () => {
      setMorphTarget({
        from: 0,
        to: 1,
        duration: reformDuration,
        source: 'engine_text_morph_reform_intent',
      });
    };
    const afterDissolve = () => {
      emitPositions();
      if (reformDelay > 0) {
        const reformTimer = setTimeout(scheduleReform, reformDelay);
        this._textMorphTimers.push(reformTimer);
      } else {
        scheduleReform();
      }
    };
    if (dissolveDuration > 0) {
      const dissolveTimer = setTimeout(afterDissolve, dissolveDuration);
      this._textMorphTimers.push(dissolveTimer);
    } else {
      afterDissolve();
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
      emitBlueprintReady(BeatBus, EVENTS, blueprint, {
        stage: 'genesis',
        quality: this.currentQuality,
        mode: payload.mode || 'emergence',
        cached: false,
        skipMorphAnimation: !!payload.skipMorphAnimation,
        targetState: payload.targetState,
        fastForward: !!payload.fastForward,
        cacheKey: this._cacheKey('genesis', this.currentQuality),
      });
      
      if (openingChaosMode) {
        console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount });
        this._openingPreboundBlueprint = blueprint;
        this._log('emergence_built', { count: blueprint.particleCount, mode: 'opening_chaos' });
      } else {
        console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
        this._openingPreboundBlueprint = null;
        this._log('emergence_built', { count: blueprint.particleCount });
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
    const count = bp?.activeCount || bp?.particleCount || 0;
    if (bp?.mode === 'opening_chaos') {
      this._emergenceActive = false;
      this._emergenceDone = false;
      return false;
    }
    if (!count || typeof window === 'undefined') {
      this._emergenceActive = false;
      this._emergenceDone = false;
      return false;
    }

    const nowMs = () => (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
    const schedule = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16));
    const cancel = (id) => {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
      else clearTimeout(id);
    };

    const smooth = (t) => t * t * (3 - 2 * t);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const pointSizeBase = Canonical?.features?.pointSizeDefault ?? 48;
    const sigmaBase = SIGMA_BASE;
    const sigmaPeak = SIGMA_PEAK;
    const pointKick = POINT_SIZE_KICK;
    const tierPeak = T4_HI_PEAK;
    const tierSettle = T4_HI_SETTLE;
    const midDefault = clamp(MID_MORPH_TARGET, 0.05, 0.95);

    const implDefault = IMPLODE_MS;
    const settleDefault = SETTLE_MS;

    const fastForward = !!(bp?.fastForward || bp?.metadata?.fastForward);
    const fastImpl = Math.max(120, Math.min(SKIP_IMPL_MS, implDefault));
    const fastSettle = Math.max(90, Math.min(SKIP_SETTLE_MS, settleDefault));

    if (this._emergenceRaf) {
      cancel(this._emergenceRaf);
      this._emergenceRaf = null;
    }

    const holdMs = Math.max(0, MORPH_HOLD_MS);

    const runTimeline = (implMs, settleMs, midValue) => {
      this._emergenceActive = true;
      this._emergenceDone = false;

      const start = nowMs();
      const totalPhases = Math.max(0, implMs) + Math.max(0, settleMs);
      const total = holdMs + totalPhases;

      const stageLabel = this.currentStage || 'genesis';
      const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : null;
      const stageIndex = stageOrder ? stageOrder.indexOf(stageLabel) : -1;
      const emitMorphState = (value, target = value) => {
        const clampedValue = clamp(value, 0, 1);
        const clampedTarget = clamp(target, 0, 1);
        const morphPayload = {
          morphProgress: clampedValue,
          value: clampedValue,
          morphTarget: clampedTarget,
          target: clampedTarget,
          stage: stageLabel,
          schemaVersion: '3.5',
        };
        if (stageIndex >= 0) {
          morphPayload.stageIndex = stageIndex;
        }
        BeatBus.emit('ENGINE:MORPH_STATE', morphPayload);
      };

      // Engine sets morph intent only; MorphAnimationController is the canonical MORPH_PROGRESS publisher.
      const driveMorphIntent = () => {
        morphController.setTarget({
          from: 0,
          to: 1,
          duration: Math.max(1, totalPhases),
          source: 'engine_emergence_intent',
        });
      };
      if (holdMs > 0) {
        const holdTimer = setTimeout(() => {
          if (!this._emergenceActive || this._rendererFencepostSeen) return;
          driveMorphIntent();
        }, holdMs);
        this._textMorphTimers.push(holdTimer);
      } else {
        driveMorphIntent();
      }

      const step = () => {
        if (!this._emergenceActive || this._rendererFencepostSeen) {
          this._emergenceRaf = null;
          return;
        }
        const elapsed = nowMs() - start;
        if (elapsed < holdMs) {
          this._emergenceRaf = schedule(step);
          return;
        }

        const phaseElapsed = elapsed - holdMs;
        const inImplosion = implMs > 0 ? phaseElapsed < implMs : false;
        const implPhase = implMs > 0 ? clamp(phaseElapsed / implMs, 0, 1) : 1;
        const settleElapsed = phaseElapsed - implMs;
        const settlePhaseRaw = settleElapsed <= 0 ? 0 : (settleMs > 0 ? clamp(settleElapsed / settleMs, 0, 1) : 1);
        const easeImpl = implMs > 0 ? smooth(implPhase) : 1;
        const easeSettle = settlePhaseRaw <= 0 ? 0 : smooth(settlePhaseRaw);

        const morph = inImplosion
          ? midValue * easeImpl
          : midValue + (1 - midValue) * easeSettle;

        const morphRounded = +morph.toFixed(3);
        emitMorphState(morphRounded, inImplosion ? midValue : 1);

        if (elapsed < total) {
          this._emergenceRaf = schedule(step);
        } else {
          if (!this._emergenceActive || this._rendererFencepostSeen) {
            this._emergenceRaf = null;
            return;
          }
          emitMorphState(1, 1);
          this._emergenceRaf = null;
          this._emergenceActive = false;
          this._emergenceDone = true;
        }
      };

      // Prime listeners with baseline state before the first frame
      emitMorphState(0, midValue);

      step();
      return true;
    };

    const implMs = fastForward ? fastImpl : implDefault;
    const settleMs = fastForward ? fastSettle : settleDefault;

    const midForTimeline = fastForward
      ? clamp(Math.min(midDefault, 0.35), 0.05, 0.5)
      : midDefault;

    console.log('🎨 [EMERGENCE TIMELINE]', {
      fastForward,
      midDefault,
      midForTimeline,
      implMs,
      settleMs,
      holdMs,
    });

    if (implMs > 6000 || settleMs > 6000) {
      console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: midForTimeline });
    }

    return runTimeline(implMs, settleMs, midForTimeline);
  }

  /**
   * Kick off the climax sequence orchestration.
   * Engine owns this flow so renderer + diagnostics stay in sync.
   */
  _handleStartClimax() {
    if (typeof window === 'undefined') return;
    if (this.currentStage !== 'transcendence') {
      console.warn(`🎬 Climax trigger ignored — current stage is "${this.currentStage}"`);
      return;
    }
    if (this._climaxState.active) {
      console.warn('🎬 Climax already active, ignoring duplicate trigger');
      return;
    }
    this._stopClimaxLoop();

    const transitions = Canonical?.visual?.transitions || {};
    const transitionTimings = {
      dissolveDuration: Number(transitions?.dissolveDuration) || 1500,
      reformDuration: Number(transitions?.reformDuration) || 1500,
      silenceDuration: Number(transitions?.silenceDuration) || 500,
    };

    const canonicalSequence =
      Canonical?.stages?.transcendence?.memoryFragments?.climax?.sequence;

    const fallbackSequence = [
      { action: 'dissolve', duration: 2000 },
      { action: 'formPortrait', duration: 3000 },
      { action: 'reformText', text: 'CURTIS WHORTON', duration: 2000 },
      { action: 'reformText', text: 'AI-NATIVE ENGINEER', duration: 2000 },
      { action: 'formQRCode', url: 'https://curtiswhorton.com', duration: 3000 },
    ];

    const sourceSequence =
      Array.isArray(canonicalSequence) && canonicalSequence.length
        ? canonicalSequence
        : fallbackSequence;

    const steps = sourceSequence.map((entry, index) => {
      const actionType = entry.action || entry.name || `step_${index}`;
      const holdDuration = Number(entry.duration) || transitionTimings.silenceDuration;
      const transitionDuration =
        actionType === 'dissolve'
          ? transitionTimings.dissolveDuration
          : transitionTimings.reformDuration;

      let name = actionType;
      switch (actionType) {
        case 'formPortrait':
          name = 'portrait';
          break;
        case 'reformText': {
          const upper = (entry.text || '').toUpperCase();
          name = upper.includes('ENGINEER') ? 'title' : 'name';
          break;
        }
        case 'formQRCode':
          name = 'qr';
          break;
        case 'dissolve':
          name = 'dissolve';
          break;
        default:
          name = actionType;
      }

      return {
        name,
        action: actionType,
        holdDuration,
        transitionDuration,
        text: entry.text ?? null,
        url: entry.url ?? null,
      };
    });

    console.log('🎬 ConsciousnessEngine: Starting climax sequence');

    const now = performance.now ? performance.now() : Date.now();
    this._climaxState.active = true;
    this._climaxState.currentStep = null;
    this._climaxState.previousPositions = null;
    this._climaxState.stepIndex = 0;
    this._climaxState.stepStartTime = now;
    this._climaxState.stepTransitionStart = now;
    this._climaxState.holdDuration = 0;
    this._climaxState.transitionDuration = 0;
    this._climaxState.phase = 'idle';
    this._climaxState.progress = 0;
    this._climaxState.lastMorphValue = null;
    this._climaxState.holdStartTime = 0;

    this._climaxSteps = steps;
    this._log('climax_start', { steps: steps.length });

    this._prepareClimaxStep(0, now);
    this._scheduleClimaxFrame();
  }

  _prepareClimaxStep(stepIndex, timestamp) {
    if (!this._climaxState.active) return;
    if (stepIndex >= this._climaxSteps.length) {
      this._finalizeClimaxSequence();
      return;
    }

    const step = this._climaxSteps[stepIndex];
    const state = this._climaxState;
    const now = timestamp ?? (performance.now ? performance.now() : Date.now());
    const holdDuration = Math.max(0, Number(step.holdDuration) || 0);
    const transitionDuration = Math.max(1, Number(step.transitionDuration) || 1);

    state.stepIndex = stepIndex;
    state.currentStep = step.name;
    state.stepStartTime = now;
    state.holdDuration = holdDuration;
    state.transitionDuration = transitionDuration;
    state.phase = 'transition';
    state.stepTransitionStart = now;
    state.progress = 0;
    state.lastMorphValue = null;
    state.holdStartTime = 0;

    this._log('climax_step', {
      step: step.name,
      hold: holdDuration,
      transition: transitionDuration,
      index: stepIndex,
    });

    BeatBus.emit(EVENTS.CLIMAX_STEP, {
      step: step.name ?? null,
      holdDuration,
      transitionDuration,
      text: step.text ?? undefined,
      url: step.url ?? undefined,
      stepIndex,
      source: 'ConsciousnessEngine',
    });

    this._buildClimaxBlueprint(step);

    this._emitClimaxProgress(0, step, stepIndex);
  }

  _emitClimaxProgress(progress, step, stepIndex) {
    const state = this._climaxState;
    if (!state.active) return;
    const clamped = clamp(progress, 0, 1);
    if (state.lastMorphValue != null && clamped < 1 && Math.abs(state.lastMorphValue - clamped) < 1e-3) {
      return;
    }
    state.lastMorphValue = clamped;

    const stageLabel = this.currentStage || 'transcendence';
    const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : null;
    const stageIndex = stageOrder ? stageOrder.indexOf(stageLabel) : -1;

    const morphPayload = {
      morphProgress: clamped,
      value: clamped,
      morphTarget: 1,
      target: 1,
      stage: stageLabel,
      schemaVersion: '3.5',
      postMorphFreeze: clamped >= 1 ? 1 : 0,
      source: 'climax-transition',
      step: step?.name,
      stepIndex,
    };
    if (stageIndex >= 0) {
      morphPayload.stageIndex = stageIndex;
    }

    BeatBus.emit('ENGINE:MORPH_STATE', morphPayload);
  }

  _runClimaxFrame() {
    if (!this._climaxState.active) return;

    const state = this._climaxState;
    const step = this._climaxSteps[state.stepIndex];
    if (!step) {
      this._finalizeClimaxSequence();
      return;
    }

    const now = performance.now ? performance.now() : Date.now();

    if (state.phase === 'transition') {
      const raw = Math.min((now - state.stepTransitionStart) / state.transitionDuration, 1);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      state.progress = eased;
      if (raw < 1) {
        this._emitClimaxProgress(eased, step, state.stepIndex);
      } else {
        this._emitClimaxProgress(1, step, state.stepIndex);
        const nextIndex = state.stepIndex + 1;
        if (state.holdDuration > 0) {
          state.phase = 'postHold';
          state.holdStartTime = now;
        } else if (nextIndex >= this._climaxSteps.length) {
          this._finalizeClimaxSequence();
          return;
        } else {
          this._prepareClimaxStep(nextIndex, now);
        }
      }
    } else if (state.phase === 'postHold') {
      const holdElapsed = now - state.holdStartTime;
      if (holdElapsed >= state.holdDuration) {
        const nextIndex = state.stepIndex + 1;
        if (nextIndex >= this._climaxSteps.length) {
          this._finalizeClimaxSequence();
          return;
        }
        this._prepareClimaxStep(nextIndex, now);
      }
    }

    this._scheduleClimaxFrame();
  }

  _scheduleClimaxFrame() {
    if (!this._climaxState.active) return;
    if (typeof requestAnimationFrame === 'function') {
      this._climaxState.usesRAF = true;
      this._climaxState.rafId = requestAnimationFrame(() => this._runClimaxFrame());
    } else {
      this._climaxState.usesRAF = false;
      this._climaxState.rafId = setTimeout(() => this._runClimaxFrame(), 16);
    }
  }

  _stopClimaxLoop() {
    const state = this._climaxState;
    if (!state) return;
    if (state.rafId != null) {
      if (state.usesRAF && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(state.rafId);
      } else {
        clearTimeout(state.rafId);
      }
    }
    state.rafId = null;
    state.usesRAF = false;
  }

  _buildClimaxBlueprint(step) {
    const particleCount = this._resolveClimaxParticleCount();
    if (!particleCount) {
      console.warn('🧠 Engine: Unable to resolve particle count for climax');
      return;
    }

    let positions = null;
    try {
      const actionType = step.action || step.name;
      switch (actionType) {
        case 'dissolve': {
          const spread = { x: 60, y: 45, z: 15 };
          positions = generateScatterPositions(particleCount, spread);
          break;
        }
        case 'formPortrait':
        case 'portrait':
          positions = generatePortraitPositions(particleCount);
          break;
        case 'reformText':
        case 'name':
        case 'title':
          positions = this._generateClimaxTextPositions(step.text, particleCount) ||
            generateScatterPositions(particleCount);
          break;
        case 'formQRCode':
        case 'qr': {
          const url = String(step?.url || DEFAULT_QR_URL);
          const qrMeta = {};
          let basePositions = generateQRPositions(
            particleCount,
            url,
            DEFAULT_QUIET_ZONE,
            DEFAULT_ERROR_CORRECTION,
            qrMeta
          );

          if (!(basePositions instanceof Float32Array) || basePositions.length === 0) {
            if (CURATED_QR_POINTS instanceof Float32Array && CURATED_QR_POINTS.length) {
              console.warn('[QR] Generated QR empty; falling back to curated asset');
              basePositions = CURATED_QR_POINTS;
              qrMeta.moduleCount = qrMeta.moduleCount ?? CURATED_QR_META.moduleCount ?? null;
              qrMeta.quietZone = qrMeta.quietZone ?? CURATED_QR_META.quietZone ?? DEFAULT_QUIET_ZONE;
              qrMeta.moduleSize = qrMeta.moduleSize ?? CURATED_QR_META.moduleSize ?? undefined;
            } else {
              console.warn('[QR] No QR positions available; using scatter fallback');
              basePositions = generateScatterPositions(particleCount);
            }
          }

          positions = basePositions;
          const moduleSizeEstimate =
            qrMeta.moduleSize ??
            (qrMeta.moduleCount
              ? 1 / (qrMeta.moduleCount + 2 * (qrMeta.quietZone ?? DEFAULT_QUIET_ZONE))
              : CURATED_QR_META.moduleSize);

          this._pendingQrMetadata = {
            url,
            moduleCount: qrMeta.moduleCount ?? CURATED_QR_META.moduleCount ?? null,
            moduleSize: moduleSizeEstimate ?? undefined,
            quietZone: qrMeta.quietZone ?? CURATED_QR_META.quietZone ?? DEFAULT_QUIET_ZONE,
            positions: basePositions,
          };
          break;
        }
        default:
          positions = generateScatterPositions(particleCount);
      }
    } catch (error) {
      console.error('🧠 Engine: Climax formation generation failed', {
        step: step.name,
        action: step.action,
        error,
      });
      positions = generateScatterPositions(particleCount);
    }

    if (!(positions instanceof Float32Array)) {
      console.warn('🧠 Engine: Invalid climax positions array, falling back to scatter');
      positions = generateScatterPositions(particleCount);
    }

    const actionName = (step.action || step.name || '').toLowerCase();
    const isQrStep = actionName === 'formqrcode' || actionName === 'qr';
    const effectiveCount =
      isQrStep && positions instanceof Float32Array
        ? Math.max(0, Math.floor(positions.length / 3))
        : particleCount;

    const blueprint = this._buildClimaxBlueprintFromPositions(step, positions, effectiveCount);
    if (!blueprint) return;

    if (blueprint && isQrStep) {
      const qrMeta = this._pendingQrMetadata || {};
      const qrPositions = qrMeta.positions instanceof Float32Array
        ? qrMeta.positions
        : blueprint.text3DPositions instanceof Float32Array
          ? blueprint.text3DPositions
          : null;

      if (qrPositions) {
        const copy = qrPositions.slice();
        const copy2 = qrPositions.slice();
        blueprint.text3DPositions = copy;
        blueprint.atmosphericPositions = copy2;
        blueprint.positions = qrPositions.slice();
        blueprint.particleCount = qrPositions.length / 3;
        blueprint.activeCount = blueprint.particleCount;
      }

      blueprint.metadata = {
        ...(blueprint.metadata || {}),
        qrMode: true,
        url: qrMeta.url ?? step.url ?? null,
        moduleCount: qrMeta.moduleCount ?? undefined,
        quietZone: qrMeta.quietZone ?? undefined,
      };
    }
    this._pendingQrMetadata = null;

    const emitPayload = {
      stage: 'transcendence',
      quality: this.currentQuality,
      mode: `climax:${step.name}`,
      duration: step.holdDuration,
      transitionDuration: step.transitionDuration,
      timestamp: performance.now ? performance.now() : Date.now(),
      text: step.text ?? null,
      action: step.action ?? step.name,
      url: step.url ?? null,
      cached: false,
      cacheKey: this._cacheKey('transcendence', this.currentQuality),
    };

    emitBlueprintReady(BeatBus, EVENTS, blueprint, emitPayload);
    this._log('climax_blueprint_emitted', { step: step.name, particleCount });
  }

  _buildClimaxBlueprintFromPositions(step, targetPositions, particleCount) {
    const totalFloats = particleCount * 3;
    if (!(targetPositions instanceof Float32Array) || targetPositions.length !== totalFloats) {
      console.error('🧠 Engine: Climax blueprint target length mismatch', {
        expected: totalFloats,
        received: targetPositions?.length ?? 0,
        step: step?.name,
      });
      return null;
    }

    const copyFloat32 = (arr) => (arr instanceof Float32Array ? arr.slice() : null);
    const randomSeeds = (arr) => {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = Math.random();
      }
    };
    const randomScalar = (arr, base, span) => {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = base + Math.random() * span;
      }
    };

    const source = this._lastBlueprint;
    let fromPositions = null;

    if (this._climaxState.previousPositions instanceof Float32Array &&
        this._climaxState.previousPositions.length === totalFloats) {
      fromPositions = this._climaxState.previousPositions.slice();
    } else if (source?.text3DPositions instanceof Float32Array &&
               source.text3DPositions.length === totalFloats) {
      fromPositions = source.text3DPositions.slice();
    } else if (source?.atmosphericPositions instanceof Float32Array &&
               source.atmosphericPositions.length === totalFloats) {
      fromPositions = source.atmosphericPositions.slice();
    } else {
      fromPositions = generateScatterPositions(particleCount);
    }

    if (fromPositions.length !== totalFloats) {
      const fallback = new Float32Array(totalFloats);
      fallback.set(fromPositions.subarray(0, Math.min(fromPositions.length, totalFloats)));
      fromPositions = fallback;
    }

    const cloneOrCreate = (attr, length, filler) => {
      if (attr instanceof Float32Array && attr.length === length) {
        return attr.slice();
      }
      const arr = new Float32Array(length);
      if (typeof filler === 'function') filler(arr);
      return arr;
    };

    const palette = ['#ffffff', '#f59e0b', '#00ffcc'];
    const animationSeeds = cloneOrCreate(source?.animationSeeds, totalFloats, randomSeeds);
    const sizeMultipliers = cloneOrCreate(source?.sizeMultipliers, particleCount, (arr) => randomScalar(arr, 0.8, 0.4));
    const opacityData = cloneOrCreate(source?.opacityData, particleCount, (arr) => randomScalar(arr, 0.55, 0.4));
    const atlasIndices = cloneOrCreate(source?.atlasIndices, particleCount, (arr) => {
      for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
    });
    const tierData = cloneOrCreate(source?.tierData, particleCount, (arr) => {
      for (let i = 0; i < arr.length; i += 1) arr[i] = 2;
    });

    const metadata = {
      ...(source?.metadata || {}),
      climaxStep: step.name,
      climaxAction: step.action ?? step.name,
      climaxTimestamp: performance.now ? performance.now() : Date.now(),
      climaxText: step.text ?? null,
      climaxUrl: step.url ?? null,
      climaxHoldMs: step.holdDuration,
      climaxTransitionMs: step.transitionDuration,
      colors: palette,
    };

    const startPositions = fromPositions.slice();

    const blueprint = {
      stageName: 'transcendence',
      particleCount,
      activeCount: particleCount,
      maxParticles: Math.max(source?.maxParticles || particleCount, particleCount),
      positions: startPositions,
      atmosphericPositions: fromPositions,
      text3DPositions: targetPositions.slice(),
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata,
      mode: `climax:${step.name}`,
      climaxStep: step.name,
      colors: palette,
      hotspotMap: {},
      hotspotLookup: null,
    };

    this._lastBlueprint = blueprint;
    this._climaxState.previousPositions = blueprint.text3DPositions.slice();
    return blueprint;
  }

  _finalizeClimaxSequence() {
    this._stopClimaxLoop();

    this._climaxState.active = false;
    this._climaxState.currentStep = null;
    this._climaxState.stepIndex = -1;
    this._climaxState.stepStartTime = 0;
    this._climaxState.previousPositions = null;
    this._climaxState.stepTransitionStart = 0;
    this._climaxState.holdDuration = 0;
    this._climaxState.transitionDuration = 0;
    this._climaxState.phase = 'idle';
    this._climaxState.progress = 0;
    this._climaxState.lastMorphValue = null;
    this._climaxState.rafId = null;
    this._climaxState.usesRAF = false;
    this._climaxState.holdStartTime = 0;

    this._log('climax_complete');
    console.log('🎬 Climax sequence complete');
    BeatBus.emit(EVENTS.CLIMAX_STEP, { step: 'complete', source: 'ConsciousnessEngine' });
  }

  _resolveClimaxParticleCount() {
    const last = this._lastBlueprint;
    const stageConfig = Canonical?.stages?.transcendence || {};
    const baseFromStage = Number.isFinite(stageConfig.particleCount)
      ? stageConfig.particleCount
      : Number.isFinite(stageConfig.particlesBase)
        ? stageConfig.particlesBase
        : 15000;
    const baseFromLast = Number.isFinite(last?.particleCount) ? last.particleCount : baseFromStage;

    try {
      return this.getParticleCountForQuality(baseFromLast, this.currentQuality || 'HIGH');
    } catch (error) {
      console.warn('🧠 Engine: Unable to scale climax particle count by quality', error);
      return baseFromLast;
    }
  }

  _generateClimaxTextPositions(text, particleCount) {
    if (!text) return null;
    try {
      const positions = this.generate3DTextFormation(text, { particles: particleCount, depth: 0.25 });
      if (positions instanceof Float32Array && positions.length === particleCount * 3) {
        return positions;
      }
    } catch (error) {
      console.warn('🧠 Engine: Climax text formation failed', { text, error });
    }
    return null;
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
    return this._getStageTierRatiosFromSST('genesis');
  }

  _getStageTierRatiosFromSST(stageName = 'genesis') {
    const resolvedStage =
      typeof stageName === 'string' && stageName.trim() ? stageName.trim() : 'genesis';
    const stageTierMix = SST?.stages?.[resolvedStage]?.tierMix;
    const stageTierRatios = SST?.stages?.[resolvedStage]?.tiers?.ratios;
    const visualTierRatios = SST?.visual?.tiers?.ratios;
    return this._normalizeTierRatios(
      stageTierMix || stageTierRatios || visualTierRatios || [0.5, 0.2, 0.15, 0.15]
    );
  }

  /**
   * Generate randomized atmospheric scatter (cube within view-scaled bounds).
   * Count * 3 float32 output.
   */
  _generateRandomAtmosphericScatter(count, viewportHint, opts = {}) {
    const out = new Float32Array(count * 3);
    const width = viewportHint?.width ?? viewportHint?.w ?? 16;
    const height = viewportHint?.height ?? viewportHint?.h ?? 9;
    const base = Math.max(1.0, Math.min(width, height));
    const R = base * 0.45;
    const spreadWidth = width * 1.3;
    const spreadHeight = height * 1.3;
    const spreadDepth = Math.max(spreadWidth, spreadHeight) * 0.6;

    const rnd = Math.random;
    const gauss = () => gaussianRandom({ rand: rnd, clamp: 2.2 });

    const useBand = opts.band ?? ATMO_USE_BAND;
    if (useBand) {
      const rx = R;
      const ry = R * T0_SIGMA_Y_FLATTEN;
      const zMin = -Z_BACK_MAX;
      const zMax = -Z_BACK_MIN;
      const band = makeBandFrame(BAND_FRAME_SETTINGS, rnd, gauss);
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        const [x, y] = band.sampleBand(1.0, rx, ry);
        out[j + 0] = x;
        out[j + 1] = y;
        out[j + 2] = zMin + rnd() * (zMax - zMin);
      }
      return out;
    }

    const rx = spreadWidth * 0.5;
    const ry = spreadHeight * 0.5;
    const rz = spreadDepth * 0.5;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      out[j + 0] = gauss() * rx;
      out[j + 1] = gauss() * ry;
      out[j + 2] = gauss() * rz;
    }
    return out;
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
      mode = 'emergence',
      source = 'viewportSpread',
      target = 'constellation',
      stageName: stageNameInput = 'genesis',
      sourceText = undefined,
      count = SST?.performance?.particleCount?.genesis ?? 2000,
      tierRatios = undefined,
      viewportHint = this._viewportHint,
      quality = 'HIGH',
      fastForward = false,
      skipMorphAnimation = false,
      targetState = undefined,
    } = options || {};

    const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : [];
    const emergenceStage = stageOrder.includes(stageNameInput) ? stageNameInput : 'genesis';
    const sanitizedRatios = this._normalizeTierRatios(
      tierRatios || this._getStageTierRatiosFromSST(emergenceStage)
    );

    const blueprint = this._createEmptyBlueprint(count, { mode, quality });
    if (!blueprint) return null;

    const blueprintCount = blueprint.particleCount;
    const atmospheric = this._generateRandomAtmosphericScatter(blueprintCount, viewportHint, { band: false });

    // Target: prefer SST kinetic typography (“HELLO CURTIS”) with safe fallback
    const stageTypography =
      Canonical?.getStageTypography?.(emergenceStage) ||
      Canonical?.visual?.letterGeometry?.[emergenceStage] ||
      Canonical?.visual?.letterGeometry?.genesis ||
      {};
    const lg = SST?.visual?.letterGeometry?.[emergenceStage] || SST?.visual?.letterGeometry?.genesis || {};
    const canonicalWord =
      Canonical?.getStageWord?.(emergenceStage) ||
      stageTypography?.word ||
      Canonical?.visual?.letterGeometry?.genesis?.word;
    const payloadWord = typeof sourceText === 'string' ? sourceText.trim() : '';
    const stageWordFallback = typeof canonicalWord === 'string' && canonicalWord.trim()
      ? canonicalWord.trim()
      : 'GENESIS';
    const wordRaw = payloadWord || (typeof lg.word === 'string' && lg.word.trim()
      ? lg.word.trim()
      : stageWordFallback);
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
          stage: emergenceStage,
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

    blueprint.metadata = {
      mode,
      source,
      target: use3D ? `text3D:${wordRaw}${usedFallback ? ':FALLBACK' : ''}` : target,
      stage: emergenceStage,
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

    blueprint.mode = mode;
    blueprint.stageName = emergenceStage;
    blueprint.stage = emergenceStage;
    blueprint.fastForward = forwardFlag;
    if (skipMorphAnimation) blueprint.skipMorphAnimation = true;
    if (targetState) blueprint.targetState = targetState;

    trace('CE:EMIT', {
      mode,
      stage: emergenceStage,
      atmoAABB: aabbOf(blueprint.atmosphericPositions),
      textAABB: aabbOf(blueprint.text3DPositions),
      note: blueprint.metadata?.note || null,
    });

    this._emitBlueprint(blueprint);
    this._logEmergenceSummary({ count: blueprintCount, ratios: sanitizedRatios, counts, quality });

    return blueprint;
  }

  async buildAndEmitBlueprint(stage, quality) {
    try {
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
        const targets = this._lastEmergenceTargets;

        const preservedBlueprint = createBlueprintStructure(emergenceCount, {
          stageName: 'genesis',
          mode: 'post-emergence-guarded',
          quality,
          metadata: {
            mode: 'post-emergence-guarded',
            preservedEmergence: true,
            buildTime: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
          },
        });

        preservedBlueprint.atmosphericPositions.set(targets);
        preservedBlueprint.text3DPositions.set(targets);
        preservedBlueprint.positions.set(targets);
        preservedBlueprint.particleCount = emergenceCount;
        preservedBlueprint.activeCount = emergenceCount;
        preservedBlueprint.maxParticles = emergenceCount;

        const lastBp = this._lastBlueprint || this._pendingEmergenceBlueprint;
        if (lastBp) {
          const copyIfMatch = (src, dest, name) => {
            if (src instanceof Float32Array && src.length === dest.length) {
              dest.set(src);
              return true;
            }
            return false;
          };

          copyIfMatch(lastBp.tierData, preservedBlueprint.tierData, 'tierData');
          if (lastBp.tierOf instanceof Uint8Array && lastBp.tierOf.length === preservedBlueprint.tierOf.length) {
            preservedBlueprint.tierOf.set(lastBp.tierOf);
          }
          copyIfMatch(lastBp.animationSeeds, preservedBlueprint.animationSeeds, 'animationSeeds');
          copyIfMatch(lastBp.sizeMultipliers, preservedBlueprint.sizeMultipliers, 'sizeMultipliers');
          copyIfMatch(lastBp.opacityData, preservedBlueprint.opacityData, 'opacityData');
          copyIfMatch(lastBp.atlasIndices, preservedBlueprint.atlasIndices, 'atlasIndices');

          if (lastBp.metadata) {
            preservedBlueprint.metadata = {
              ...lastBp.metadata,
              mode: 'post-emergence-guarded',
              preservedEmergence: true,
              buildTime: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
            };
          }
          if (lastBp.hotspotMap) {
            preservedBlueprint.hotspotMap = lastBp.hotspotMap;
          }
          if (lastBp.hotspotLookup) {
            preservedBlueprint.hotspotLookup = lastBp.hotspotLookup;
          }
        }

        this._lastEmergenceTargets = null;
        this._emergenceDone = false;

        console.log('🔬 [Blueprint Preserve] Validation check:', {
          particleCount: preservedBlueprint.particleCount,
          activeCount: preservedBlueprint.activeCount,
          atmosphericLength: preservedBlueprint.atmosphericPositions.length,
          text3DLength: preservedBlueprint.text3DPositions.length,
          positionsLength: preservedBlueprint.positions.length,
          hasMetadata: !!preservedBlueprint.metadata,
        });

        if (this._validateBlueprint(preservedBlueprint)) {
          console.log('✅ [Blueprint Preserve] Validation passed, emitting...');
          emitBlueprintReady(BeatBus, EVENTS, preservedBlueprint, {
            stage,
            quality,
            mode: 'post-emergence-guarded',
            cacheKey,
            preservedEmergence: true,
          });
          this._preloadNextStage(stage, quality);
          this._log('blueprint_emitted', {
            stage,
            quality,
            cacheKey,
            mode: 'post-emergence-guarded',
            particleCount: preservedBlueprint.particleCount,
          });
        } else {
          console.error('❌ [Blueprint Preserve] Validation FAILED - not emitting');
        }
        this._rendererFencepostSeen = false;
        return;
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
      blueprint = await this.buildBlueprint(stage, { quality });

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
    } catch (error) {
      console.error('🧠 Engine: buildAndEmitBlueprint failed', error);
      this._log('blueprint_error', {
        stage,
        quality,
        message: error?.message || 'unknown_error',
      });
    }
  }

  async _buildBlueprintForStage(stageName, requestedQuality, options = {}) {
    if (!stageName) return null;
    if (!this.#blueprintGenerator) {
      console.error('[ConsciousnessEngine] BlueprintGenerator unavailable');
      return null;
    }

    try {
      return await this.#blueprintGenerator.buildStage(stageName, requestedQuality, options);
    } catch (error) {
      console.error(`[ConsciousnessEngine] Stage build failed for ${stageName}:`, error);
      return null;
    }
  }

  async buildBlueprint(stageName, options = {}) {
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
    const { width = 120, height = 90 } = hint || this._viewportHint;
    const out = new Float32Array(N * 3);

    const vw = width * 0.5;
    const vh = height * 0.5;
    const R = STARFIELD_SCALE * vw;
    const AT = ATMO_SCALE;
    const rx = R * AT;
    const ry = R * AT * T0_SIGMA_Y_FLATTEN;
    const zMin = -Z_BACK_MAX;
    const zMax = -Z_BACK_MIN;

    const rnd = Math.random;
    const gauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(-1.2, Math.min(1.2, g));
    };

    if (ATMO_USE_BAND) {
      const band = makeBandFrame(BAND_FRAME_SETTINGS, rnd, gauss);
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        const [x, y] = band.sampleBand(1.0, rx, ry);
        out[j] = x;
        out[j + 1] = y;
        out[j + 2] = zMin + rnd() * (zMax - zMin);
      }
      return out;
    }

    for (let i = 0; i < N; i++) {
      const j = i * 3;
      out[j] = gauss() * rx;
      out[j + 1] = gauss() * ry;
      out[j + 2] = zMin + rnd() * (zMax - zMin);
    }

    return out;
  }

  generateConstellationFormation(
    N,
    tierRatios = TIER_RATIOS,
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

  async loadFont(url) {
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
    this._stopClimaxLoop();
    this._clearTextMorphTimers();
    if (this._climaxState) {
      this._climaxState.active = false;
      this._climaxState.currentStep = null;
      this._climaxState.previousPositions = null;
      this._climaxState.stepIndex = -1;
      this._climaxState.stepStartTime = 0;
      this._climaxState.stepTransitionStart = 0;
      this._climaxState.holdDuration = 0;
      this._climaxState.transitionDuration = 0;
      this._climaxState.lastMorphValue = null;
      this._climaxState.phase = 'idle';
      this._climaxState.progress = 0;
      this._climaxState.rafId = null;
      this._climaxState.usesRAF = false;
      this._climaxState.holdStartTime = 0;
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
