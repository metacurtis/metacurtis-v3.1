#!/usr/bin/env node
'use strict';
/**
 * doctor-stage-visuals-fix.cjs
 * - Ensures TransitionService is present and robust
 * - Listens to BLUEPRINT_READY + STAGE_CHANGE
 * - Waits for Points material, checks uniforms, logs diagnostics
 * - Forces DEV import from src/main.jsx (idempotent)
 */
const fs = require('fs'); const path = require('path');
const root = process.cwd(); const P = (...s)=>path.join(root,...s);
const w = (f,c)=>{ fs.mkdirSync(path.dirname(f),{recursive:true}); if(fs.existsSync(f)&&!fs.existsSync(f+'.bak')) fs.copyFileSync(f,f+'.bak'); fs.writeFileSync(f,c,'utf8'); console.log('✍️', path.relative(root,f)); };

const palettes = {
  genesis:{primary:"#26ff6a",accent:"#0cffc4",bg:"#021b0f"},
  discipline:{primary:"#2ad4ff",accent:"#75b7ff",bg:"#061421"},
  neural:{primary:"#b07cff",accent:"#7a9dff",bg:"#0c0a1a"},
  velocity:{primary:"#ffb300",accent:"#ffd166",bg:"#1a1005"},
  architecture:{primary:"#ff6f91",accent:"#ffc2d1",bg:"#1a0b10"},
  harmony:{primary:"#a6ff00",accent:"#eaff8f",bg:"#0c1304"},
  transcendence:{primary:"#00ffe9",accent:"#b3fff7",bg:"#031716"}
};
w(P('src/theater/palettes.json'), JSON.stringify(palettes,null,2));

w(P('src/theater/StageBehaviors.js'), `// Auto-generated
export const StageBehaviors = {
  morphMs: 2400,
  fadeMs: 1800,
  delayMs: 120,
  easing(t){ return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
};`);

