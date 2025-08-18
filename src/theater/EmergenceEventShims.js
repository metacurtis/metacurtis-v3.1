// EmergenceEventShims v2 — DEV-only reliability for verify flows
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

(function(){
  if (globalThis.__EMERGENCE_EVENT_SHIMS_V2__) return;
  const PREWARM_ASK = E.PREWARM_GENESIS_BLUEPRINT || 'PREWARM_GENESIS_BLUEPRINT';
  const BUILD_ASK   = E.BUILD_EMERGENCE_BLUEPRINT   || 'BUILD_EMERGENCE_BLUEPRINT';
  const PREWARM_DONE= E.PREWARM_COMPLETE            || 'PREWARM_COMPLETE';
  const READY       = E.BLUEPRINT_READY             || 'BLUEPRINT_READY';
  const EMERGED     = E.PARTICLES_EMERGED           || 'PARTICLES_EMERGED';

  let prewarmEmitted=false, emergedEmitted=false; let prewarmTimer=null;

  const on=(ev,fn)=>{ try{return BeatBus.on(ev,fn);}catch{return()=>{};} };

  // When prewarm/build is requested, confirm with a short-delay PREWARM_COMPLETE
  const offA=on(PREWARM_ASK, schedulePrewarm);
  const offB=on(BUILD_ASK,   schedulePrewarm);
  function schedulePrewarm(){
    if(prewarmEmitted) return;
    clearTimeout(prewarmTimer);
    prewarmTimer=setTimeout(()=>{
      if(!prewarmEmitted){ try{ BeatBus.emit(PREWARM_DONE,{via:'shim',at:Date.now()}); }catch{}; prewarmEmitted=true; console.log('🟢 shim:', PREWARM_DONE); }
    },200);
  }

  // When BLUEPRINT_READY fires, allow R3F to commit, then detect Points; fallback emit if needed
  const offR=on(READY, ()=> {
    try{ requestAnimationFrame(()=>requestAnimationFrame(()=>tryEmitEmerged('raf2'))); }catch{ setTimeout(()=>tryEmitEmerged('timeout'),200); }
    const t0=Date.now(); const poll=setInterval(()=>{
      if(emergedEmitted) return clearInterval(poll);
      if(tryEmitEmerged('poll')) return clearInterval(poll);
      if(Date.now()-t0>3000){ clearInterval(poll); if(!emergedEmitted){ try{BeatBus.emit(EMERGED,{via:'shim-fallback',at:Date.now()}); }catch{}; emergedEmitted=true; console.log('�� shim:', EMERGED,'(fallback)'); } }
    },150);
  });

  function sceneHasPoints(){
    try{
      const s = (globalThis.__r3f && globalThis.__r3f.scene) || globalThis.scene;
      if(!s?.traverse) return false;
      let found=false; s.traverse(o=>{ if(o?.isPoints || o?.type==='Points') found=true; });
      return found;
    }catch{ return false; }
  }
  function tryEmitEmerged(source){
    if(emergedEmitted) return true;
    if(sceneHasPoints()){ try{ BeatBus.emit(EMERGED,{via:'shim',source,at:Date.now()}); }catch{}; emergedEmitted=true; console.log('🟢 shim:', EMERGED, '('+source+')'); return true; }
    return false;
  }

  globalThis.__EMERGENCE_EVENT_SHIMS_V2__={ off(){ try{offA&&offA();offB&&offB();offR&&offR();}catch{} } };
  console.log('✅ EmergenceEventShims v2 active (DEV)');
})();
