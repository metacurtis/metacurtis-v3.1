// EmergenceEventShims — dev-only safety signals for verify flows
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as THEATER_EVENTS } from '@/theater/events.js';

(function(){
  if (globalThis.__EMERGENCE_EVENT_SHIMS__) return;
  const E = THEATER_EVENTS || {};
  const PREWARM_ASK = E.PREWARM_GENESIS_BLUEPRINT || 'PREWARM_GENESIS_BLUEPRINT';
  const BUILD_ASK   = E.BUILD_EMERGENCE_BLUEPRINT   || 'BUILD_EMERGENCE_BLUEPRINT';
  const PREWARM_DONE= E.PREWARM_COMPLETE            || 'PREWARM_COMPLETE';
  const EMERGED     = E.PARTICLES_EMERGED           || 'PARTICLES_EMERGED';

  const seen = { prewarm:false, emerged:false };
  const log = (...a)=>{ try{ console.log(...a); }catch{} };

  // When prewarm/build is requested, schedule a PREWARM_COMPLETE shortly after.
  const on = (ev,fn)=>{ try { return BeatBus.on(ev, fn); } catch { return ()=>{}; } };
  const off1 = on(PREWARM_ASK, schedulePrewarmComplete);
  const off2 = on(BUILD_ASK,   schedulePrewarmComplete);

  let prewarmTimer = null;
  function schedulePrewarmComplete(){
    if (seen.prewarm) return;
    clearTimeout(prewarmTimer);
    prewarmTimer = setTimeout(()=>{
      if (!seen.prewarm) {
        try { BeatBus.emit(PREWARM_DONE, { via:'shim', at: Date.now() }); } catch {}
        seen.prewarm = true;
        log('🟢 shim:', PREWARM_DONE);
      }
    }, 300);
  }

  // Poll scene for a Points object; when found, emit PARTICLES_EMERGED once.
  const poll = setInterval(()=>{
    try{
      if (seen.emerged) return;
      const scene = (globalThis.__r3f || globalThis).scene;
      if (!scene) return;
      let found = false;
      scene.traverse?.(o => { if (o?.isPoints || o?.type === 'Points') found = true; });
      if (found) {
        seen.emerged = true;
        clearInterval(poll);
        try { BeatBus.emit(EMERGED, { via:'shim', at: Date.now() }); } catch {}
        log('🟢 shim:', EMERGED);
      }
    } catch {}
  }, 250);

  globalThis.__EMERGENCE_EVENT_SHIMS__ = {
    off(){ try{off1&&off1();}catch{} try{off2&&off2();}catch{} try{clearInterval(poll);}catch{} }
  };
  log('✅ EmergenceEventShims active (DEV)');
})();
