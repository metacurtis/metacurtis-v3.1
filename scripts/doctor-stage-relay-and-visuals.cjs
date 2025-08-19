#!/usr/bin/env node
'use strict';
const fs = require('fs'); const path = require('path');
const root = process.cwd(); const P=(...s)=>path.join(root,...s);
function writeOnce(file, code){ fs.mkdirSync(path.dirname(file), {recursive:true});
  if (fs.existsSync(file) && !fs.existsSync(file+'.bak')) fs.copyFileSync(file, file+'.bak');
  fs.writeFileSync(file, code, 'utf8'); console.log('✍️', path.relative(root,file));
}

/* 1) DEV StageChange Relay */
const relay = `// DEV-only StageChange Relay (idempotent)
(async function(){
  if (!import.meta?.env?.DEV) return;
  let BeatBus = null;
  try { BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default; }
  catch { BeatBus = globalThis.CANON_BEATBUS; }
  if (!BeatBus || typeof BeatBus.emit !== 'function') {
    console.warn('🔁 StageRelay: BeatBus unavailable'); return;
  }
  let last = null;
  function tick(){
    try {
      const s = globalThis.stateControls?.getStage?.();
      if (s && s !== last) {
        last = s;
        BeatBus.emit('STAGE_CHANGE', { stage: s, source: 'relay' });
        console.log('🔁 StageRelay → STAGE_CHANGE:', s);
      }
    } catch {}
    requestAnimationFrame(tick);
  }
  console.log('🔁 StageRelay online (DEV)');
  tick();
})();`;
writeOnce(P('src/theater/StageChangeRelay.js'), relay);

/* 2) TransitionService (robust color/fade application).
      If you already have TransitionService.js, we’ll replace it with a tougher version. */
const svc = `import * as THREE from 'three';
(async function(){
  function log(...a){ console.log('🎨 TransitionService:', ...a); }
  function warn(...a){ console.warn('🎨 TransitionService:', ...a); }

  // BeatBus
  let BeatBus=null;
  try { BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default; } catch {}
  if (!BeatBus) { BeatBus = globalThis.CANON_BEATBUS; }
  if (!BeatBus || typeof BeatBus.on !== 'function') { warn('BeatBus unavailable'); return; }

  // Palettes (simple defaults)
  const palettes = {
    genesis:'#26ff6a', discipline:'#2ad4ff', neural:'#b07cff',
    velocity:'#ffb300', architecture:'#ff6f91', harmony:'#a6ff00', transcendence:'#00ffe9'
  };

  // Material helpers
  const uniformCandidates = {
    colorCurrent: ['uColorCurrent','uColorA','uStageColor','uTint','uColor'],
    colorNext:    ['uColorNext','uColorB','uNextColor','uTargetColor'],
    fade:         ['uFadeProgress','uFade','uT'],
    morph:        ['uMorphProgress','uMorph','uMix']
  };
  const findU = (mat, names)=>names.find(n => mat?.uniforms && mat.uniforms[n] != null) || null;
  const setU = (mat, name, val)=>{
    try{
      if (!mat?.uniforms?.[name]) return false;
      const u = mat.uniforms[name];
      if (u.value && u.value.isColor) {
        const c = val?.isColor ? val : new THREE.Color(val);
        u.value.copy(c);
      } else {
        u.value = val;
      }
      return true;
    } catch { return false; }
  };
  const getScene = ()=> (globalThis.__r3f||globalThis).scene;
  const findPointsMat = ()=>{
    const s=getScene(); if(!s||!s.traverse) return null;
    let m=null; s.traverse(o=>{ if(!m && (o.isPoints||o.type==='Points')) m=o.material; });
    return m;
  };

  async function animateTo(stage){
    const mat = findPointsMat();
    if (!mat) { warn('No Points material yet'); return; }

    // Resolve uniforms present on this material
    const uC = findU(mat, uniformCandidates.colorCurrent);
    const uN = findU(mat, uniformCandidates.colorNext);
    const uF = findU(mat, uniformCandidates.fade);
    const uM = findU(mat, uniformCandidates.morph);

    log('animateTo', { stage, uniforms:{uC, uN, uF, uM} });

    const next = new THREE.Color(palettes[stage] || palettes.genesis);

    // Initialize
    if (uC) setU(mat, uC, mat.uniforms[uC]?.value?.isColor ? mat.uniforms[uC].value : new THREE.Color(next));
    if (uN) setU(mat, uN, next);
    if (uF) setU(mat, uF, 0.0);
    if (uM) setU(mat, uM, 0.0);
    mat.needsUpdate = true;

    // Drive a 2.4s morph / 1.8s fade
    const t0 = performance.now(); const morphT = 2400; const fadeT = 1800;
    const ease = t=> t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    function frame(){
      const now = performance.now();
      const em = Math.min(1,(now - t0 - 120)/morphT);
      const ef = Math.min(1,(now - t0)/fadeT);
      if (uM) setU(mat, uM, ease(Math.max(0,em)));
      if (uF) setU(mat, uF, ease(Math.max(0,ef)));
      mat.needsUpdate = true;
      if (ef < 1 || em < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Respond to either blueprint swaps or stage changes
  let currentStage = globalThis.stateControls?.getStage?.() || 'genesis';
  BeatBus.on('BLUEPRINT_READY', ({stage})=>{
    if (!stage) return;
    if (stage === currentStage) return;
    currentStage = stage; animateTo(stage);
  });
  BeatBus.on('STAGE_CHANGE', ({stage})=>{
    if (!stage) return;
    if (stage === currentStage) return;
    currentStage = stage; animateTo(stage);
  });

  // Debug surface
  globalThis.stageVisuals = {
    getStatus(){ const m=findPointsMat(); return { stage: currentStage, points: !!m }; },
    preview: (stage)=> animateTo(stage || 'genesis'),
    selfTest: ()=>{
      const m=findPointsMat(); const out = {
        mat: !!m,
        uColorCurrent: !!m?.uniforms && !!Object.keys(m.uniforms).find(k=>['uColorCurrent','uColorA','uStageColor','uTint','uColor'].includes(k)),
        uColorNext: !!m?.uniforms && !!Object.keys(m.uniforms).find(k=>['uColorNext','uColorB','uNextColor','uTargetColor'].includes(k)),
        uFade: !!m?.uniforms && !!Object.keys(m.uniforms).find(k=>['uFadeProgress','uFade','uT'].includes(k)),
        uMorph: !!m?.uniforms && !!Object.keys(m.uniforms).find(k=>['uMorphProgress','uMorph','uMix'].includes(k)),
      };
      console.table(out); return out;
    }
  };

  log('online');
})();
`;
writeOnce(P('src/theater/TransitionService.js'), svc);

