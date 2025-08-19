#!/usr/bin/env node
/* doctor-stage-visuals.cjs
 * Adds stage palettes + TransitionService that animates uMorphProgress/uFadeProgress
 * and uColorCurrent/uColorNext on BLUEPRINT_READY(stage).
 *
 * Usage:
 *   node scripts/doctor-stage-visuals.cjs
 *   node scripts/doctor-stage-visuals.cjs --commit   # optional commit+tag
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
function p(...s){ return path.join(root, ...s); }
function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); }
function writeOnce(file, content){
  ensureDir(path.dirname(file));
  if (fs.existsSync(file) && !fs.existsSync(file+'.bak')) fs.copyFileSync(file, file+'.bak');
  fs.writeFileSync(file, content, 'utf8');
  console.log('✍️ ', path.relative(root, file));
}

/* 1) Palettes (simple, high-contrast defaults; tweak later) */
const palettes = {
  "genesis":         { "primary": "#26ff6a", "accent": "#0cffc4", "bg": "#021b0f" },
  "discipline":      { "primary": "#2ad4ff", "accent": "#75b7ff", "bg": "#061421" },
  "neural":          { "primary": "#b07cff", "accent": "#7a9dff", "bg": "#0c0a1a" },
  "velocity":        { "primary": "#ffb300", "accent": "#ffd166", "bg": "#1a1005" },
  "architecture":    { "primary": "#ff6f91", "accent": "#ffc2d1", "bg": "#1a0b10" },
  "harmony":         { "primary": "#a6ff00", "accent": "#eaff8f", "bg": "#0c1304" },
  "transcendence":   { "primary": "#00ffe9", "accent": "#b3fff7", "bg": "#031716" }
};
writeOnce(p('src/theater/palettes.json'), JSON.stringify(palettes, null, 2));

/* 2) StageBehaviors (durations + easing) */
const behaviorsJs =
"// Auto-generated StageBehaviors (safe defaults)\n"+
"export const StageBehaviors = {\n"+
"  morphMs: 2400,\n"+
"  fadeMs: 1800,\n"+
"  delayMs: 120,     // small staging delay to let geometry swap settle\n"+
"  easing(t){\n"+
"    // cubic in-out\n"+
"    return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;\n"+
"  }\n"+
"};\n";
writeOnce(p('src/theater/StageBehaviors.js'), behaviorsJs);

