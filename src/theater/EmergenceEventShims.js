// EmergenceEventShims (DEV) — synthesize PARTICLES_EMERGED when Points appear
if (!globalThis.__EMERGENCE_EVENT_SHIMS_V3__) {
  globalThis.__EMERGENCE_EVENT_SHIMS_V3__ = true;
  (async () => {
    try {
      const BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default;
      const { EVENTS:E } = await import('@/theater/events.js');

      // Mark prewarm completion if engine forgets to emit it
      BeatBus.on(E.PREWARM_GENESIS_BLUEPRINT, () => {
        setTimeout(()=>BeatBus.emit(E.PREWARM_COMPLETE, { via:'shim' }), 0);
      });

      // After READY, watch for Points and emit EMERGED
      BeatBus.on(E.BLUEPRINT_READY, () => {
        const t0 = performance.now();
        const tryEmit = () => {
          const scene = (window.__r3f || window)?.scene;
          let ok=false;
          scene?.traverse?.(o => { if (o?.isPoints || o?.type === 'Points') ok = true; });
          if (ok) {
            BeatBus.emit(E.PARTICLES_EMERGED, { via:'shim', ms: Math.round(performance.now()-t0) });
            return true;
          }
          return false;
        };
        const iv = setInterval(()=>{ if (tryEmit()) clearInterval(iv); }, 250);
        setTimeout(()=>{ clearInterval(iv); if (!tryEmit()) console.warn('⚠️ Shim: no Points detected; EMERGED not fired'); }, 6500);
      });

      console.log('✅ EmergenceEventShims v3 active (DEV)');
    } catch (e) {
      console.warn('Shim init failed', e);
    }
  })();
}