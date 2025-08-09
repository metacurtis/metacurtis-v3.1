#!/usr/bin/env node
/* upgrade-material-factory.cjs
 * Replaces src/renderer/materialFactory.js with a more robust helper.
 * Safe to re-run; it overwrites that single file.
 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const DEST = path.join(ROOT, 'src/renderer/materialFactory.js');

const TEXT = `// Upgraded by upgrade-material-factory.cjs
import * as THREE from 'three';
import vert from '@/shaders/templates/consciousness-vertex.glsl?raw';
import frag from '@/shaders/templates/consciousness-fragment.glsl?raw';

/**
 * Ensure geometry has required Canon attributes. If 'positions' missing,
 * we build minimal arrays using:
 *   - existing geo.position if present, OR
 *   - count (if provided), OR
 *   - 0 (no-op, still satisfies validator)
 */
export function ensureCanonGeometryAuto(geo, {
  positions = null, // Float32Array of length N*3
  allen = null,     // Float32Array N*3
  atmo = null,      // Float32Array N*3
  count = null,     // fallback particle count if positions absent
} = {}) {
  if (!geo) geo = new THREE.BufferGeometry();

  let posAttr = geo.getAttribute('position');
  if (!posAttr) {
    if (!positions) {
      const n = Number.isFinite(count) && count > 0 ? count|0 : 0;
      positions = new Float32Array(n * 3);
    }
    posAttr = new THREE.BufferAttribute(positions, 3);
    geo.setAttribute('position', posAttr);
  }
  const n = posAttr.count|0;

  if (!geo.getAttribute('atmosphericPosition')) {
    geo.setAttribute('atmosphericPosition',
      new THREE.BufferAttribute(atmo || posAttr.array, 3));
  }
  if (!geo.getAttribute('allenAtlasPosition')) {
    geo.setAttribute('allenAtlasPosition',
      new THREE.BufferAttribute(allen || posAttr.array, 3));
  }
  if (!geo.getAttribute('particleIndex')) {
    const idx = new Float32Array(n);
    for (let i=0;i<n;i++) idx[i] = i;
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
  }
  return geo;
}

function makeWhiteTexture() {
  const t = new THREE.DataTexture(new Uint8Array([255,255,255,255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

export function createCanonMaterial({
  particleCount = 0,
  morphProgress = 0,
  color = '#22c55e',
  atlasTexture = null,
  gaussianSigma = 0.85,
  blending = THREE.AdditiveBlending,
  depthTest = true,
  depthWrite = false,
  transparent = true,
  pointSize = 3,
} = {}) {
  const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
  const res = (typeof window !== 'undefined')
    ? new THREE.Vector2(window.innerWidth, window.innerHeight)
    : new THREE.Vector2(1920, 1080);

  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent,
    depthTest,
    depthWrite,
    blending,
    uniforms: {
      uResolution:   { value: res },
      uPointSize:    { value: pointSize * dpr },
      uActiveCount:  { value: particleCount|0 },

      // morph/stage aliases
      uMorphProgress:{ value: morphProgress },
      uStageProgress:{ value: morphProgress },
      uStageBlend:   { value: morphProgress },

      // fragment
      uColor:         { value: new THREE.Color(color) },
      uGaussianSigma: { value: gaussianSigma },
      uTierHighlight: { value: new Float32Array([0,0,0,0]) },
      uAtlasTexture:  { value: atlasTexture || makeWhiteTexture() }
    }
  });

  mat.setActiveCount = (n) => { mat.uniforms.uActiveCount.value = n|0; };
  mat.setMorph = (v) => {
    mat.uniforms.uMorphProgress.value = v;
    mat.uniforms.uStageProgress.value = v;
    mat.uniforms.uStageBlend.value = v;
  };
  return mat;
}

/** Ensure drawRange is set from uActiveCount every frame (non-invasive). */
export function wireCanonPoints(points) {
  if (!points || !points.isPoints) return points;
  const geo = points.geometry;
  const mat = points.material;
  if (!geo || !mat) return points;
  points.onBeforeRender = function() {
    const pos = geo.getAttribute('position');
    const total = pos ? pos.count : 0;
    let active = total;
    if (mat.uniforms && mat.uniforms.uActiveCount) {
      const v = mat.uniforms.uActiveCount.value|0;
      if (Number.isFinite(v) && v >= 0) active = Math.min(v, total);
    }
    geo.setDrawRange(0, active);
  };
  return points;
}
`;

if (!fs.existsSync(path.dirname(DEST))) {
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
}
fs.writeFileSync(DEST, TEXT, 'utf8');
console.log('✅ upgraded', path.relative(ROOT, DEST));
