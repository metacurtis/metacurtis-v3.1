// src/runtime/materialFactory.js
import * as THREE from 'three';
import { getGPUProfile } from './gpuProfile.js';

export async function createPointsMaterial({
  vertexShader,
  fragmentShader,
  uniforms = {},
  defines = {},
  transparent = true,
  depthWrite = false,
  depthTest = true,
  blending = THREE.AdditiveBlending,
} = {}) {
  const profile = await getGPUProfile();

  // Default: pull your canonical shaders if not supplied
  if (!vertexShader) {
    const mod = await import('@/shaders/templates/consciousness-vertex.glsl?raw');
    vertexShader = mod.default || mod;
  }
  if (!fragmentShader) {
    const mod = await import('@/shaders/templates/consciousness-fragment.glsl?raw');
    fragmentShader = mod.default || mod;
  }

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPointSize:     { value: 48.0 },
      uDevicePixelRatio: { value: Math.min(2.5, window.devicePixelRatio || 1) },
      uTierMode:       { value: new Float32Array([0, 0, 0, 0]) },
      uTierParams0:    { value: new Float32Array([0, 0, 0, 0]) },
      uTierParams1:    { value: new Float32Array([0, 0, 0, 0]) },
      uTierParams2:    { value: new Float32Array([0, 0, 0, 0]) },
      uTierParams3:    { value: new Float32Array([0, 0, 0, 0]) },
      uPalette0:       { value: new Float32Array([1, 1, 1]) },
      uPalette1:       { value: new Float32Array([1, 1, 1]) },
      uPalette2:       { value: new Float32Array([1, 1, 1]) },
      uPalette3:       { value: new Float32Array([1, 1, 1]) },
      uTierHighlight:  { value: -1 },
      uGridSpacing:    { value: new Float32Array([0.5, 0.5]) },
      uFlowTurbulence: { value: 0.0 },
      uStreakIntensity:{ value: 0.0 },
      uMotionParams:   { value: new Float32Array([0, 0, 0, 0]) },
      uSpreadFactor:   { value: 0.0 },
      ...uniforms,
    },
    defines: {
      BASELINE_VARIANT: profile.baselineVariant ? 1 : 0,
      ...defines,
    },
    transparent,
    depthWrite,
    depthTest,
    blending,
  });

  // Clamp point-size to profile limit (safety)
  const maxPS = Number(profile.maxPointSize || 64);
  if (mat.uniforms.uPointSize && typeof mat.uniforms.uPointSize.value === 'number') {
    mat.uniforms.uPointSize.value = Math.min(mat.uniforms.uPointSize.value, maxPS);
  }

  return { material: mat, profile };
}
