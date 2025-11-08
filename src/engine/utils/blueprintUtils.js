// Shared utilities extracted from ConsciousnessEngine.js to reduce duplication.
// Keep these helpers pure and free of stateful dependencies so they can be
// reused across future engine modules.

import { VC } from '@/config/visual-controls.js';
import { createSeededRandom } from '../../utils/random.js';

/**
 * Calculate an axis-aligned bounding box (AABB) for a flat XYZ position array.
 * Returns null when the input is missing or shorter than a single vec3.
 *
 * @param {Float32Array|number[]} positions - Flat array `[x, y, z, ...]`.
 * @returns {{min:{x:number,y:number,z:number},max:{x:number,y:number,z:number},size:{x:number,y:number,z:number}}|null}
 */
export function calculateBounds(positions) {
  if (!positions || positions.length < 3) return null;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
  };
}

/**
 * Gaussian (normal) random helper using the Box–Muller transform.
 *
 * @param {object} [options]
 * @param {() => number} [options.rand=Math.random] - Uniform random generator.
 * @param {number} [options.mean=0] - Distribution mean.
 * @param {number} [options.standardDeviation=1] - Standard deviation.
 * @param {number|null} [options.clamp=null] - Absolute clamp (if provided).
 * @returns {number}
 */
export function gaussianRandom({
  rand = Math.random,
  mean = 0,
  standardDeviation = 1,
  clamp = null,
} = {}) {
  let u1 = 0;
  let u2 = 0;

  // Guard against log(0).
  while (u1 === 0) u1 = rand();
  while (u2 === 0) u2 = rand();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  let value = z0 * standardDeviation + mean;

  if (typeof clamp === 'number' && clamp > 0) {
    const limit = Math.abs(clamp);
    if (value > limit) value = limit;
    else if (value < -limit) value = -limit;
  }

  return value;
}

/**
 * Create the common blueprint scaffolding (buffers + metadata) used by the engine.
 *
 * Mirrors the structure produced inside ConsciousnessEngine._createEmptyBlueprint
 * and _buildBlueprintForStage so both callsites can allocate through a single helper.
 *
 * @param {number} count - Target particle count (will be clamped to >= 0).
 * @param {object} [options]
 * @param {string} [options.stageName='genesis']
 * @param {string|null} [options.mode=null]
 * @param {string|null} [options.quality=null]
 * @param {object|null} [options.metadata=null]
 * @returns {object}
 */
export function createBlueprintStructure(count, {
  stageName = 'genesis',
  mode = null,
  quality = null,
  metadata = null,
} = {}) {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const allocateVec3 = () => new Float32Array(safeCount * 3);

  return {
    stageName,
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
    metadata: metadata ?? { mode, quality },
  };
}

/**
 * Shuffle tier assignments using Fisher–Yates and return both counts + labels.
 *
 * @param {number} count
 * @param {number[]} ratios - Expected length 4 array of tier ratios.
 * @param {() => number} [rand=Math.random] - Random generator used for shuffling.
 * @returns {{counts:number[],tiers:Uint8Array}}
 */
export function assignTiersShuffled(count, ratios, rand = Math.random) {
  const counts = [0, 0, 0, 0];
  counts[0] = Math.floor(count * ratios[0]);
  counts[1] = Math.floor(count * ratios[1]);
  counts[2] = Math.floor(count * ratios[2]);
  counts[3] = Math.max(0, count - (counts[0] + counts[1] + counts[2]));

  const tiers = new Uint8Array(count);
  let cursor = 0;
  for (let tier = 0; tier < counts.length; tier++) {
    const n = counts[tier];
    for (let i = 0; i < n; i += 1) tiers[cursor++] = tier;
  }

  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = tiers[i];
    tiers[i] = tiers[j];
    tiers[j] = tmp;
  }

  return { counts, tiers };
}

/**
 * Build the canonical BLUEPRINT_READY payload.
 *
 * @param {object} blueprint - Blueprint object to emit.
 * @param {object} [metadata={}] - Additional payload fields (stage, quality, etc).
 * @returns {object} - Payload
 */
export function createBlueprintReadyPayload(blueprint, metadata = {}) {
  return { blueprint, ...metadata };
}

const DEG2RAD = Math.PI / 180;

/**
 * Create helpers for band sampling used by constellation generation.
 *
 * @param {object} vc - Visual controls config.
 * @param {() => number} rnd - Source of uniform randomness.
 * @param {() => number} gauss - Source of gaussian randomness.
 * @returns {{sampleBand:(bias?:number,scaleX?:number,scaleY?:number)=>[number,number]}}
 */
