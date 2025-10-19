#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
'use strict';

/**
 * finish-guard-console.cjs
 * One-touch finisher for:
 *  1) Canon Guard L2→L3 (GPU profiles, centralized material factory, degrade policy, runtime injector)
 *  2) Canon Console L2 (adds BLUEPRINT_TIERDATA_CONVERT + safety step)
 *  3) Repo doctors wiring (doctor/verify/snapshot/restore + precommit-ready scripts)
 *
 * Idempotent: safe to run multiple times.
 */

const fs = require('fs');
const _path = require('path');

const root = process.cwd();
const P = (...x) => path.join(root, ...x);
const exists = (p) => fs.existsSync(p);
const read = (p) => (exists(p) ? fs.readFileSync(p, 'utf8') : null);
const same = (a, b) => a && b && a.trim() === b.trim();

function ensureDir(d) { if (!exists(d)) fs.mkdirSync(d, { recursive: true }); }

function writeFile(p, content, label) {
  ensureDir(path.dirname(p));
  const cur = read(p);
  if (cur && same(cur, content)) {
    console.log(`✓ up-to-date ${label || p}`);
    return false;
  }
  if (cur && !exists(p + '.bak')) {
    fs.writeFileSync(p + '.bak', cur);
  }
  fs.writeFileSync(p, content);
  console.log(`✍️  wrote ${label || p}`);
  return true;
}

function patchFileAppendOnce(p, snippet, marker) {
  const cur = read(p) || '';
  if (cur.includes(marker)) {
    console.log(`✓ patch present in ${p}`);
    return false;
  }
  const next = cur + `\n\n// ${marker}\n` + snippet + '\n';
  fs.writeFileSync(p, next);
  console.log(`✍️  patched ${p} (${marker})`);
  return true;
}

