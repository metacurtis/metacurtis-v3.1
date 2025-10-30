// Shared utilities extracted from ConsciousnessEngine.js to reduce duplication.
// Keep these helpers pure and free of stateful dependencies so they can be
// reused across future engine modules.

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
  const payload = { blueprint, ...metadata };
  BeatBus.emit(EVENTS.BLUEPRINT_READY, payload);
  return payload;
}