/* 3) Ensure DEV imports in main.jsx */
const main = P('src/main.jsx');
if (!fs.existsSync(main)) { console.error('✖ src/main.jsx not found'); process.exit(2); }
let ms = fs.readFileSync(main,'utf8');
let changed = false;
if (!/StageChangeRelay/.test(ms)) {
  ms += `\n// DEV StageChangeRelay\nif (import.meta.env.DEV) { try { import('./theater/StageChangeRelay.js'); } catch(e){ console.warn('StageChangeRelay failed', e); } }\n`;
  changed = true;
}
if (!/TransitionService\.js/.test(ms)) {
  ms += `\n// DEV TransitionService\nif (import.meta.env.DEV) { try { import('./theater/TransitionService.js'); } catch(e){ console.warn('TransitionService failed', e); } }\n`;
  changed = true;
}
if (changed) writeOnce(main, ms); else console.log('ℹ main.jsx already wired (skipped)');

/* Optional commit */
if (process.argv.includes('--commit')) {
  try {
    require('child_process').execSync(
      'git add -A && git commit -m "fix(state/visuals): StageChange relay + robust TransitionService" && git tag doctor_stage_relay_'+new Date().toISOString().replace(/[:.]/g,'-'),
      {stdio:'inherit'}
    );
  } catch(e){ console.warn('⚠ commit skipped:', e.message); }
}
console.log('✅ Stage relay + visuals doctor applied.\nNext:\n  1) npm run dev\n  2) In DevTools: look for \"🔁 StageRelay online\" and \"🎨 TransitionService: online\"\n  3) Run: stageControls.set(\"discipline\"); stageVisuals.getStatus()\n  4) You should see a color fade; if not, tell me which color uniforms your shader actually uses.\n');