export function makeBandFrame(vc, rnd, gauss) {
  const angleDeg = vc.BAND_ANGLE_DEG ?? 0;
  const ANG = angleDeg * DEG2RAD;
  const c = Math.cos(ANG);
  const s = Math.sin(ANG);
  const len = vc.BAND_LENGTH_SCALE ?? 2.2;
  const core = vc.BAND_CORE_WIDTH ?? 0.08;
  const fade = vc.BAND_FADE_WIDTH ?? 0.2;
  const unrot = (u, v) => [c * u - s * v, s * u + c * v];
  const sampleBand = (bias = 1, scaleX = 1, scaleY = 1) => {
    const u = (rnd() * 2 - 1) * len;
    const useCore = rnd() < 0.7;
    const v = (useCore ? gauss() * core : gauss() * fade) / Math.max(0.001, bias);
    const [ux, uy] = unrot(u, v);
    return [ux * scaleX, uy * scaleY];
  };
  return { sampleBand };
}

/**
 * Fit a formation to a viewport by scaling its XY extent.
 *
 * @param {Float32Array} out
 * @param {number} vw
 * @param {number} vh
 * @param {number|object|Array} fitFrac
 */
export function fitToViewXY(out, vw, vh, fitFrac = 0.86) {
  if (!fitFrac || fitFrac <= 0 || !out?.length) return;

  const computeScale = () => {
    const bounds = calculateBounds(out);
    if (!bounds) return 1;

    const halfX = bounds.size.x * 0.5;
    const halfY = bounds.size.y * 0.5;
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

    const ratioX = goalX ? goalX / Math.max(halfX, 1e-6) : Infinity;
    const ratioY = goalY ? goalY / Math.max(halfY, 1e-6) : Infinity;

    const target = Math.min(ratioX, ratioY);
    return Number.isFinite(target) ? target : 1;
  };

  const scale = computeScale();
  if (Number.isFinite(scale) && Math.abs(scale - 1) > 1e-3) {
    for (let i = 0; i < out.length; i += 3) {
      out[i] *= scale;
      out[i + 1] *= scale;
    }
  }
}

/**
 * Clones plain data structures when available.
 *
 * @param {any} value
 * @returns {any}
 */
