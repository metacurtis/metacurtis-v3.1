#!/usr/bin/env node
'use strict';
const fs = require('fs'); const path = require('path');
const root = process.cwd(); const P=(...s)=>path.join(root,...s);
function write(file, code){ fs.mkdirSync(path.dirname(file),{recursive:true});
  if (fs.existsSync(file) && !fs.existsSync(file+'.bak')) fs.copyFileSync(file,file+'.bak');
  fs.writeFileSync(file, code, 'utf8'); console.log('✍️', path.relative(root,file));
}

/* 1) StageChange Relay (DEV) */
write(P('src/theater/StageChangeRelay.js'), `// DEV StageChange Relay (forces STAGE_CHANGE on BeatBus)
(async ()=>{
  if (!import.meta?.env?.DEV) return;
  let BeatBus=null;
  try { BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default; }
  catch { BeatBus = globalThis.CANON_BEATBUS; }
  if (!BeatBus || typeof BeatBus.emit!=='function') {
    console.warn('🔁 StageRelay: BeatBus unavailable'); return;
  }
  let last=null;
  const tick=()=>{ try {
      const s=globalThis.stateControls?.getStage?.();
      if (s && s!==last){ last=s; BeatBus.emit('STAGE_CHANGE',{stage:s,source:'relay'});
        console.log('🔁 StageRelay → STAGE_CHANGE:', s); }
    } catch {}
    requestAnimationFrame(tick);
  };
  console.log('🔁 StageRelay online (DEV, via healthcheck)');
  tick();
})();`);

/* 2) TransitionService (color/fade driver with uniform fallbacks) */
write(P('src/theater/TransitionService.js'), `// TransitionService (DEV): drives color fade/morph on stage/blueprint changes
import * as THREE from 'three';
(async ()=>{
  function log(...a){ console.log('🎨 TransitionService:', ...a); }
  function warn(...a){ console.warn('🎨 TransitionService:', ...a); }
  let BeatBus=null;
  try { BeatBus=(await import('@/modules/orchestration/core/BeatBusAdapter.js')).default; } catch {}
  if (!BeatBus) BeatBus = globalThis.CANON_BEATBUS;
  if (!BeatBus || typeof BeatBus.on!=='function'){ warn('BeatBus unavailable'); return; }

  const palettes={ genesis:'#26ff6a', discipline:'#2ad4ff', neural:'#b07cff',
    velocity:'#ffb300', architecture:'#ff6f91', harmony:'#a6ff00', transcendence:'#00ffe9' };

  const U={ cur:['uColorCurrent','uColorA','uStageColor','uTint','uColor'],
            next:['uColorNext','uColorB','uNextColor','uTargetColor'],
            fade:['uFadeProgress','uFade','uT'],
            morph:['uMorphProgress','uMorph','uMix'] };
  const getScene=()=> (globalThis.__r3f||globalThis).scene;
  const findMat=()=>{ const s=getScene(); let m=null; s?.traverse?.(o=>{ if(!m&&(o.isPoints||o.type==='Points')) m=o.material; }); return m; };
  const findU=(m,arr)=>arr.find(n=>m?.uniforms && m.uniforms[n]!=null) || null;
  const setU=(m,n,val)=>{ if(!m?.uniforms?.[n]) return false; const u=m.uniforms[n];
    if (u.value && u.value.isColor){ const c=val?.isColor?val:new THREE.Color(val); u.value.copy(c); }
    else { u.value=val; } return true; };

  async function animateTo(stage){
    const m=findMat(); if(!m){ warn('No Points material'); return; }
    const uC=findU(m,U.cur), uN=findU(m,U.next), uF=findU(m,U.fade), uM=findU(m,U.morph);
    log('animateTo', {stage, uniforms:{uC,uN,uF,uM}});
    const next=new THREE.Color(palettes[stage]||palettes.genesis);
    if(uC) setU(m,uC, m.uniforms[uC]?.value?.isColor? m.uniforms[uC].value : next);
    if(uN) setU(m,uN,next);
    if(uF) setU(m,uF,0.0);
    if(uM) setU(m,uM,0.0);
    m.needsUpdate=true;
    const t0=performance.now(), morphT=2400, fadeT=1800;
    const ease=t=> t<0.5? 4*t*t*t : 1-(((-2*t+2)**3)/2);
    const step=()=>{ const now=performance.now();
      const em=Math.min(1,(now-t0-120)/morphT); const ef=Math.min(1,(now-t0)/fadeT);
      if(uM) setU(m,uM, ease(Math.max(0,em)));
      if(uF) setU(m,uF, ease(Math.max(0,ef)));
      m.needsUpdate=true;
      if(ef<1 || em<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let current=globalThis.stateControls?.getStage?.()||'genesis';
  BeatBus.on('BLUEPRINT_READY',({stage})=>{ if(stage && stage!==current){ current=stage; animateTo(stage);} });
  BeatBus.on('STAGE_CHANGE',({stage})=>{ if(stage && stage!==current){ current=stage; animateTo(stage);} });

  globalThis.stageVisuals={
    getStatus(){ const m=findMat(); return {stage:current, points:!!m}; },
    preview:(s)=>animateTo(s||'genesis'),
    selfTest(){ const m=findMat(); const keys=m?.uniforms?Object.keys(m.uniforms):[];
      const has=(list)=>!!keys.find(k=>list.includes(k));
      const out={ mat:!!m, uColorCurrent:has(U.cur), uColorNext:has(U.next), uFade:has(U.fade), uMorph:has(U.morph) };
      console.table(out); return out; }
  };

  log('online (via healthcheck)');
})();`);

/* 3) Force-load both from renderHealthcheck.js (which we know is executing) */
const hc = P('src/dev/renderHealthcheck.js');
if (!fs.existsSync(hc)) { console.error('✖ src/dev/renderHealthcheck.js not found'); process.exit(2); }
let txt = fs.readFileSync(hc,'utf8');
if (!/StageChangeRelay\.js/.test(txt) || !/TransitionService\.js/.test(txt)) {
  txt += `

/* Inject DEV orchestration helpers */
if (import.meta.env.DEV) {
  try { import('../theater/StageChangeRelay.js'); console.log('🔁 StageRelay injected via healthcheck'); } catch(e){ console.warn('StageRelay inject failed', e); }
  try { import('../theater/TransitionService.js'); console.log('🎨 TransitionService injected via healthcheck'); } catch(e){ console.warn('TransitionService inject failed', e); }
}
`;
  write(hc, txt);
} else {
  console.log('ℹ renderHealthcheck.js already wires helpers (skipped)');
}

/* Optional commit */
if (process.argv.includes('--commit')) {
  try {
    require('child_process').execSync(
      'git add -A && git commit -m "chore(dev): force-wire StageRelay + TransitionService via healthcheck" && git tag doctor_visuals_forcewire_'+new Date().toISOString().replace(/[:.]/g,'-'),
      {stdio:'inherit'}
    );
  } catch(e){ console.warn('⚠ commit skipped:', e.message); }
}
console.log('✅ Force-wire complete. Next:\n  1) npm run dev (hard reload if needed)\n  2) Look for: \"🔁 StageRelay online\" and \"🎨 TransitionService: online\"\n  3) In DevTools: stageControls.set(\"discipline\"); stageVisuals.getStatus();\n  4) You should see a color/morph transition. If not, run the uniform scan below and paste me the result.\n');
