// src/engine/ConsciousnessEngine.js
// Canon-compliant production version with HMR safety, validation, and efficiency

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { VC } from '@/config/visual-controls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { createSeededRandom } from '../utils/random.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

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
  const clampOnce = () => {
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
    const goalX = vw ? fitFrac * vw : null;
    const goalY = vh ? fitFrac * vh : null;
    let scale = 1;
    if (goalX && halfX > goalX) scale = Math.min(scale, goalX / halfX);
    if (goalY && halfY > goalY) scale = Math.min(scale, goalY / halfY);
    if (scale < 1 && scale > 0 && Number.isFinite(scale)) {
      for (let i = 0; i < out.length; i += 3) {
        out[i] *= scale;
        out[i + 1] *= scale;
      }
      return true;
    }
    return false;
  };
  if (clampOnce()) clampOnce();
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
    // Clear stale emergence targets so prewarm rebuilds with current VC tuning
    this._lastEmergenceTargets = null;
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
        // settle: draw everything & reset sizes (prevents stale partial draw ranges)
        BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
          morphProgress: 1,
          // guarantee full draw; renderer will set geometry drawRange to match
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
      tierRatios = undefined,
      viewportHint = this._viewportHint,
      quality = 'HIGH',
    } = payload;

    console.log(`🌟 Building emergence via canonical blueprint: ${source} → ${target} with ${count} particles`);

    const blueprint = this.buildBlueprint('genesis', {
      quality,
      overrideCount: count,
    });

    if (!blueprint) return null;

    const fallbackRatios = VC?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15];
    const sourceRatios = Array.isArray(tierRatios) && tierRatios.length === fallbackRatios.length
      ? tierRatios
      : fallbackRatios;
    const sanitizedRatios = (() => {
      const cleaned = sourceRatios.map((value) => (Number.isFinite(value) && value >= 0 ? value : 0));
      const total = cleaned.reduce((sum, value) => sum + value, 0);
      if (total <= 0) return fallbackRatios;
      return cleaned.map((value) => value / total);
    })();

    const tierCounts = sanitizedRatios.map(r => Math.floor(count * r));
    tierCounts[tierCounts.length - 1] += count - tierCounts.reduce((a, b) => a + b, 0);

    // Build constellation field using tuned VC distribution so emergence matches target look
    const starfield = this.generateConstellationFormation(count, sanitizedRatios, viewportHint);
    if (starfield && starfield.length === blueprint.text3DPositions.length) {
      blueprint.text3DPositions.set(starfield);
      blueprint.atmosphericPositions.set(starfield);
    } else {
      console.warn('🧠 Engine: Starfield generation mismatch', {
        expected: blueprint.text3DPositions.length,
        received: starfield?.length ?? 0,
      });
    }

    // Align tier data with the generated distribution (shader accents depend on tier ids)
    if (blueprint.tierData?.length === count) {
      let cursor = 0;
      for (let tier = 0; tier < tierCounts.length; tier++) {
        const quota = tierCounts[tier];
        const end = Math.min(count, cursor + quota);
        for (let i = cursor; i < end; i++) {
          blueprint.tierData[i] = tier;
        }
        cursor = end;
      }
      // If rounding left residual slots, assign them to highest tier to keep ids bounded
      for (let i = cursor; i < count; i++) {
        blueprint.tierData[i] = tierCounts.length - 1;
      }
    }

    const vw = (viewportHint?.width ?? this._viewportHint.width ?? 120) * 0.5;
    const vh = (viewportHint?.height ?? this._viewportHint.height ?? 90) * 0.5;
    const fitFrac = VC?.FIT_FRAC ?? 0.92;
    fitToViewXY(blueprint.text3DPositions, vw, vh, fitFrac);
    fitToViewXY(blueprint.atmosphericPositions, vw, vh, fitFrac);

    blueprint.mode = mode;
    blueprint.metadata = {
      ...(blueprint.metadata || {}),
      source,
      target,
      viewport: viewportHint,
      tierRatios: sanitizedRatios,
      tierCounts,
    };

    return blueprint;
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
      console.log('🧠 Engine: Building post-emergence genesis (preserving band)');

      // Build genesis with SAME count as emergence
      const emergenceCount = this._lastEmergenceTargets.length / 3;
      blueprint = this.buildBlueprint(stage, {
        quality,
        overrideCount: emergenceCount,
      });
      
      if (blueprint) {
        // 1) Copy the settled emergence band into BOTH arrays (Genesis shows that band)
        const targets = this._lastEmergenceTargets;
        blueprint.atmosphericPositions.set(targets);
        blueprint.text3DPositions.set(targets);

        // 2) Only fit if it would overflow the frustum (e.g., after a camera change),
        //    or if VC explicitly forces a final fit.
        const vw = (this._viewportHint.width ?? 120) * 0.5;
        const vh = (this._viewportHint.height ?? 90) * 0.5;
        const fitFrac = (VC?.FIT_FRAC ?? 0.86);
        const forceFit = !!VC?.FINAL_FIT_GENESIS;
        const ratioNow = aabbRatio(blueprint.text3DPositions, vw, vh);

        if (forceFit || ratioNow > fitFrac * 1.05) {
          console.log('🧠 Engine: Overflow guard triggered (ratio:', ratioNow.toFixed(2), ')');
          fitToViewXY(blueprint.text3DPositions, vw, vh, fitFrac);
          fitToViewXY(blueprint.atmosphericPositions, vw, vh, fitFrac);
        } else {
          console.log('🧠 Engine: Band within bounds, preserving emergence positions');
        }

        // Consume targets once
        this._lastEmergenceTargets = null;

        // Validate and emit
        if (this._validateBlueprint(blueprint)) {
          BeatBus.emit(EVENTS.BLUEPRINT_READY, {
            blueprint,
            stage,
            quality,
            mode: 'post-emergence-guarded',
          });
          this._log('blueprint_emitted', { stage, quality, mode: 'post-emergence-guarded' });
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
    const particleCount = options.overrideCount
      || this.getParticleCountForQuality(baseParticleCount, quality);

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

    const metadata = {
      quality,
      buildTime: performance.now(),
    };
    const genesisPalette = (stageName === 'genesis'
      && Array.isArray(VC?.GENESIS_PALETTE)
      && VC.GENESIS_PALETTE.length >= 3)
      ? VC.GENESIS_PALETTE.slice(0, 3)
      : null;
    if (genesisPalette) {
      metadata.colors = genesisPalette;
    } else if (Array.isArray(stageConfig?.colors) && stageConfig.colors.length >= 3) {
      metadata.colors = stageConfig.colors.slice(0, 3);
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
      metadata,
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

  generateConstellationFormation(N, tierRatios = VC?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15], hint) {
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
    const band = makeBandFrame(VC, rnd, gauss);
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
    const t0BandCount = Math.floor(tc0 * t0BandShare);
    const t0ScatterCount = tc0 - t0BandCount;
    for (let i = 0; i < t0BandCount; i++) {
      const [bx, by] = band.sampleBand(1.2, R, bandHeight * 0.9);
      emit(bx, by, gauss() * t0BaseZ);
    }
    for (let i = 0; i < t0ScatterCount; i++) {
      const x = (rnd() - 0.5) * scatterWidth;
      const y = (rnd() - 0.5) * scatterHeight;
      emit(x, y, gauss() * t0ScatterZ);
    }

    // Tier 1 — tightly bound to the band midline
    for (let i = 0; i < tc1; i++) {
      const [x, y] = band.sampleBand(0.8, R * 0.55, bandHeight * 0.4);
      emit(x, y, (rnd() - 0.5) * (VC.T1_Z_JITTER ?? 3));
    }

    // Tier 2 — dense clusters hugging band center
    const cCount = Math.max(1, VC.T2_CLUSTER_COUNT ?? 3);
    const cSigma = Math.max(1e-3, (VC.T2_CLUSTER_SIGMA ?? 0.04) * R);
    const clusters = Array.from({ length: cCount }, () => {
      const [bx, by] = band.sampleBand(0.5, R * 0.3, bandHeight * 0.18);
      return { cx: bx, cy: by };
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
      const pts = this.generate3DTextFormation(VC.T3_TEXT || 'HELLO CURTIS', tc3);
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
        const [x, y] = band.sampleBand(0.45, R * 0.16, bandHeight * 0.16);
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
      const rxFit = Math.min(vwFit, VC.VIEW_CAP_HALF_W) * fitFrac;
      const ryFit = Math.min(vhFit, VC.VIEW_CAP_HALF_H) * fitFrac;
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
