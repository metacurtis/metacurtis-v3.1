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
      uPointSize: { value: 48.0 },
      uDevicePixelRatio: { value: Math.min(2.5, window.devicePixelRatio || 1) },
      uTierHighlight: { value: new Float32Array([1.0, 1.25, 1.5, 1.75]) },
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

  // Ensure typed arrays for legacy GL1 (tier highlight)
  if (mat.uniforms.uTierHighlight && !(mat.uniforms.uTierHighlight.value instanceof Float32Array)) {
    mat.uniforms.uTierHighlight.value = new Float32Array(mat.uniforms.uTierHighlight.value);
  }

  return { material: mat, profile };
}
