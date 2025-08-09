   Drop-in factory that satisfies the scanner:
   - Uses THREE.ShaderMaterial
   - Attaches "position", "atmosphericPosition", "allenAtlasPosition", "particleIndex"
   - Calls geometry.setDrawRange(0, activeCount)
   - Imports GLSL from files (no inline shader text)
*/

import * as THREE from 'three';

// Import GLSL from files (Vite supports ?raw out of the box)
import VERT from '@/shaders/baseline/points-vertex.glsl?raw';
import FRAG from '@/shaders/baseline/points-fragment.glsl?raw';

/**
 * Ensure a BufferGeometry has the canonical attributes the scanner expects:
 *  - position (vec3)
 *  - atmosphericPosition (vec3)
 *  - allenAtlasPosition (vec3)
 *  - particleIndex (float)
 * Also explicitly calls setDrawRange(0, activeCount).
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {Float32Array} [positions]            length = count * 3
 * @param {Float32Array} [allenPositions]       length = count * 3
 * @param {Float32Array} [atmosphericPositions] length = count * 3
 * @param {{activeCount?: number, defaultCount?: number}} [options]
 * @returns {THREE.BufferGeometry}
 */
export function ensureCanonGeometry(
  geometry,
  positions,
  allenPositions,
  atmosphericPositions,
  options = {}
) {
  const geo = geometry instanceof THREE.BufferGeometry
    ? geometry
    : new THREE.BufferGeometry();

  // Derive particle count
  let count = 0;
  if (positions instanceof Float32Array) count = Math.floor(positions.length / 3);
  else if (geo.getAttribute('position')) count = geo.getAttribute('position').count;
  else if (allenPositions instanceof Float32Array) count = Math.floor(allenPositions.length / 3);
  else if (atmosphericPositions instanceof Float32Array) count = Math.floor(atmosphericPositions.length / 3);
  else count = options.defaultCount ?? 0;

  // --- REQUIRED: position
  if (positions instanceof Float32Array) {
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  } else if (!geo.getAttribute('position')) {
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  }

  // --- REQUIRED: allenAtlasPosition
  if (allenPositions instanceof Float32Array) {
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(allenPositions, 3));
  } else if (!geo.getAttribute('allenAtlasPosition')) {
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  }

  // --- REQUIRED: atmosphericPosition
  if (atmosphericPositions instanceof Float32Array) {
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(atmosphericPositions, 3));
  } else if (!geo.getAttribute('atmosphericPosition')) {
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  }

  // --- REQUIRED: particleIndex
  if (!geo.getAttribute('particleIndex')) {
    const idx = new Float32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
  }

  // Active count defaults to position.count
  const activeCount = options.activeCount ?? geo.getAttribute('position')?.count ?? 0;

  // --- REQUIRED: explicit draw range call
  geo.setDrawRange(0, activeCount);

  // Nice-to-have bounds
  if (!geo.boundingSphere) geo.computeBoundingSphere?.();

  return geo;
}

/**
 * Create a canonical ShaderMaterial for point sprites.
 * Exposes the uniforms your shaders expect (incl. uTierHighlight[4]).
 *
 * @param {{
 *   pointSize?: number,
 *   morphProgress?: number,
 *   particleCount?: number,
 *   baseColor?: THREE.Color | number | string,
 *   transparent?: boolean,
 *   depthWrite?: boolean,
 *   blending?: THREE.Blending,
 *   glslVersion?: number
 * }} [opts]
 * @returns {THREE.ShaderMaterial}
 */
export function createCanonMaterial(opts = {}) {
  const {
    pointSize = 2.0,
    morphProgress = 0.0,
    particleCount = 0,
    baseColor = 0xffffff,
    transparent = true,
    depthWrite = false,
    blending = THREE.AdditiveBlending,
    glslVersion = THREE.GLSL3,
  } = opts;

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    glslVersion,
    transparent,
    depthWrite,
    blending,
    uniforms: {
      // Common/time
      uTime: { value: 0 },

      // Performance / morphing
      uMorphProgress: { value: morphProgress },
      uParticleCount: { value: particleCount },

      // Visual
      uPointSize: { value: pointSize },
      uBaseColor: { value: new THREE.Color(baseColor) },

      // REQUIRED by your fragment linter:
      // `uniform float uTierHighlight[4];`
      uTierHighlight: { value: [0, 0, 0, 0] },
    },
  });

  return material;
}

/**
 * Helper to create a THREE.Points that is already compliant.
 * @param {Float32Array} positions
 * @param {Float32Array} allenPositions
 * @param {Float32Array} atmosphericPositions
 * @param {object} [opts] - forwarded to createCanonMaterial + ensureCanonGeometry
 */
export function createCanonPoints(positions, allenPositions, atmosphericPositions, opts = {}) {
  const geo = ensureCanonGeometry(new THREE.BufferGeometry(), positions, allenPositions, atmosphericPositions, opts);
  const particleCount = geo.getAttribute('position')?.count ?? 0;
  const mat = createCanonMaterial({ ...opts, particleCount });
  return new THREE.Points(geo, mat);
}

/**
 * Tiny convenience for ticking time / updates.
 * Call each frame if you like.
 */
export function updateCanonMaterial(material, {
  dt = 0,
  time,
  morphProgress,
  pointSize,
  particleCount,
  baseColor,
  tierHighlight, // array of 4 numbers
} = {}) {
  if (!material || !material.uniforms) return;
  if (typeof time === 'number') material.uniforms.uTime.value = time;
  else material.uniforms.uTime.value += dt;

  if (typeof morphProgress === 'number') material.uniforms.uMorphProgress.value = morphProgress;
  if (typeof pointSize === 'number') material.uniforms.uPointSize.value = pointSize;
  if (typeof particleCount === 'number') material.uniforms.uParticleCount.value = particleCount;
  if (baseColor != null) material.uniforms.uBaseColor.value.set?.(baseColor);
  if (Array.isArray(tierHighlight) && tierHighlight.length === 4) {
    material.uniforms.uTierHighlight.value = tierHighlight.slice(0, 4);
  }
}

// Optional alias if you previously referenced ensureCanonGeometryAuto
export const ensureCanonGeometryAuto = ensureCanonGeometry;

/* -----------------------------------------------------------------------
Usage (example):


