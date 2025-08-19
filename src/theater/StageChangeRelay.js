// DEV StageChange Relay (forces STAGE_CHANGE on BeatBus)
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
})();