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
import {
  generatePortraitPositions,
  generateQRPositions,
  generateScatterPositions,
} from '@/utils/portraitPositions.js';
import { buildHotspotLookup } from '@/utils/hotspotMapping.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { trace } from '@/dev/trace.js';
import qrCurtis from '@/assets/climax/qr-curtis.json';

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

// ===== Band probe helpers (pure, exportable) =================================
const deg2rad = (d) => (d * Math.PI) / 180;
function makeBandFrame(vc, rnd, gauss) {
  const ANG = deg2rad(vc.BAND_ANGLE_DEG ?? 0);
  const c = Math.cos(ANG);
  const s = Math.sin(ANG);
  const len = vc.BAND_LENGTH_SCALE ?? 2.20;
  const core = vc.BAND_CORE_WIDTH ?? 0.08;
  const fade = vc.BAND_FADE_WIDTH ?? 0.20;
  const unrot = (u, v) => [c * u - s * v, s * u + c * v];
  const sampleBand = (bias = 1.0, scaleX = 1.0, scaleY = 1.0) => {
    const u = (rnd() * 2 - 1) * len;
    const useCore = rnd() < 0.7;
    const v = (useCore ? gauss() * core : gauss() * fade) / Math.max(0.001, bias);
    const [ux, uy] = unrot(u, v);
    return [ux * scaleX, uy * scaleY];
  };
  return { sampleBand };
}

function fitToViewXY(out, vw, vh, fitFrac = 0.86) {
  if (!fitFrac || fitFrac <= 0) return;

  const computeScale = () => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < out.length; i += 3) {
      const x = out[i];
      const y = out[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const extX = maxX - minX;
    const extY = maxY - minY;
    const halfX = extX * 0.5;
    const halfY = extY * 0.5;
    let fracX;
    let fracY;

    if (Array.isArray(fitFrac)) {
      fracX = Number.isFinite(fitFrac[0]) ? fitFrac[0] : 1;
      fracY = Number.isFinite(fitFrac[1]) ? fitFrac[1] : fracX;
    } else if (typeof fitFrac === 'object') {
      const fallback = Number.isFinite(fitFrac.default) ? fitFrac.default : 1;
      const resolvedX = fitFrac.x ?? fitFrac.width ?? fitFrac.horizontal ?? fitFrac[0];
      const resolvedY = fitFrac.y ?? fitFrac.height ?? fitFrac.vertical ?? fitFrac[1];
      fracX = Number.isFinite(resolvedX) ? resolvedX : fallback;
      fracY = Number.isFinite(resolvedY) ? resolvedY : (Number.isFinite(resolvedX) ? resolvedX : fallback);
    } else {
      const scalar = Number.isFinite(fitFrac) ? fitFrac : 1;
      fracX = scalar;
      fracY = scalar;
    }

    const goalX = vw ? fracX * vw : null;
    const goalY = vh ? fracY * vh : null;

    const ratioX = goalX
      ? goalX / Math.max(halfX, 1e-6)
      : Infinity;
    const ratioY = goalY
      ? goalY / Math.max(halfY, 1e-6)
      : Infinity;

    let target = Math.min(ratioX, ratioY);
    if (!Number.isFinite(target)) {
      target = 1;
    }
    return target;
  };

  const scale = computeScale();
  if (Number.isFinite(scale) && Math.abs(scale - 1) > 1e-3) {
    for (let i = 0; i < out.length; i += 3) {
      out[i] *= scale;
      out[i + 1] *= scale;
    }
  }
}

// helper: measure how much the field fills the view (ratio against width/height caps)
function aabbRatio(out, vw, vh) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < out.length; i += 3) {
    const x = out[i], y = out[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const extX = maxX - minX, extY = maxY - minY;
  const halfX = extX * 0.5;
  const halfY = extY * 0.5;
  const ratioX = vw ? halfX / vw : 0;
  const ratioY = vh ? halfY / vh : 0;
  return Math.max(ratioX, ratioY);
}

function aabbOf(arr) {
  if (!arr || arr.length < 3) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i];
    const y = arr[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (minX === Infinity || minY === Infinity) return null;
  return { w: maxX - minX, h: maxY - minY };
}

function safeClone(value) {
  if (value == null) return null;
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }
}

function distributeParticles(total, ratios = []) {
  const normalized = Array.isArray(ratios) && ratios.length === 4
    ? ratios.slice()
    : [0.7, 0.12, 0.13, 0.05];
  const counts = normalized.map((ratio) => Math.max(0, Math.floor(total * ratio)));
  let remainder = total - counts.reduce((sum, count) => sum + count, 0);
  let index = 0;
  while (remainder > 0) {
    counts[index % counts.length] += 1;
    remainder -= 1;
    index += 1;
  }
  return counts;
}

