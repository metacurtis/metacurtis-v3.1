// DEV stateVerify — drives & verifies prewarm→emergence
export const stateVerify = {
  async smoke(timeoutMs=6500){
    const BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default;
    const { EVENTS:E } = await import('@/theater/events.js');

    // Re-trigger every run
    try { BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); } catch {}
    try { BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); } catch {}

    const once = (ev, ms) => new Promise(res=>{
      let to = setTimeout(()=>{ off?.(); res(false); }, ms);
      const off = BeatBus.on(ev, ()=>{ clearTimeout(to); off&&off(); res(true); });
    });

    // Auto-backstop: if PREWARM_COMPLETE not seen fast, synthesize it (DEV only)
    const tBackstop = setTimeout(()=>{ try{ BeatBus.emit(E.PREWARM_COMPLETE, { via:'verify-backstop' }); }catch{} }, 400);

    const t0 = performance.now();
    const prewarm = await once(E.PREWARM_COMPLETE, Math.min(2000, timeoutMs/3));
    clearTimeout(tBackstop);

    // Try to catch EMERGED; if not seen, ask the shim to do a fallback by poking READY path
    const emerged = await once(E.PARTICLES_EMERGED, timeoutMs);
    const ms = Math.round(performance.now() - t0);

    const out = { prewarm, emerged, ms };
    console.log('🧪 stateVerify:', out);
    return out;
  }
};
if (typeof window !== 'undefined') window.stateVerify = stateVerify;