w(P('src/theater/TransitionService.js'), `// Auto-generated TransitionService (robust)
import * as THREE from 'three';
(async function(){
  function log(...a){ console.log('🎨 TransitionService:', ...a); }
  function warn(...a){ console.warn('🎨 TransitionService:', ...a); }

  // Resolve BeatBus robustly
  let BeatBus=null; let busSource='(none)';
  try { BeatBus=(await import('@/modules/orchestration/core/BeatBusAdapter.js')).default; busSource='BeatBusAdapter'; } catch {}
  if(!BeatBus){ try{ const m=await import('@/modules/orchestration/core/BeatBus.js'); BeatBus=m.default||m.BeatBus; busSource='BeatBus'; }catch{} }
  if(!BeatBus){ BeatBus=globalThis.CANON_BEATBUS; busSource='globalThis.CANON_BEATBUS'; }
  if(!BeatBus||typeof BeatBus.on!=='function'){ warn('BeatBus unavailable; visuals disabled'); return; }

  const palettes = (await import('./palettes.json')).default;
  const { StageBehaviors } = await import('./StageBehaviors.js');

  // Helpers
  const has = (mat,n)=>!!(mat?.uniforms && mat.uniforms[n]);
  const setU = (mat,n,v)=>{
    if(!has(mat,n)) return false;
    const u=mat.uniforms[n];
    if(u.value && u.value.isColor){
      const c = v?.isColor ? v : new THREE.Color(v);
      u.value.copy(c);
    } else { u.value = v; }
    return true;
  };

  function getScene(){ return (globalThis.__r3f||globalThis).scene; }
  function findPointsMaterialOnce(){
    const s=getScene(); if(!s||!s.traverse) return null;
    let mat=null; s.traverse(o=>{ if(!mat && (o.isPoints||o.type==='Points')) mat=o.material; });
    return mat||null;
  }
  async function waitForPoints(ms=4000){
    const t0=performance.now();
    return await new Promise(res=>{
      const tick=()=>{ const m=findPointsMaterialOnce(); if(m) return res(m);
        if(performance.now()-t0>ms) return res(null);
        requestAnimationFrame(tick);
      }; tick();
    });
  }

  let currentStage=null;
  let prevColor = new THREE.Color('#26ff6a');
  let raf=0; let token=0;

  function animate(stage){
    const mat=findPointsMaterialOnce();
    if(!mat){ warn('No Points material found (skipping)'); return; }

    const cfg = palettes[stage] || palettes.genesis;
    const nextColor = new THREE.Color(cfg.primary);

    if(raf) cancelAnimationFrame(raf);
    const my = ++token;

    // Initialize uniforms gently
    setU(mat,'uColorCurrent', prevColor);
    setU(mat,'uColorNext', nextColor);
    setU(mat,'uMorphProgress', 0);
    setU(mat,'uFadeProgress', 0);

    const have = {
      uColorCurrent: has(mat,'uColorCurrent'),
      uColorNext: has(mat,'uColorNext'),
      uMorphProgress: has(mat,'uMorphProgress'),
      uFadeProgress: has(mat,'uFadeProgress'),
    };
    log('animate', {stage, haveUniforms: have});

    const t0=performance.now(), morphT=StageBehaviors.morphMs, fadeT=StageBehaviors.fadeMs, delay=StageBehaviors.delayMs;

    function frame(){
      if(my!==token) return;
      const now=performance.now();
      const em=Math.min(1, Math.max(0,(now-t0-delay)/morphT));
      const ef=Math.min(1, Math.max(0,(now-t0)/fadeT));
      const m=StageBehaviors.easing(em), f=StageBehaviors.easing(ef);
      setU(mat,'uMorphProgress', m);
      setU(mat,'uFadeProgress', f);
      if(ef<1 || em<1){ raf=requestAnimationFrame(frame); }
      else { raf=0; prevColor=nextColor; }
    }
    raf=requestAnimationFrame(frame);
  }

  async function ensureAndAnimate(stage){
    let mat=findPointsMaterialOnce();
    if(!mat){ mat=await waitForPoints(4000); }
    if(!mat){ warn('Points material not found after wait; will still update on next blueprint'); return; }
    animate(stage);
  }

  // Event wiring
  log('online; bus=', ${JSON.stringify('')}+busSource);
  const off1 = BeatBus.on('BLUEPRINT_READY', ({stage})=>{
    if(!stage) return;
    if(currentStage===null){ currentStage=stage; log('first blueprint for', stage, '(establishing baseline)'); return; }
    if(stage===currentStage) return;
    currentStage=stage; ensureAndAnimate(stage);
  });
  const off2 = BeatBus.on('STAGE_CHANGE', ({stage})=>{
    if(!stage) return;
    if(stage===currentStage) return;
    currentStage=stage; ensureAndAnimate(stage);
  });

  // Bootstrap from current state (if available)
  const guessStage = globalThis.stateControls?.getStage?.() || 'genesis';
  currentStage = guessStage;
  // If Points already alive, gently set baseline colors
  const baseline = findPointsMaterialOnce();
  if(baseline){
    const cfg = palettes[guessStage] || palettes.genesis;
    setU(baseline,'uColorCurrent', new THREE.Color(cfg.primary));
    setU(baseline,'uColorNext', new THREE.Color(cfg.primary));
    setU(baseline,'uMorphProgress', 0);
    setU(baseline,'uFadeProgress', 0);
  }

  // Debug surface
  globalThis.stageVisuals = {
    getStatus(){ return { currentStage, attached: true, pointsFound: !!findPointsMaterialOnce(), token }; },
    selfTest: async ()=>{
      const mat = await waitForPoints(1000);
      const report = {
        mat: !!mat,
        uColorCurrent: !!mat?.uniforms?.uColorCurrent,
        uColorNext:    !!mat?.uniforms?.uColorNext,
        uMorphProgress:!!mat?.uniforms?.uMorphProgress,
        uFadeProgress: !!mat?.uniforms?.uFadeProgress,
      };
      console.table(report); return report;
    },
    preview: (stage)=> ensureAndAnimate(stage||'genesis')
  };
})();`);

const main = P('src/main.jsx');
if(!fs.existsSync(main)){ console.error('✖ src/main.jsx not found'); process.exit(2); }
let ms = fs.readFileSync(main,'utf8');
if(!/CanonDoctor:TransitionService/.test(ms)){
  ms += `\n\n// CanonDoctor:TransitionService (DEV only)\nif (import.meta.env.DEV) { try { import('./theater/TransitionService.js'); } catch(e) { console.warn('TransitionService import failed', e); } }\n`;
  w(main, ms);
} else {
  console.log('ℹ src/main.jsx already imports TransitionService (skipped)');
}

// Optional commit
if (process.argv.includes('--commit')) {
  try {
    require('child_process').execSync('git add -A && git commit -m "fix(visuals): robust TransitionService + palettes" && git tag doctor_stage_visuals_fix_'+new Date().toISOString().replace(/[:.]/g,'-'), {stdio:'inherit'});
  } catch(e){ console.warn('⚠ commit/tag skipped:', e.message); }
}
console.log('✅ Visuals doctor applied.\nNext:\n  1) npm run dev\n  2) DevTools → check banner: \"🎨 TransitionService: online\"\n  3) stageVisuals.selfTest()\n  4) stageControls.set(\"discipline\") → watch morph/fade\n');