function pickTextParticleIndices(tiers, count, rng) {
  if (!Array.isArray(tiers) || count <= 0) return [];
  const entries = tiers.map((tier, index) => ({
    tier,
    index,
    jitter: typeof rng === 'function' ? rng() : Math.random(),
  }));
  entries.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    return a.jitter - b.jitter;
  });
  return entries.slice(0, Math.min(count, entries.length)).map((entry) => entry.index);
}

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
export function __computeStarfieldMetrics(arr, hint, fitFrac = VC?.FIT_FRAC ?? 0.92) {
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
  const clampG = VC?.GAUSS_CLAMP ?? 1.0;
  const vw = (hint?.width ?? 120) * 0.5;
  const vh = (hint?.height ?? 90) * 0.5;
  const R = (VC?.STARFIELD_SCALE ?? 0.95) * vw;
  const band = makeBandFrame(VC, rnd, () => {
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
  const ratios = VC?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15];
  const tc0 = Math.floor(N * ratios[0]);
  const tc1 = Math.floor(N * ratios[1]);
  const tc2 = Math.floor(N * ratios[2]);
  const tc3 = N - (tc0 + tc1 + tc2);
  const t0y = VC.T0_SIGMA_Y_FLATTEN ?? 0.60;
  let k = 0;
  // T0: 85% band-biased
  for (let i = 0; i < tc0; i++, k++) {
    const j = 3 * k;
    const useBand = (VC?.BAND_ENABLED ?? true) && rnd() < (VC?.T0_BAND_P ?? 0.85);
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
    const useBand = (VC?.BAND_ENABLED ?? true) && rnd() < (VC?.BAND_T1_P ?? 0.85);
    const [x, y] = useBand
      ? band.sampleBand(1.0, R * 0.75, R * 0.75)
      : sampleEllipse(R * 0.75, R * 0.75);
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = 0;
  }
  // T2: clusters along band
  const cCount = VC.T2_CLUSTER_COUNT ?? 6;
  const cSigma = (VC.T2_CLUSTER_SIGMA ?? 0.09) * R;
  const clusters = Array.from({ length: cCount }, () => {
    if ((VC?.BAND_ENABLED ?? true) && rnd() < (VC?.BAND_T2_P ?? 0.95)) {
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
    const [x, y] = (VC?.BAND_ENABLED ?? true)
      ? band.sampleBand(0.6, R * 0.28, R * 0.28)
      : sampleEllipse(R * 0.28, R * 0.28);
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = 0;
  }
  // recenter + panoramic fit
  const metrics = __computeStarfieldMetrics(out, hint, VC?.FIT_FRAC ?? 0.92);
  const minView = Math.min(hint?.width ?? 120, hint?.height ?? 90);
  const currentR = Math.max(metrics.extents.w, metrics.extents.h) * 0.5;
  const targetR = (VC?.FIT_FRAC ?? 0.92) * minView;
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
      previousPositions: null,
      timers: [],
      transitionHandle: null,
      transitionUsesRAF: false,
    };
    this._climaxSteps = [];

    // HMR safety
    this._listeners = [];
    this._initialized = false;

    // Diagnostics
    this._eventLog = [];
    
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
    
    this.loadFont();
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
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
        stage: 'genesis',
        quality: this.currentQuality,
        mode: 'emergence',
        cached: false,
        skipMorphAnimation: !!payload.skipMorphAnimation,
        targetState: payload.targetState,
        fastForward: !!payload.fastForward,
        cacheKey: this._cacheKey('genesis', this.currentQuality),
      });
      
      console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
      this._log('emergence_built', { count: blueprint.particleCount });

      // Drive implosion → settle via directives; renderer remains passive
      if (!this._startEmergenceTimeline(blueprint)) {
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

    const pointSizeBase = Number.isFinite(VC?.POINT_SIZE_BASE)
      ? VC.POINT_SIZE_BASE
      : (Canonical?.features?.pointSizeDefault ?? 48);
    const sigmaBase = Number.isFinite(VC?.SIGMA_BASE) ? VC.SIGMA_BASE : 2.5;
    const sigmaPeak = Number.isFinite(VC?.SIGMA_PEAK) ? VC.SIGMA_PEAK : sigmaBase * 1.6;
    const pointKick = Number.isFinite(VC?.POINT_SIZE_KICK) && VC.POINT_SIZE_KICK > 0
      ? VC.POINT_SIZE_KICK
      : 1.4;
    const tierPeak = Number.isFinite(VC?.T4_HI_PEAK) ? VC.T4_HI_PEAK : 1.7;
    const tierSettle = Number.isFinite(VC?.T4_HI_SETTLE) ? VC.T4_HI_SETTLE : 1.5;
    const midDefault = clamp(Number.isFinite(VC?.MID_MORPH) ? VC.MID_MORPH : 0.85, 0.05, 0.95);

    const implDefault = (() => {
      const raw = Number(VC?.IMPLODE_MS);
      return Number.isFinite(raw) && raw > 0 ? raw : 1100;
    })();
    const settleDefault = (() => {
      const raw = Number(VC?.SETTLE_MS);
      return Number.isFinite(raw) && raw >= 0 ? raw : 900;
    })();

    const fastForward = !!(bp?.fastForward || bp?.metadata?.fastForward);
    const fastImpl = (() => {
      const raw = Number(VC?.SKIP_IMPL_MS);
      const target = Number.isFinite(raw) && raw > 0 ? raw : 320;
      return Math.max(120, Math.min(target, implDefault));
    })();
    const fastSettle = (() => {
      const raw = Number(VC?.SKIP_SETTLE_MS);
      const target = Number.isFinite(raw) && raw >= 0 ? raw : 260;
      return Math.max(90, Math.min(target, settleDefault));
    })();

    if (this._emergenceRaf) {
      cancel(this._emergenceRaf);
      this._emergenceRaf = null;
    }

    const holdMs = Math.max(0, Number(VC?.MORPH_HOLD_MS ?? 250));

    const runTimeline = (implMs, settleMs, midValue) => {
      this._emergenceActive = true;
      this._emergenceDone = false;

      const start = nowMs();
      const totalPhases = Math.max(0, implMs) + Math.max(0, settleMs);
      const total = holdMs + totalPhases;

      const stageLabel = this.currentStage || 'genesis';
      const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : null;
      const stageIndex = stageOrder ? stageOrder.indexOf(stageLabel) : -1;
      const emitMorphProgress = (value, target = value) => {
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
        console.log('🔬 [MORPH] Emitting MORPH_PROGRESS:', {
          payload: JSON.stringify(morphPayload, null, 2),
          keys: Object.keys(morphPayload),
          hasSchemaVersion: 'schemaVersion' in morphPayload,
          hasStage: 'stage' in morphPayload,
          hasMorphProgress: 'morphProgress' in morphPayload,
        });
        BeatBus.emit(EVENTS.MORPH_PROGRESS, morphPayload);
      };

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

        const draw = Math.max(1, Math.round(count * (inImplosion ? easeImpl : 1)));
        const pointSize = inImplosion
          ? pointSizeBase * (1 + (pointKick - 1) * easeImpl)
          : pointSizeBase * (pointKick - (pointKick - 1) * easeSettle);
        const gaussian = inImplosion
          ? sigmaBase + (sigmaPeak - sigmaBase) * easeImpl
          : sigmaPeak - (sigmaPeak - sigmaBase) * easeSettle;
        const tierHi = inImplosion
          ? tierPeak
          : tierPeak - (tierPeak - tierSettle) * easeSettle;

        const morphRounded = +morph.toFixed(3);

        BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
          morphProgress: morphRounded,
          drawCount: draw,
          activeCount: draw,
          pointSize,
          gaussianSigma: gaussian,
          tierHighlight: [1, 1, 1, tierHi],
        });
        trace('CE:DIR', {
          source: 'CE:timeline',
          morph: morphRounded,
          draw,
          pointSize,
          gaussian,
        });
        emitMorphProgress(morphRounded, inImplosion ? midValue : 1);

        if (elapsed < total) {
          this._emergenceRaf = schedule(step);
        } else {
          if (!this._emergenceActive || this._rendererFencepostSeen) {
            this._emergenceRaf = null;
            return;
          }
          BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
            morphProgress: 1,
            drawCount: count,
            activeCount: count,
            pointSize: pointSizeBase,
            gaussianSigma: sigmaBase,
            tierHighlight: [1, 1, 1, tierSettle],
            uniforms: { uChaosSpin: 0, uTrailIntensity: 0, uTrailPersistence: 0 },
          });
          trace('CE:DIR', {
            source: 'CE:timeline-final',
            morph: 1,
            draw: count,
            pointSize: pointSizeBase,
            gaussian: sigmaBase,
          });
          emitMorphProgress(1, 1);
          this._emergenceRaf = null;
          this._emergenceActive = false;
          this._emergenceDone = true;
        }
      };

      // Prime listeners with baseline state before the first frame
      emitMorphProgress(0, midValue);
      BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
        morphProgress: 0,
        drawCount: Math.max(1, Math.round(count * 0.05)),
        activeCount: Math.max(1, Math.round(count * 0.05)),
        pointSize: pointSizeBase,
        gaussianSigma: sigmaBase,
        tierHighlight: [1, 1, 1, tierPeak],
      });
      trace('CE:DIR', {
        source: 'CE:timeline-prime',
        morph: 0,
        draw: Math.max(1, Math.round(count * 0.05)),
        pointSize: pointSizeBase,
        gaussian: sigmaBase,
      });

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

    this._clearClimaxTimers();
    this._cancelClimaxTransition();

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
      { action: 'formQRCode', url: 'https://curtisworton.com', duration: 3000 },
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
    console.log('🎬 Using SST transition timings:', transitionTimings);

    this._climaxState.active = true;
    this._climaxState.currentStep = null;
    this._climaxState.previousPositions = null;
    this._climaxState.stepIndex = -1;
    this._climaxState.stepStartTime = performance.now ? performance.now() : Date.now();

    this._climaxSteps = steps;
    this._log('climax_start', { steps: steps.length });

    this._executeClimaxStep(0);
  }

  _executeClimaxStep(stepIndex) {
    if (!this._climaxState.active) return;
    if (stepIndex >= this._climaxSteps.length) {
      this._finalizeClimaxSequence();
      return;
    }

    const step = this._climaxSteps[stepIndex];
    const now = performance.now ? performance.now() : Date.now();
    this._climaxState.stepIndex = stepIndex;
    this._climaxState.currentStep = step.name;
    this._climaxState.stepStartTime = now;

    this._log('climax_step', {
      step: step.name,
      hold: step.holdDuration,
      transition: step.transitionDuration,
      index: stepIndex,
    });
    console.log(`🎬 === STEP ${stepIndex}: ${step.name} ===`);
    console.log(`   Hold: ${step.holdDuration}ms, Transition: ${step.transitionDuration}ms`);
    console.log(`   Total time: ${step.holdDuration + step.transitionDuration}ms`);
    console.log(`   Timestamp: ${now.toFixed(0)}`);

    BeatBus.emit(EVENTS.CLIMAX_STEP, {
      step: step.name,
      holdDuration: step.holdDuration,
      transitionDuration: step.transitionDuration,
      text: step.text ?? null,
      url: step.url ?? null,
      stepIndex,
      timestamp: now,
    });

    console.log(`📦 Building blueprint for ${step.name}`);
    this._buildClimaxBlueprint(step);

    console.log(`⏱️ Scheduling ${step.transitionDuration}ms transition in 50ms`);
    const transitionTimer = setTimeout(() => {
      if (!this._climaxState.active) return;
      console.log(`🎬 STARTING TRANSITION for ${step.name}`);
      this._startClimaxTransition(step.transitionDuration);
    }, 50);
    this._climaxState.timers.push(transitionTimer);

    const totalStepTime = step.holdDuration + step.transitionDuration;
    const nextTimer = setTimeout(() => {
      this._executeClimaxStep(stepIndex + 1);
    }, totalStepTime + 50);
    this._climaxState.timers.push(nextTimer);
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
          const url = String(step?.url || '');
          const SCALE_FACTOR = 2.4;

          let basePositions;
          if (CURATED_QR_POINTS instanceof Float32Array && CURATED_QR_POINTS.length) {
            basePositions = CURATED_QR_POINTS;
          } else {
            console.warn('[QR] curated asset missing; using generated fallback');
            basePositions = generateQRPositions(particleCount);
          }

          const scaled = new Float32Array(basePositions.length);
          for (let i = 0; i < basePositions.length; i += 3) {
            scaled[i] = basePositions[i] * SCALE_FACTOR;
            scaled[i + 1] = basePositions[i + 1] * SCALE_FACTOR;
            scaled[i + 2] = basePositions[i + 2] * SCALE_FACTOR;
          }

          positions = scaled;
          this._pendingQrMetadata = {
            url,
            moduleCount: CURATED_QR_META.moduleCount ?? null,
            moduleSize: CURATED_QR_META.moduleSize ?? undefined,
            quietZone: CURATED_QR_META.quietZone ?? 4,
            positions: scaled,
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
      blueprint,
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

    BeatBus.emit(EVENTS.BLUEPRINT_READY, emitPayload);
    if (isQrStep) {
      if (!this._climaxState.timers) this._climaxState.timers = [];
      const enterDelayMs = 50;
      const enterTimer = setTimeout(() => {
        if (!this._climaxState.active) return;
        BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
          source: 'climax:qr',
          enterQrMode: true,
          uPointSize: 6.0,
          timestamp: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
        });
      }, enterDelayMs);
      this._climaxState.timers.push(enterTimer);

      const exitDelay = Math.max(0, Number(step.holdDuration) || 0);
      const exitTimer = setTimeout(() => {
        if (!this._climaxState.active) return;
        BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
          source: 'climax:qr',
          exitQrMode: true,
        });
      }, enterDelayMs + exitDelay);
      this._climaxState.timers.push(exitTimer);
    }
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

  _startClimaxTransition(duration = 800) {
    if (typeof window === 'undefined') return;
    const clampedDuration = Math.max(1, Number(duration) || 800);
    this._cancelClimaxTransition();

    const hasRAF = typeof requestAnimationFrame === 'function';
    const startTime = performance.now ? performance.now() : Date.now();

    const runAnimation = () => {
      const step = () => {
        const now = performance.now ? performance.now() : Date.now();
        const raw = Math.min((now - startTime) / clampedDuration, 1);
        const eased = raw < 0.5
          ? 2 * raw * raw
          : 1 - Math.pow(-2 * raw + 2, 2) / 2;

        const directive = {
          morphProgress: eased,
          morphType: 0,
          postMorphFreeze: raw >= 1 ? 1 : 0,
        };

        if (this._climaxState.stepIndex === 0) {
          console.log(`📤 ENGINE EMITTING: morphProgress=${(eased * 100).toFixed(1)}%`);
        }

        BeatBus.emit(EVENTS.RENDER_DIRECTIVE, directive);
        if (raw >= 1) {
          this._climaxState.transitionHandle = null;
          this._climaxState.transitionUsesRAF = false;
          return;
        }

        if (hasRAF) {
          this._climaxState.transitionUsesRAF = true;
          this._climaxState.transitionHandle = requestAnimationFrame(step);
        } else {
          this._climaxState.transitionUsesRAF = false;
          this._climaxState.transitionHandle = setTimeout(step, 16);
        }
      };

      if (hasRAF) {
        this._climaxState.transitionUsesRAF = true;
        this._climaxState.transitionHandle = requestAnimationFrame(step);
      } else {
        this._climaxState.transitionUsesRAF = false;
        this._climaxState.transitionHandle = setTimeout(step, 16);
      }
    };

    runAnimation();
  }

  _clearClimaxTimers() {
    if (!this._climaxState?.timers) return;
    this._climaxState.timers.forEach((id) => {
      if (id != null) clearTimeout(id);
    });
    this._climaxState.timers.length = 0;
  }

  _cancelClimaxTransition() {
    const state = this._climaxState;
    if (!state || state.transitionHandle == null) return;
    if (state.transitionUsesRAF && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(state.transitionHandle);
    } else {
      clearTimeout(state.transitionHandle);
    }
    state.transitionHandle = null;
    state.transitionUsesRAF = false;
  }

  _finalizeClimaxSequence() {
    this._clearClimaxTimers();
    this._cancelClimaxTransition();

    this._climaxState.active = false;
    this._climaxState.currentStep = null;
    this._climaxState.stepIndex = -1;
    this._climaxState.stepStartTime = 0;
    this._climaxState.previousPositions = null;

    this._log('climax_complete');
    console.log('🎬 Climax sequence complete');
    BeatBus.emit(EVENTS.CLIMAX_STEP, { step: 'complete', timestamp: performance.now ? performance.now() : Date.now() });
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
    const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
    const allocateVec3 = () => new Float32Array(safeCount * 3);
    const blueprint = {
      stageName: 'genesis',
      mode,
      quality,
      particleCount: safeCount,
      maxParticles: safeCount,
      activeCount: safeCount,
      atmosphericPositions: allocateVec3(),
      text3DPositions: allocateVec3(),
      positions: allocateVec3(),
      animationSeeds: allocateVec3(),
      sizeMultipliers: new Float32Array(safeCount),
      opacityData: new Float32Array(safeCount),
      atlasIndices: new Float32Array(safeCount),
      tierOf: new Uint8Array(safeCount),
      tierData: new Float32Array(safeCount),
      metadata: { mode, quality },
    };

    if (safeCount > 0) {
      const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
      for (let i = 0; i < safeCount; i++) {
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
    const out = new Float32Array(count * 3);
    const width = viewportHint?.width ?? viewportHint?.w ?? 16;
    const height = viewportHint?.height ?? viewportHint?.h ?? 9;
    const base = Math.max(1.0, Math.min(width, height));
    const R = base * 0.45;

    const rnd = Math.random;
    const gauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(-1.2, Math.min(1.2, g));
    };

    const useBand = opts.band ?? (VC?.ATMO_USE_BAND ?? true);
    if (useBand) {
      const rx = R;
      const ry = R * (VC.T0_SIGMA_Y_FLATTEN ?? 0.60);
      const zMin = -VC.Z_BACK_MAX;
      const zMax = -VC.Z_BACK_MIN;
      const band = makeBandFrame(VC, rnd, gauss);
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        const [x, y] = band.sampleBand(1.0, rx, ry);
        out[j + 0] = x;
        out[j + 1] = y;
        out[j + 2] = zMin + rnd() * (zMax - zMin);
      }
      return out;
    }

    for (let i = 0; i < count; i++) {
      const j = i * 3;
      out[j + 0] = gauss() * R;
      out[j + 1] = gauss() * R;
      out[j + 2] = gauss() * (R * 0.6);
    }
    return out;
  }

  /**
   * Given ratios and particle count, compute per-tier counts and a shuffled tier map.
   * Returns { counts:[c0,c1,c2,c3], tiers:Uint8Array(count) }
   */
  _assignTiersShuffled(count, ratios) {
    const counts = [0, 0, 0, 0];
    counts[0] = Math.floor(count * ratios[0]);
    counts[1] = Math.floor(count * ratios[1]);
    counts[2] = Math.floor(count * ratios[2]);
    counts[3] = Math.max(0, count - (counts[0] + counts[1] + counts[2]));

    const labels = new Uint8Array(count);
    let idx = 0;
    for (let t = 0; t < 4; t++) {
      const n = counts[t];
      for (let k = 0; k < n; k++) labels[idx++] = t;
    }
    for (let i = count - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = labels[i];
      labels[i] = labels[j];
      labels[j] = tmp;
    }
    return { counts, tiers: labels };
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

    const blueprint = this._createEmptyBlueprint(count, { mode, quality });
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
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i];
          const y = arr[i + 1];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        return { w: +(maxX - minX).toFixed(2), h: +(maxY - minY).toFixed(2) };
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
    blueprint.fastForward = forwardFlag;
    if (skipMorphAnimation) blueprint.skipMorphAnimation = true;
    if (targetState) blueprint.targetState = targetState;

    trace('CE:EMIT', {
      mode,
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
            BeatBus.emit(EVENTS.BLUEPRINT_READY, {
              blueprint,
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
        BeatBus.emit(EVENTS.BLUEPRINT_READY, {
          blueprint,
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
      BeatBus.emit(EVENTS.BLUEPRINT_READY, {
        blueprint,
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
    const stageConfig = Canonical?.stages?.[stageName] || {};
    if (!stageConfig) {
      console.error(`Stage ${stageName} not found`);
      return null;
    }

    console.log('🔬 [BLUEPRINT] Starting position generation for stage:', stageName);
    console.log('🔬 [BLUEPRINT] Input SST data:', {
      particlesBase: SST?.stages?.[stageName]?.particlesBase,
      hasLetterGeometry: !!SST?.visual?.letterGeometry?.[stageName],
    });

    const stageParticleCounts = SST?.performance?.particleCount ?? {};
    const quality = requestedQuality || options.quality || this.currentQuality;
    const baseParticleCount = stageConfig.particleCount || stageParticleCounts[stageName] || 5000;
    const particleCount = options.overrideCount || this.getParticleCountForQuality(baseParticleCount, quality);

    console.log(`🧠 Building ${stageName}: ${particleCount} particles`);

    const fallbackWord = SST?.visual?.stageWords?.[stageName];
    const typographyDef = Canonical?.visual?.letterGeometry?.[stageName] || {};
    const typography = {
      word:
        (typeof typographyDef.word === 'string' && typographyDef.word) ||
        (typeof fallbackWord === 'string' && fallbackWord) ||
        stageName.toUpperCase(),
      font: typographyDef.font || null,
      depth: Number(typographyDef.depth) || 0.3,
      spacing: Number(typographyDef.spacing) || 1,
      scale: Number(typographyDef.scale) || 1,
      particlesPerLetter: Number(typographyDef.particlesPerLetter) || null,
    };

    if (typography.font) {
      this._ensureFontForStage(stageName, typography.font);
    }

    const glyphLetterCount = typography.word.replace(/\s+/g, '').length || typography.word.length || 1;
    const desiredTextParticles = typography.particlesPerLetter
      ? Math.min(
          particleCount,
          Math.max(1, Math.round(typography.particlesPerLetter * glyphLetterCount))
        )
      : Math.min(particleCount, Math.max(1, Math.round(particleCount * 0.55)));

    const tierMix =
      Array.isArray(stageConfig?.tierMix) && stageConfig.tierMix.length === 4
        ? stageConfig.tierMix.slice(0, 4)
        : Array.isArray(VC?.TIER_RATIOS)
        ? VC.TIER_RATIOS.slice(0, 4)
        : [0.7, 0.12, 0.13, 0.05];
    const tierCounts = distributeParticles(particleCount, tierMix);
    const tierAssignments = new Array(particleCount);
    let tierCursor = 0;
    for (let tier = 0; tier < tierCounts.length; tier++) {
      const count = tierCounts[tier];
      for (let n = 0; n < count && tierCursor < particleCount; n += 1, tierCursor += 1) {
        tierAssignments[tierCursor] = tier;
      }
    }
    while (tierCursor < particleCount) {
      tierAssignments[tierCursor++] = tierCounts.length - 1;
    }
    const tierShuffleRandom = createSeededRandom(`${stageName}|tierShuffle`);
    for (let i = tierAssignments.length - 1; i > 0; i--) {
      const swapIndex = Math.floor(tierShuffleRandom() * (i + 1));
      [tierAssignments[i], tierAssignments[swapIndex]] = [tierAssignments[swapIndex], tierAssignments[i]];
    }

    const positions = new Float32Array(particleCount * 3);
    const atmosphericPositions = new Float32Array(particleCount * 3);
    const text3DPositions = new Float32Array(particleCount * 3);
    const animationSeeds = new Float32Array(particleCount * 3);
    const sizeMultipliers = new Float32Array(particleCount);
    const opacityData = new Float32Array(particleCount);
    const atlasIndices = new Float32Array(particleCount);
    const tierData = new Float32Array(particleCount);

    const rng = createSeededRandom(`${stageName}|scatter`);
    const tierSpread = [
      { x: 120, y: 90, z: 40 },
      { x: 95, y: 70, z: 32 },
      { x: 72, y: 56, z: 28 },
      { x: 48, y: 38, z: 22 },
    ];
    const sizeBase = [0.55, 0.75, 1.05, 1.35];
    const opacityRanges = [
      [0.32, 0.6],
      [0.45, 0.78],
      [0.6, 0.9],
      [0.7, 1.0],
    ];

    for (let i = 0; i < particleCount; i += 1) {
      const tier = tierAssignments[i];
      const spread = tierSpread[tier] || tierSpread[0];
      const baseIndex = i * 3;

      const ax = (rng() - 0.5) * spread.x;
      const ay = (rng() - 0.5) * spread.y;
      const az = (rng() - 0.5) * spread.z;

      atmosphericPositions[baseIndex] = ax;
      atmosphericPositions[baseIndex + 1] = ay;
      atmosphericPositions[baseIndex + 2] = az;

      positions[baseIndex] = ax;
      positions[baseIndex + 1] = ay;
      positions[baseIndex + 2] = az;

      text3DPositions[baseIndex] = ax;
      text3DPositions[baseIndex + 1] = ay;
      text3DPositions[baseIndex + 2] = az;

      animationSeeds[baseIndex] = rng();
      animationSeeds[baseIndex + 1] = rng();
      animationSeeds[baseIndex + 2] = rng();

      const sizeScalar = sizeBase[tier] || sizeBase[0];
      sizeMultipliers[i] = sizeScalar * (0.85 + rng() * 0.3);

      const [opacityMin, opacityMax] = opacityRanges[tier] || opacityRanges[0];
      opacityData[i] = opacityMin + rng() * (opacityMax - opacityMin);

      atlasIndices[i] = Math.min(15, Math.floor(rng() * 4) + tier * 4);
      tierData[i] = tier;
    }

    const textFormation = this.generate3DTextFormation(typography.word, {
      particles: desiredTextParticles,
      depth: typography.depth,
      letterSpacing: typography.spacing,
      scale: typography.scale,
      fontKey: typography.font,
      stage: stageName,
      viewportHint: this._viewportHint,
    });

    let assignedTextParticles = 0;
    if (textFormation && textFormation.length >= 3) {
      const textSelectRandom = createSeededRandom(`${stageName}|textSelect`);
      const assignableCount = Math.min(desiredTextParticles, Math.floor(textFormation.length / 3));
      const selectedIndices = pickTextParticleIndices(tierAssignments, assignableCount, textSelectRandom);

      assignedTextParticles = selectedIndices.length;
      for (let idx = 0; idx < selectedIndices.length; idx += 1) {
        const particleIndex = selectedIndices[idx];
        const src = idx * 3;
        if (src + 2 >= textFormation.length) break;
        const baseIndex = particleIndex * 3;
        text3DPositions[baseIndex] = textFormation[src];
        text3DPositions[baseIndex + 1] = textFormation[src + 1];
        text3DPositions[baseIndex + 2] = textFormation[src + 2];
      }
    }

    const metadata = {
      quality,
      buildTime: performance.now(),
      stage: stageName,
      tierMix,
      tierCounts,
      motionBehaviors: safeClone(stageConfig.motionBehaviors) || null,
      typography: {
        ...typography,
        assignedTextParticles,
      },
      camera: {
        stage: safeClone(stageConfig.camera) || null,
        visual: safeClone(Canonical?.visual?.camera?.[stageName]) || null,
      },
    };
    const genesisPalette =
      stageName === 'genesis' &&
      Array.isArray(VC?.GENESIS_PALETTE) &&
      VC.GENESIS_PALETTE.length >= 3
        ? VC.GENESIS_PALETTE.slice(0, 3)
        : null;
    if (genesisPalette) {
      metadata.colors = genesisPalette;
    } else if (Array.isArray(stageConfig?.colors) && stageConfig.colors.length >= 3) {
      metadata.colors = stageConfig.colors.slice(0, 3);
    }

    const vw = (this._viewportHint.width ?? 120) * 0.5;
    const vh = (this._viewportHint.height ?? 90) * 0.5;
    const fitDefault = Number.isFinite(VC?.FIT_FRAC) ? VC.FIT_FRAC : 0.92;
    const fitTarget = {
      x: Number.isFinite(VC?.FIT_FRAC_X) ? VC.FIT_FRAC_X : 0.9,
      y: Number.isFinite(VC?.FIT_FRAC_Y) ? VC.FIT_FRAC_Y : 0.8,
      default: fitDefault,
    };
    fitToViewXY(text3DPositions, vw, vh, fitTarget);
    fitToViewXY(atmosphericPositions, vw, vh, fitTarget);
    fitToViewXY(positions, vw, vh, fitTarget);

    if (import.meta?.env?.DEV) {
      const aabbExtents = (arr) => {
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i];
          const y = arr[i + 1];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        return { w: +(maxX - minX).toFixed(2), h: +(maxY - minY).toFixed(2) };
      };
      console.debug('[CE] AABB stage build', stageName,
        { text: aabbExtents(text3DPositions) },
        { atm: aabbExtents(atmosphericPositions) },
        { vw: +vw.toFixed(2), vh: +vh.toFixed(2) }
      );
    }

    console.log('🔬 [BLUEPRINT] Position array result:', {
      type: positions?.constructor?.name,
      length: positions?.length,
      sample: positions ? Array.from(positions.slice(0, 6)) : 'UNDEFINED',
      isFloat32Array: positions instanceof Float32Array,
    });

    const blueprint = {
      stageName,
      particleCount,
      maxParticles: particleCount,
      activeCount: particleCount,
      positions,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata,
    };

    try {
      const hotspotLookup = buildHotspotLookup({
        stageName,
        text3DPositions,
      });
      blueprint.hotspotLookup = hotspotLookup;
      blueprint.hotspotMap = hotspotLookup?.indicesByHotspot || {};
      const hotspotIds = Object.keys(blueprint.hotspotMap || {});
      if (hotspotIds.length > 0) {
        console.log(`🗺 Blueprint for ${stageName}: hotspot map attached`, hotspotIds);
      }
    } catch (error) {
      console.error(`[Engine] Hotspot mapping failed for ${stageName}:`, error);
      blueprint.hotspotLookup = null;
      blueprint.hotspotMap = {};
    }

    return blueprint;
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
    const { width = 120, height = 90 } = hint || this._viewportHint;
    const out = new Float32Array(N * 3);

    const vw = width * 0.5;
    const vh = height * 0.5;
    const R = (VC?.STARFIELD_SCALE ?? 0.95) * vw;
    const AT = VC?.ATMO_SCALE ?? 1.0;
    const rx = R * AT;
    const ry = R * AT * (VC.T0_SIGMA_Y_FLATTEN ?? 0.60);
    const zMin = -VC.Z_BACK_MAX;
    const zMax = -VC.Z_BACK_MIN;

    const rnd = Math.random;
    const gauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      const g = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(-1.2, Math.min(1.2, g));
    };

    if (VC?.ATMO_USE_BAND) {
      const band = makeBandFrame(VC, rnd, gauss);
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

  generateConstellationFormation(N, tierRatios = VC?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15], hint, opts = {}) {
    // Starfield (not rings): viewport-scaled, 4 tiers with different spreads/cluster behavior.
    const out = new Float32Array(N * 3);
    const rnd = createSeededRandom('starfield');
    // tier counts
    const tc0 = Math.floor(N * tierRatios[0]);
    const tc1 = Math.floor(N * tierRatios[1]);
    const tc2 = Math.floor(N * tierRatios[2]);
    const tc3 = N - (tc0 + tc1 + tc2);
    
    // viewport-based radius - use WIDTH for panoramic band
    const vw = (hint?.width ?? this._viewportHint.width) * 0.5;
    const vh = (hint?.height ?? this._viewportHint.height) * 0.5;
    // Use viewport width for horizontal panoramic effect
    const R = (VC?.STARFIELD_SCALE ?? 0.95) * vw;
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
    const clampToCaps = opts.clampToViewCaps !== false;
    const bandEnabled = opts.band ?? (VC?.BAND_ENABLED ?? true);
    const band = bandEnabled ? makeBandFrame(VC, rnd, gauss) : null;
    const bandHeight = Math.max(1, R * (VC?.BAND_FADE_WIDTH ?? 0.35));
    const t0BandShare = Math.min(1, Math.max(0, VC?.T0_BAND_P ?? 0.3));
    const scatterWidth = vw * 2.2;
    const scatterHeight = vh * 2.2;
    const t0BaseZ = VC.T0_Z_JITTER ?? 4;
    const t0ScatterZ = t0BaseZ * 1.5;

    const t2Total = tc2;
    const desiredCoreSeeds = Math.max(12, Math.floor(N * 0.04));
    const t2CoreSeeds = Math.min(t2Total, Math.min(120, desiredCoreSeeds));
    const t2ClusterCount = Math.max(0, t2Total - t2CoreSeeds);

    let k = 0;
    const emit = (x, y, z) => {
      const j = 3 * k++;
      out[j] = x;
      out[j + 1] = y;
      out[j + 2] = z;
    };

    // Tier 0 — mix of background stars and band followers
    const t0BandCount = bandEnabled ? Math.floor(tc0 * t0BandShare) : 0;
    const t0ScatterCount = tc0 - t0BandCount;
    for (let i = 0; i < t0BandCount; i++) {
      const [bx, by] = band?.sampleBand(1.2, R, bandHeight * 0.9) ?? sampleEllipse(R, bandHeight * 0.9);
      emit(bx, by, gauss() * t0BaseZ);
    }
    for (let i = 0; i < t0ScatterCount; i++) {
      const x = (rnd() - 0.5) * scatterWidth;
      const y = (rnd() - 0.5) * scatterHeight;
      emit(x, y, gauss() * t0ScatterZ);
    }

    // Tier 1 — tightly bound to the band midline
    for (let i = 0; i < tc1; i++) {
      const useBand = bandEnabled && band && rnd() < (VC?.BAND_T1_P ?? 0.85);
      const [x, y] = useBand
        ? band.sampleBand(0.8, R * 0.55, bandHeight * 0.4)
        : sampleEllipse(R * 0.55, bandHeight * 0.4);
      emit(x, y, (rnd() - 0.5) * (VC.T1_Z_JITTER ?? 3));
    }

    // Tier 2 — dense clusters hugging band center
    const cCount = Math.max(1, VC.T2_CLUSTER_COUNT ?? 3);
    const cSigma = Math.max(1e-3, (VC.T2_CLUSTER_SIGMA ?? 0.04) * R);
    const clusters = Array.from({ length: cCount }, () => {
      if (bandEnabled && band && rnd() < (VC?.BAND_T2_P ?? 0.95)) {
        const [bx, by] = band.sampleBand(0.5, R * 0.3, bandHeight * 0.18);
        return { cx: bx, cy: by };
      }
      const [cx, cy] = sampleEllipse(R * 0.3, bandHeight * 0.18);
      return { cx, cy };
    });

    // Pre-seed a bright galactic core before building clusters
    for (let i = 0; i < t2CoreSeeds; i++) {
      const radius = Math.abs(gauss()) * R * 0.08;
      const angle = rnd() * Math.PI * 2;
      const coreX = Math.cos(angle) * radius * 0.85;
      const coreY = Math.sin(angle) * radius * 0.35;
      emit(coreX, coreY, gauss() * 0.5);
    }
    
    for (let i = 0; i < t2ClusterCount; i++) {
      const c = clusters[Math.floor(rnd() * clusters.length)];
      const x = c.cx + gauss() * cSigma * 0.5;
      const y = c.cy + gauss() * cSigma * 0.35;
      emit(x, y, (rnd() - 0.5) * (VC.T2_Z_JITTER ?? 2));
    }
    // Tier 3 — anchors clustered tightly around the band core
    if (tc3 > 0 && (VC.USE_T3_TEXT ?? true) && this.font) {
      const tierWord = (typeof VC?.T3_TEXT === 'string' && VC.T3_TEXT.trim())
        ? VC.T3_TEXT.trim()
        : (Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS');
      const pts = this.generate3DTextFormation(tierWord, { particles: tc3 });
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
      const sx = (VC.T3_TEXT_SCALE ?? 0.70) * (R * 0.4) / Math.max(1, (maxX - minX) * 0.5);
      const sy = (VC.T3_TEXT_SCALE ?? 0.70) * (bandHeight * 0.35) / Math.max(1, (maxY - minY) * 0.5);
      for (let i = 0; i < tc3; i++) {
        const s = (i % (pts.length / 3)) * 3;
        const x = pts[s] * sx;
        const y = pts[s + 1] * sy;
        emit(x, y, (rnd() - 0.5) * (VC.T3_Z_JITTER ?? 0.5));
      }
    } else {
      for (let i = 0; i < tc3; i++) {
        const [x, y] = bandEnabled && band
          ? band.sampleBand(0.45, R * 0.16, bandHeight * 0.16)
          : sampleEllipse(R * 0.16, bandHeight * 0.16);
        emit(x, y, (rnd() - 0.5) * (VC.T3_Z_JITTER ?? 0.5));
      }
    }

    // === recenter to centroid (pre-fit) -- avoids "corner dead space" ===
    let cx = 0;
    let cy = 0;
    const n = out.length / 3 || 1;
    for (let i = 0; i < out.length; i += 3) {
      cx += out[i];
      cy += out[i + 1];
    }
    cx /= n;
    cy /= n;
    if (cx || cy) {
      for (let i = 0; i < out.length; i += 3) {
        out[i] -= cx;
        out[i + 1] -= cy;
      }
    }

    // fit panoramic bounds so post-generation spread lands within viewport target
    const fitFrac = VC?.FIT_FRAC ?? 0.92;
    if (fitFrac > 0) {
      const vwFit = (hint?.width ?? this._viewportHint.width) * 0.5;
      const vhFit = (hint?.height ?? this._viewportHint.height) * 0.5;
      const rxLimit = clampToCaps && Number.isFinite(VC.VIEW_CAP_HALF_W)
        ? Math.min(vwFit, VC.VIEW_CAP_HALF_W)
        : vwFit;
      const ryLimit = clampToCaps && Number.isFinite(VC.VIEW_CAP_HALF_H)
        ? Math.min(vhFit, VC.VIEW_CAP_HALF_H)
        : vhFit;
      const rxFit = rxLimit * fitFrac;
      const ryFit = ryLimit * fitFrac;
      let maxDX = 0;
      let maxDY = 0;
      for (let i = 0; i < out.length; i += 3) {
        const ax = Math.abs(out[i]);
        const ay = Math.abs(out[i + 1]);
        if (ax > maxDX) maxDX = ax;
        if (ay > maxDY) maxDY = ay;
      }
      const sx = maxDX ? rxFit / maxDX : 1;
      const sy = maxDY ? ryFit / maxDY : 1;
      const scale = Math.min(sx, sy);
      if (scale > 0 && scale !== 1) {
        for (let i = 0; i < out.length; i += 3) {
          out[i] *= scale;
          out[i + 1] *= scale;
        }
      }
    }
    return out;
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

      const mesh = new Mesh(geometry);
      const sampler = new MeshSurfaceSampler(mesh).build();
      const out = new Float32Array(particles * 3);
      const scratch = new Vector3();
      const normal = new Vector3();

      const baseDepth = depth ?? 0.3;
      const thickness = Math.max(0.002, baseDepth * 0.25);
      const tangentJitter = thickness * 0.4;

      const oversampleFactor = Math.min(6, Math.max(2, Math.ceil(particles <= 1200 ? 4 : 3)));
      const maxCandidates = Math.max(particles, particles * oversampleFactor);
      const candidates = new Float32Array(maxCandidates * 3);
      const candidateWeight = new Float32Array(maxCandidates);

      let filled = 0;
      const maxAttempts = maxCandidates * 12;

      for (let attempt = 0; attempt < maxAttempts && filled < maxCandidates; attempt++) {
        sampler.sample(scratch, normal);

        const absNz = Math.abs(normal.z);
        if (absNz < 0.35 && attempt < maxCandidates * 4) {
          if (Math.random() < 0.7) continue;
        }

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * tangentJitter;
        scratch.x += Math.cos(angle) * radius;
        scratch.y += Math.sin(angle) * radius;

        const jitter = (Math.random() - 0.5) * thickness;
        scratch.z = jitter;

        const offset = filled * 3;
        candidates[offset] = scratch.x;
        candidates[offset + 1] = scratch.y;
        candidates[offset + 2] = scratch.z;
        candidateWeight[filled] = absNz;
        filled++;
      }

    if (filled < particles) {
      for (let i = 0; i < particles; i++) {
        sampler.sample(scratch);
        const offset = i * 3;
        out[offset] = scratch.x;
        out[offset + 1] = scratch.y;
        out[offset + 2] = scratch.z + (Math.random() - 0.5) * thickness;
      }

      if (depth && depth !== 1) {
        for (let i = 2; i < out.length; i += 3) {
          out[i] *= depth;
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
    }

    const candidateIndices = [];
    for (let i = 0; i < filled; i++) candidateIndices.push(i);

    let selectedCount = 0;
    const attemptsPerPick = Math.min(12, Math.max(4, Math.ceil(candidateIndices.length / 400)));

    while (selectedCount < particles && candidateIndices.length) {
      let bestListIndex = 0;
      let bestScore = -Infinity;
      const tries = Math.min(attemptsPerPick, candidateIndices.length);

      for (let t = 0; t < tries; t++) {
        const listIndex = Math.floor(Math.random() * candidateIndices.length);
        const candidateIndex = candidateIndices[listIndex];
        const cx = candidates[candidateIndex * 3];
        const cy = candidates[candidateIndex * 3 + 1];
        const cz = candidates[candidateIndex * 3 + 2];

        let minDistSq = Infinity;
        for (let s = 0; s < selectedCount; s++) {
          const sx = out[s * 3];
          const sy = out[s * 3 + 1];
          const dx = cx - sx;
          const dy = cy - sy;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            if (minDistSq <= bestScore) break;
          }
        }

        if (selectedCount === 0) {
          minDistSq = Infinity;
        } else {
          const weight = 0.25 + candidateWeight[candidateIndex] * 0.75;
          minDistSq *= weight;
        }

        if (minDistSq > bestScore) {
          bestScore = minDistSq;
          bestListIndex = listIndex;
        }
      }

      const chosenIndex = candidateIndices[bestListIndex];
      const dest = selectedCount * 3;
      out[dest] = candidates[chosenIndex * 3];
      out[dest + 1] = candidates[chosenIndex * 3 + 1];
      out[dest + 2] = candidates[chosenIndex * 3 + 2];
      selectedCount++;

      const last = candidateIndices.length - 1;
      candidateIndices[bestListIndex] = candidateIndices[last];
      candidateIndices.pop();
    }

    if (selectedCount < particles && candidateIndices.length) {
      for (let i = selectedCount; i < particles; i++) {
        const fallbackIndex = candidateIndices[i % candidateIndices.length];
        const dest = i * 3;
        out[dest] = candidates[fallbackIndex * 3];
        out[dest + 1] = candidates[fallbackIndex * 3 + 1];
        out[dest + 2] = candidates[fallbackIndex * 3 + 2];
      }
      selectedCount = particles;
    } else if (selectedCount < particles) {
      for (let i = selectedCount; i < particles; i++) {
        sampler.sample(scratch);
        const dest = i * 3;
        out[dest] = scratch.x;
        out[dest + 1] = scratch.y;
        out[dest + 2] = scratch.z + (Math.random() - 0.5) * thickness;
      }
      selectedCount = particles;
    }

    if (depth && depth !== 1) {
      for (let i = 2; i < out.length; i += 3) {
        out[i] *= depth;
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
      guardInvalidations: this._guardInvalidations.slice(-10),
      lastEvents: this._eventLog.slice(-20),
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
    this._clearClimaxTimers();
    this._cancelClimaxTransition();
    if (this._climaxState) {
      this._climaxState.active = false;
      this._climaxState.currentStep = null;
      this._climaxState.previousPositions = null;
      this._climaxState.stepIndex = -1;
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