function patchPackageJsonScripts(extraScripts) {
  const pjPath = P('package.json');
  const pj = JSON.parse(read(pjPath) || '{}');
  pj.scripts = pj.scripts || {};

  let changed = false;
  for (const [k, v] of Object.entries(extraScripts)) {
    if (pj.scripts[k] !== v) {
      pj.scripts[k] = v;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(pjPath, JSON.stringify(pj, null, 2));
    console.log('✍️  wrote package.json (scripts updated)');
  } else {
    console.log('✓ package.json scripts up-to-date');
  }
}

/* -----------------------------
 * 1) Canon Guard L2 → L3 bits
 * ----------------------------- */

// GPU profiles
const baselineProfile = `{
  "name": "baseline",
  "integrated": false,
  "baselineVariant": false,
  "maxPointSize": 64,
  "degradeOrder": ["particleCount.tier1","particleCount.tier2","pointSize","atlasRes"],
  "neverSacrifice": ["tier4Prominence","colorPhilosophy","morphSmoothness"],
  "targetFpsP95": 55
}
`;

const intelIntegratedProfile = `{
  "name": "intel_integrated",
  "integrated": true,
  "baselineVariant": true,
  "maxPointSize": 48,
  "degradeOrder": ["particleCount.tier1","particleCount.tier2","pointSize","atlasRes"],
  "neverSacrifice": ["tier4Prominence","colorPhilosophy","morphSmoothness"],
  "targetFpsP95": 55
}
`;

writeFile(P('profiles/gpu/baseline.json'), baselineProfile, 'profiles/gpu/baseline.json');
writeFile(P('profiles/gpu/intel_integrated.json'), intelIntegratedProfile, 'profiles/gpu/intel_integrated.json');

// GPU profile detector (runtime)
const gpuProfileJs = `// src/runtime/gpuProfile.js
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
    const mod = await import(\`/profiles/gpu/\${name}.json\`, { assert: { type: 'json' } });
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
`;

writeFile(P('src/runtime/gpuProfile.js'), gpuProfileJs, 'src/runtime/gpuProfile.js');

// Central material factory (L3)
const materialFactoryJs = `// src/runtime/materialFactory.js
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
`;

writeFile(P('src/runtime/materialFactory.js'), materialFactoryJs, 'src/runtime/materialFactory.js');

// Guard degrade policy (L3)
const degradePolicyJs = `// src/canon-guard/runtime/DegradePolicy.js
const DEFAULT = {
  targetFpsP95: 55,
  degradeOrder: ['particleCount.tier1', 'particleCount.tier2', 'pointSize', 'atlasRes'],
  neverSacrifice: ['tier4Prominence','colorPhilosophy','morphSmoothness'],
};

export function decideDegrade({ fpsP95, profile }) {
  const order = profile?.degradeOrder || DEFAULT.degradeOrder;
  const target = profile?.targetFpsP95 || DEFAULT.targetFpsP95;
  if (typeof fpsP95 !== 'number') return null;
  if (fpsP95 >= target) return null;
  const what = order[0];
  return { action: 'DEGRADE', what, amount: 0.15, reason: \`p95=\${fpsP95} < target=\${target}\` };
}
`;

writeFile(P('src/canon-guard/runtime/DegradePolicy.js'), degradePolicyJs, 'src/canon-guard/runtime/DegradePolicy.js');

// Guard runtime injector (L2 safety + L3 hooks)
const guardRuntimeInjectJs = `// src/canon-guard/runtime/GuardRuntimeInject.js
import { decideDegrade } from './DegradePolicy.js';

(async function () {
  if (!import.meta.env.DEV) return;

  let BeatBus, EVENTS;
  try {
    BeatBus = (await import('@/src/src/modules/orchestration/core/BeatBus.js')).default;
    EVENTS = (await import('@/theater/events.js')).EVENTS;
  } catch (e) {
    console.warn('Canon Guard: BeatBus/events not available yet', e);
    return;
  }

  console.log('🛡️ Canon Guard runtime: Blueprint guard ACTIVE (L2→L3)');

  function toF32(a) {
    if (!a) return null;
    if (a instanceof Float32Array) return a;
    return new Float32Array(a);
  }

  function guardBlueprint(payload) {
    const out = { fixes: [] };
    const bp = payload?.blueprint || payload;

    if (!bp) return out;

    // Convert tiers(Uint8Array) -> tierData(Float32Array)
    if (bp.tiers && !bp.tierData) {
      bp.tierData = new Float32Array(bp.tiers);
      out.fixes.push('tiers→tierData(Float32Array)');
    }

    // Ensure Float32Array for GPU-safe attributes
    ['atmosphericPositions','allenAtlasPositions','animationSeeds','sizeMultipliers','opacityData','atlasIndices'].forEach(k=>{
      if (bp[k] && !(bp[k] instanceof Float32Array)) {
        bp[k] = toF32(bp[k]);
        out.fixes.push(\`\${k}→Float32Array\`);
      }
    });

    // Active count/draw range sanity
    if (!bp.activeCount && (bp.particleCount || bp.maxParticles)) {
      bp.activeCount = bp.particleCount || bp.maxParticles;
      out.fixes.push('activeCount set');
    }

    // Emit incident for Console (if present)
    try {
      window.CANON_CONSOLE?.incident?.({
        code: 'BLUEPRINT_GUARDED',
        severity: out.fixes.length ? 'warn' : 'info',
        message: out.fixes.join(', '),
        context: { stage: bp.stageName, particleCount: bp.activeCount }
      });
    } catch {}

    return out;
  }

  const off = BeatBus.on(EVENTS.BLUEPRINT_READY, (p) => {
    const res = guardBlueprint(p);
    if (res.fixes.length) console.log('🔧 Canon Guard blueprint fixes', res.fixes);
  });

  // Optional L3: simple degrade coordinator (wire your FPS source)
  window.CANON_GUARD_L3 = {
    decideDegrade,
    apply(decision) {
      if (!decision) return;
      // For now we only announce; wire to your qualityAtom or stage bus as you prefer.
      console.log('⚖️  Canon Guard L3 decision', decision);
    }
  };

  // Expose convenience hook for Consoles/Pilot
  window.addEventListener('canon:metrics', (e) => {
    const { fpsP95, profile } = e.detail || {};
    const d = decideDegrade({ fpsP95, profile });
    if (d) window.CANON_GUARD_L3.apply(d);
  });

  // cleanup helper
  window.addEventListener('beforeunload', () => off && off());
})();
`;

writeFile(P('src/canon-guard/runtime/GuardRuntimeInject.js'), guardRuntimeInjectJs, 'src/canon-guard/runtime/GuardRuntimeInject.js');

/* -----------------------------
 * 2) Canon Console L2 finisher
 * ----------------------------- */

// Extra steps: set_draw_range_from_uniforms + convert_tiers_to_tierData
const stepsExtraJs = `// canon-console/runtime/steps-extra.js
export const ExtraSteps = {
  set_draw_range_from_uniforms({ geometry, material }) {
    try {
      const active = material?.uniforms?.uActiveCount?.value ?? geometry?.attributes?.particleIndex?.count ?? 0;
      if (typeof active === 'number' && geometry?.setDrawRange) {
        geometry.setDrawRange(0, active);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  convert_tiers_to_tierData({ blueprint }) {
    try {
      if (blueprint?.tiers && !blueprint.tierData) {
        blueprint.tierData = new Float32Array(blueprint.tiers);
        return { ok: true, changed: true };
      }
      return { ok: true, changed: false };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
`;

writeFile(P('canon-console/runtime/steps-extra.js'), stepsExtraJs, 'canon-console/runtime/steps-extra.js');

// Extra playbook: BLUEPRINT_TIERDATA_CONVERT
const playbooksExtraJs = `// canon-console/runtime/playbooks-extra.js
export const ExtraPlaybooks = {
  BLUEPRINT_TIERDATA_CONVERT: {
    id: 'BLUEPRINT_TIERDATA_CONVERT',
    when: { code: 'BLUEPRINT_GUARDED' },
    plan: [
      { step: 'convert_tiers_to_tierData', args: {} },
      { step: 'set_draw_range_from_uniforms', args: {} },
      { step: 'verify_metrics', args: { fpsMin: 55, probeMs: 240 } }
    ],
  },
};
`;

writeFile(P('canon-console/runtime/playbooks-extra.js'), playbooksExtraJs, 'canon-console/runtime/playbooks-extra.js');

// Ensure the console injector imports the extras (without clobbering your file)
const consoleInjectPathA = P('canon-console/browser/inject.js');
const consoleInjectExists = exists(consoleInjectPathA);
if (consoleInjectExists) {
  const appendSnippet = `(async () => {
  try {
    const { ExtraSteps } = await import('../runtime/steps-extra.js');
    window.CANON_CONSOLE?.registerSteps?.(ExtraSteps);
  } catch (e) { /* noop */ }
  try {
    const { ExtraPlaybooks } = await import('../runtime/playbooks-extra.js');
    window.CANON_CONSOLE?.registerPlaybooks?.(ExtraPlaybooks);
  } catch (e) { /* noop */ }
})();`;
  patchFileAppendOnce(consoleInjectPathA, appendSnippet, 'CanonConsole:load-extras');
} else {
  console.log('ℹ️ canon-console/browser/inject.js not found; skipping extras wiring (your existing L2 injector will still work).');
}

/* -----------------------------
 * 3) Wire dev loader + repo doctors
 * ----------------------------- */

// Ensure src/main.jsx dev loader brings in Guard runtime (and already optional console)
const mainPath = P('src/main.jsx');
if (exists(mainPath)) {
  const devLoader = `
if (import.meta.env.DEV) {
  // ensure Canon Console injector (if present)
  try { import(/* @vite-ignore */ '../canon-console/browser/inject.js'); } catch {}
  // Guard runtime (L2→L3)
  try { import('../canon-guard/runtime/GuardRuntimeInject.js'); } catch {}
}
  `;
  patchFileAppendOnce(mainPath, devLoader, 'CanonFinisher:dev-injectors');
} else {
  console.log('⚠️ src/main.jsx not found – skip dev-injector patch');
}

// Package.json scripts
patchPackageJsonScripts({
  "guard:finish": "node scripts/finish-guard-console.cjs",
  "console:l2:finish": "node scripts/finish-guard-console.cjs",
  "doctor": "node scripts/render-contract-verify.cjs --fix && node scripts/snapshot-render-stack.cjs",
  "doctor:verify": "node scripts/render-contract-verify.cjs",
});

// Friendly summary
console.log('\n✅ Finish step complete.');
console.log('What changed:\n - GPU profiles + central material factory (L3)\n - Guard runtime injector (L2→L3)\n - Console L2 extras (tiers→tierData playbook + drawRange safety)\n - Dev loader wiring + package scripts\n');
console.log('Next:\n  1) npm run dev\n  2) In DevTools, you should see 🛡️ Canon Guard runtime: Blueprint guard ACTIVE\n     and your Canon Console L2 should list the extra playbook.');
