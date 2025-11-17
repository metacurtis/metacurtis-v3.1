// Shared utilities extracted from ConsciousnessEngine.js to reduce duplication.
// Keep these helpers pure and free of stateful dependencies so they can be
// reused across future engine modules.
import { emitBlueprintReady as emitBlueprintReadyEvent } from '@/theater/bus/emitters.js';

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
 * Emit the canonical BLUEPRINT_READY payload through BeatBus.
 *
 * @param {object} BeatBus - BeatBus singleton.
 * @param {object} EVENTS - Theater event constants.
 * @param {object} blueprint - Blueprint object to emit.
 * @param {object} [metadata={}] - Additional payload fields (stage, quality, etc).
 * @returns {object} - Payload emitted for convenience/testing.
 */
export function emitBlueprintReady(BeatBus, EVENTS, blueprint, metadata = {}) {
  const payload = {
    channel: 'renderer',
    blueprint,
    ...metadata,
  };
  emitBlueprintReadyEvent(payload);
  return payload;
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