export function safeClone(value) {
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

/**
 * Distribute particles according to provided ratios.
 *
 * @param {number} total
 * @param {number[]} ratios
 * @returns {number[]}
 */
export function distributeParticles(total, ratios = []) {
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

/**
 * Compute centroid, extents, fit ratios, and anisotropy for a flat XYZ array.
 *
 * @param {Float32Array|number[]} arr
 * @param {{width?:number,height?:number}} hint
 * @param {number} [fitFrac=VC?.FIT_FRAC ?? 0.92]
 * @returns {{count:number,centroid:{x:number,y:number},extents:{w:number,h:number},ratios:{rx:number|null,ry:number|null},anis:number,fitFrac:number}}
 */
export function computeStarfieldMetrics(arr, hint, fitFrac = VC?.FIT_FRAC ?? 0.92) {
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

/**
 * Generate a deterministic band-backed scatter used by diagnostics & probes.
 *
 * @param {number} N
 * @param {{width?:number,height?:number}} hint
 * @param {object} [options]
 * @param {string} [options.seed='probe-band']
 * @param {object} [options.vc=VC]
 * @returns {Float32Array}
 */
export function synthesizeBandPositions(N, hint, { seed = 'probe-band', vc = VC } = {}) {
  const out = new Float32Array(N * 3);
  const rnd = createSeededRandom(seed);
  const clampG = vc?.GAUSS_CLAMP ?? 1.0;
  const vw = (hint?.width ?? 120) * 0.5;
  const vh = (hint?.height ?? 90) * 0.5;
  const R = (vc?.STARFIELD_SCALE ?? 0.95) * vw;
  const band = makeBandFrame(vc, rnd, () => {
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
  const ratios = vc?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15];
  const tc0 = Math.floor(N * ratios[0]);
  const tc1 = Math.floor(N * ratios[1]);
  const tc2 = Math.floor(N * ratios[2]);
  const tc3 = N - (tc0 + tc1 + tc2);
  const t0y = vc.T0_SIGMA_Y_FLATTEN ?? 0.6;
  let k = 0;
  const emit = (x, y) => {
    const j = 3 * k++;
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = 0;
  };

  for (let i = 0; i < tc0; i++) {
    const useBand = (vc?.BAND_ENABLED ?? true) && rnd() < (vc?.T0_BAND_P ?? 0.85);
    const [x, y] = useBand ? band.sampleBand(1.4, R, R * t0y) : sampleEllipse(R, R * t0y);
    emit(x, y);
  }

  for (let i = 0; i < tc1; i++) {
    const useBand = (vc?.BAND_ENABLED ?? true) && rnd() < (vc?.BAND_T1_P ?? 0.85);
    const [x, y] = useBand ? band.sampleBand(1.0, R * 0.75, R * 0.75) : sampleEllipse(R * 0.75, R * 0.75);
    emit(x, y);
  }

  const cCount = vc?.T2_CLUSTER_COUNT ?? 6;
  const cSigma = (vc?.T2_CLUSTER_SIGMA ?? 0.09) * R;
  const clusters = Array.from({ length: cCount }, () => {
    if ((vc?.BAND_ENABLED ?? true) && rnd() < (vc?.BAND_T2_P ?? 0.95)) {
      const [bx, by] = band.sampleBand(0.8, R * 0.66, R * 0.66);
      return { cx: bx, cy: by };
    }
    const [cx, cy] = sampleEllipse(R * 0.66, R * 0.66);
    return { cx, cy };
  });
  for (let i = 0; i < tc2; i++) {
    const c = clusters[Math.floor(rnd() * clusters.length)];
    const x = c.cx + (rnd() * 2 - 1) * cSigma;
    const y = c.cy + (rnd() * 2 - 1) * cSigma;
    emit(x, y);
  }

  for (let i = 0; i < tc3; i++) {
    const useBand = (vc?.BAND_ENABLED ?? true);
    const [x, y] = useBand ? band.sampleBand(0.6, R * 0.28, R * 0.28) : sampleEllipse(R * 0.28, R * 0.28);
    emit(x, y);
  }

  const metrics = computeStarfieldMetrics(out, hint, vc?.FIT_FRAC ?? 0.92);
  const minView = Math.min(hint?.width ?? 120, hint?.height ?? 90);
  const currentR = Math.max(metrics.extents.w, metrics.extents.h) * 0.5;
  const targetR = (vc?.FIT_FRAC ?? 0.92) * minView;
  const scale = currentR > 0 ? targetR / currentR : 1;
  if (scale > 0 && Math.abs(scale - 1) > 1e-3) {
    for (let i = 0; i < out.length; i += 3) {
      out[i] *= scale;
      out[i + 1] *= scale;
    }
  }
  return out;
}

/**
 * Generate viewport scatter used by diagnostics and emergence fallbacks.
 *
 * @param {number} N
 * @param {{width?:number,height?:number}} hint
 * @param {object} [options]
 * @param {object} [options.vc=VC]
 * @param {() => number} [options.rand=Math.random]
 * @returns {Float32Array}
 */
export function generateViewportSpread(N, hint, { vc = VC, rand = Math.random } = {}) {
  const { width = 120, height = 90 } = hint || {};
  const out = new Float32Array(N * 3);

  const vw = width * 0.5;
  const vh = height * 0.5;
  const R = (vc?.STARFIELD_SCALE ?? 0.95) * vw;
  const AT = vc?.ATMO_SCALE ?? 1.0;
  const rx = R * AT;
  const ry = R * AT * (vc.T0_SIGMA_Y_FLATTEN ?? 0.6);
  const zMin = -vc.Z_BACK_MAX;
  const zMax = -vc.Z_BACK_MIN;

  const gauss = () => gaussianRandom({ rand, clamp: 1.2 });

  if (vc?.ATMO_USE_BAND) {
    const band = makeBandFrame(vc, rand, gauss);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const [x, y] = band.sampleBand(1.0, rx, ry);
      out[j] = x;
      out[j + 1] = y;
      out[j + 2] = zMin + rand() * (zMax - zMin);
    }
    return out;
  }

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    out[j] = gauss() * rx;
    out[j + 1] = gauss() * ry;
    out[j + 2] = zMin + rand() * (zMax - zMin);
  }

  return out;
}

/**
 * Generate atmospheric scatter used by emergence blueprints.
 *
 * @param {number} count
 * @param {{width?:number,height?:number}} viewportHint
 * @param {object} [opts]
 * @param {boolean} [opts.band]
 * @param {object} [vc=VC]
 * @returns {Float32Array}
 */
export function generateRandomAtmosphericScatter(count, viewportHint, opts = {}, vc = VC) {
  const out = new Float32Array(count * 3);
  const width = viewportHint?.width ?? viewportHint?.w ?? 16;
  const height = viewportHint?.height ?? viewportHint?.h ?? 9;
  const base = Math.max(1.0, Math.min(width, height));
  const R = base * 0.45;

  const rnd = Math.random;
  const gauss = () => gaussianRandom({ rand: rnd, clamp: 1.2 });

  const useBand = opts.band ?? (vc?.ATMO_USE_BAND ?? true);
  if (useBand) {
    const rx = R;
    const ry = R * (vc.T0_SIGMA_Y_FLATTEN ?? 0.6);
    const zMin = -vc.Z_BACK_MAX;
    const zMax = -vc.Z_BACK_MIN;
    const band = makeBandFrame(vc, rnd, gauss);
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
