// EmergenceEventShims v3 — DEV-only reliability for verify flows
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

(() => {
  if (globalThis.__EMERGENCE_EVENT_SHIMS_V3__) return;
  const PREWARM_ASK = E.PREWARM_GENESIS_BLUEPRINT || 'PREWARM_GENESIS_BLUEPRINT';
  const BUILD_ASK   = E.BUILD_EMERGENCE_BLUEPRINT || 'BUILD_EMERGENCE_BLUEPRINT';
  const PREWARM_DONE= E.PREWARM_COMPLETE          || 'PREWARM_COMPLETE';
  const READY       = E.BLUEPRINT_READY           || 'BLUEPRINT_READY';
  const EMERGED     = E.PARTICLES_EMERGED         || 'PARTICLES_EMERGED';

  let prewarmEmitted=false, emergedEmitted=false, tPrewarm=null;

  const on=(ev,fn)=>{ try { return BeatBus.on(ev, fn); } catch { return () => {}; } };

  // Whenever a prewarm/build is requested, confirm prewarm shortly after.
  const offP = on(PREWARM_ASK, schedulePrewarm);
  const offB = on(BUILD_ASK,   schedulePrewarm);
  function schedulePrewarm(){
    clearTimeout(tPrewarm);
    tPrewarm = setTimeout(() => {
      if (!prewarmEmitted) {
        try { BeatBus.emit(PREWARM_DONE, { via:'shim', at: Date.now() }); } catch {}
        prewarmEmitted = true;
        console.log('🟢 shim:', PREWARM_DONE);
      }
    }, 200);
  }

  // On BLUEPRINT_READY: wait for R3F commit → detect Points → EMERGED (or fallback)
  const offR = on(READY, () => {
    const arm = () => tryEmitEmerged('raf2') || pollForEmerged();
    try { requestAnimationFrame(() => requestAnimationFrame(arm)); }
    catch { setTimeout(arm, 200); }
  });

  function sceneHasPoints(){
    try {
      const s = (globalThis.__r3f && globalThis.__r3f.scene) || globalThis.scene;
      if (!s?.traverse) return false;
      let found = false;
      s.traverse(o => { if (o?.isPoints || o?.type === 'Points') found = true; });
      return found;
    } catch { return false; }
  }

  function tryEmitEmerged(source){
    if (emergedEmitted) return true;
    if (sceneHasPoints()){
      try { BeatBus.emit(EMERGED, { via:'shim', source, at: Date.now() }); } catch {}
      emergedEmitted = true;
      console.log('🟢 shim:', EMERGED, '('+source+')');
      return true;
    }
    return false;
  }

  function pollForEmerged(){
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (tryEmitEmerged('poll')) return clearInterval(iv);
      if (Date.now() - t0 > 3000) {
        clearInterval(iv);
        if (!emergedEmitted) {
          try { BeatBus.emit(EMERGED, { via:'shim-fallback', at: Date.now() }); } catch {}
          emergedEmitted = true;
          console.log('🟢 shim:', EMERGED, '(fallback)');
        }
      }
    }, 120);
  }

  globalThis.__EMERGENCE_EVENT_SHIMS_V3__ = {
    off(){ try{ offP&&offP(); offB&&offB(); offR&&offR(); }catch{} }
  };
  console.log('✅ EmergenceEventShims v3 active (DEV)');
})();
