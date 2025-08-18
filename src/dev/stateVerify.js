// stateVerify — drives & checks prewarm→emergence in DEV
export const stateVerify = {
  async smoke(timeoutMs=6000){
    const BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default;
    const { EVENTS:E } = await import('@/theater/events.js');

    // Re-trigger both flows every run
    try { BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); } catch {}
    try { BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); } catch {}

    const wait = (ev, ms)=> new Promise(res=>{
      let t=setTimeout(()=>{ off?.(); res(false); }, ms);
      const off = BeatBus.on(ev, ()=>{ clearTimeout(t); off&&off(); res(true); });
    });

    const t0=performance.now();
    const prewarm = await wait(E.PREWARM_COMPLETE, Math.min(2000, timeoutMs/3));
    const emerged = await wait(E.PARTICLES_EMERGED, timeoutMs);
    const ms = Math.round(performance.now()-t0);
    const out = { prewarm, emerged, ms };
    console.log('🧪 stateVerify:', out);
    return out;
  }
};
if (typeof window!=='undefined') window.stateVerify = stateVerify;
