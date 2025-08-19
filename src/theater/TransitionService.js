// TransitionService (DEV): drives color fade/morph on stage/blueprint changes
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
})();