/* 3) TransitionService (runs in browser; no renderer changes required) */
const transitionSvc =
"// Auto-generated TransitionService: drives morph/fade + palette on BLUEPRINT_READY(stage)\n"+
"import * as THREE from 'three';\n"+
"\n"+
"(async function init(){\n"+
"  let BeatBus;\n"+
"  try { BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default; }\n"+
"  catch(e){\n"+
"    try { BeatBus = (await import('@/modules/orchestration/core/BeatBus.js')).default || (await import('@/modules/orchestration/core/BeatBus.js')).BeatBus; } catch(_e){}\n"+
"  }\n"+
"  if (!BeatBus) { BeatBus = globalThis.CANON_BEATBUS; }\n"+
"  if (!BeatBus || typeof BeatBus.on !== 'function') {\n"+
"    console.warn('[TransitionService] BeatBus unavailable; skipping visuals driver');\n"+
"    return;\n"+
"  }\n"+
"\n"+
"  const palettes = await import('./palettes.json');\n"+
"  const { StageBehaviors } = await import('./StageBehaviors.js');\n"+
"\n"+
"  let currentStage = null;\n"+
"  let prevColor = new THREE.Color('#26ff6a');\n"+
"  let activeRAF = 0;\n"+
"  let cancelToken = { n:0 };\n"+
"\n"+
"  function findPointsMaterial(){\n"+
"    const scene = (globalThis.__r3f || globalThis).scene;\n"+
"    if (!scene || !scene.traverse) return null;\n"+
"    let pts=null;\n"+
"    scene.traverse(o=>{ if (!pts && (o.isPoints || o.type==='Points')) pts=o; });\n"+
"    return pts?.material || null;\n"+
"  }\n"+
"\n"+
"  function setUniform(mat, name, val){\n"+
"    if (!mat || !mat.uniforms || !mat.uniforms[name]) return;\n"+
"    const u = mat.uniforms[name];\n"+
"    if (u.value && u.value.isColor && (Array.isArray(val) || typeof val==='string' || (val&&val.isColor))) {\n"+
"      const c = val.isColor ? val : new THREE.Color(val);\n"+
"      u.value.copy(c);\n"+
"    } else if (u.value !== undefined) {\n"+
"      u.value = val;\n"+
"    }\n"+
"  }\n"+
"\n"+
"  function animateTransition(stage){\n"+
"    const mat = findPointsMaterial();\n"+
"    if (!mat){\n"+
"      console.warn('[TransitionService] No Points material found to drive uniforms');\n"+
"      return;\n"+
"    }\n"+
"    const cfg = (palettes.default||palettes)[stage] || (palettes.default||palettes)['genesis'];\n"+
"    const nextColor = new THREE.Color(cfg.primary);\n"+
"\n"+
"    // cancel any in-flight\n"+
"    if (activeRAF) cancelAnimationFrame(activeRAF);\n"+
"    const myToken = { n: ++cancelToken.n, cancelled:false };\n"+
"\n"+
"    const t0 = performance.now();\n"+
"    const morphT = StageBehaviors.morphMs;\n"+
"    const fadeT  = StageBehaviors.fadeMs;\n"+
"\n"+
"    // initialize uniforms if present\n"+
"    setUniform(mat, 'uColorCurrent', prevColor);\n"+
"    setUniform(mat, 'uColorNext',    nextColor);\n"+
"    setUniform(mat, 'uMorphProgress', 0);\n"+
"    setUniform(mat, 'uFadeProgress',  0);\n"+
"\n"+
"    function frame(){\n"+
"      if (myToken.cancelled || myToken.n !== cancelToken.n) return; // superseded\n"+
"      const now = performance.now();\n"+
"      const em = Math.min(1, Math.max(0, (now - t0 - StageBehaviors.delayMs)/morphT));\n"+
"      const ef = Math.min(1, Math.max(0, (now - t0)/fadeT));\n"+
"      const m = StageBehaviors.easing(em);\n"+
"      const f = StageBehaviors.easing(ef);\n"+
"      setUniform(mat, 'uMorphProgress', m);\n"+
"      setUniform(mat, 'uFadeProgress',  f);\n"+
"      if (ef < 1 || em < 1) { activeRAF = requestAnimationFrame(frame); }\n"+
"      else { activeRAF = 0; prevColor = nextColor; }\n"+
"    }\n"+
"    activeRAF = requestAnimationFrame(frame);\n"+
"  }\n"+
"\n"+
"  // Drive on each new stage blueprint\n"+
"  const off = BeatBus.on('BLUEPRINT_READY', ({stage})=>{\n"+
"    if (!stage) return;\n"+
"    if (currentStage === null) { currentStage = stage; /* first apply: establish base */ return; }\n"+
"    if (stage === currentStage) return;\n"+
"    currentStage = stage;\n"+
"    animateTransition(stage);\n"+
"  });\n"+
"\n"+
"  // Expose debug helpers\n"+
"  globalThis.stageVisuals = {\n"+
"    preview(stage){ animateTransition(stage||'genesis'); },\n"+
"    getStatus(){ return { currentStage, prevColor: '#'+prevColor.getHexString(), running: !!activeRAF }; }\n"+
"  };\n"+
"\n"+
"  console.log('🎨 TransitionService online (palettes + morph/fade driver)');\n"+
"})().catch(e=>console.error('[TransitionService] init failed', e));\n";
writeOnce(p('src/theater/TransitionService.js'), transitionSvc);

/* 4) Patch src/main.jsx (DEV import) */
const mainFile = p('src/main.jsx');
if (!fs.existsSync(mainFile)) {
  console.error('✖ src/main.jsx not found; aborting patch');
  process.exit(2);
}
let mainSrc = fs.readFileSync(mainFile,'utf8');
if (!/CanonDoctor:TransitionService/.test(mainSrc)) {
  mainSrc += "\n\n// CanonDoctor:TransitionService\nif (import.meta.env.DEV) {\n  try { import('./theater/TransitionService.js'); } catch(e) {}\n}\n";
  writeOnce(mainFile, mainSrc);
} else {
  console.log('ℹ main.jsx already imports TransitionService (skipped)');
}

/* 5) Optional commit */
if (process.argv.includes('--commit')) {
  try {
    const { execSync } = require('child_process');
    if (fs.existsSync(p('scripts/snapshot-render-stack.cjs'))) {
      execSync('node scripts/snapshot-render-stack.cjs --dev --all-shaders', { stdio:'inherit' });
    }
    execSync('git add -A', { stdio:'inherit' });
    execSync('git commit -m "feat(visuals): stage palettes + TransitionService (morph/fade)"', { stdio:'inherit' });
    const tag = 'doctor_stage_visuals_'+new Date().toISOString().replace(/[:.]/g,'-');
    execSync('git tag '+tag, { stdio:'inherit' });
    console.log('✅ committed & tagged:', tag);
  } catch (e) {
    console.warn('⚠ commit/tag skipped:', e.message);
  }
}

console.log('✅ Stage visuals doctor complete.\nNext:\n  1) npm run dev\n  2) In DevTools: stageControls.set(\"discipline\") (or stateControls.setStage(\"discipline\"))\n  3) Watch morph (~2.4s) + color fade (~1.8s). Check window.stageVisuals.getStatus()');
