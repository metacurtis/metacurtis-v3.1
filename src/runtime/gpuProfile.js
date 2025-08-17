// src/runtime/gpuProfile.js
import * as THREE from 'three';

const cache = { profile: null };

function detectGLStrings() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return {};
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return { vendor: String(vendor||''), renderer: String(renderer||''), webgl2: !!canvas.getContext('webgl2') };
  } catch (e) {
    return {};
  }
}

async function loadProfile(name) {
  try {
    const mod = await import(`/profiles/gpu/${name}.json`, { assert: { type: 'json' } });
    return mod.default || mod;
  } catch { return null; }
}

export async function getGPUProfile() {
  if (cache.profile) return cache.profile;
  const { vendor = '', renderer = '' } = detectGLStrings();

  const guessIntelIntegrated = /intel/i.test(vendor) || /iris|uhd|hd graphics/i.test(renderer);
  let profile = await loadProfile(guessIntelIntegrated ? 'intel_integrated' : 'baseline');
  if (!profile) profile = await loadProfile('baseline');

  cache.profile = { ...profile, vendor, renderer };
  if (import.meta.env.DEV) {
    console.log('🧭 GPU Profile', cache.profile);
  }
  return cache.profile;
}
