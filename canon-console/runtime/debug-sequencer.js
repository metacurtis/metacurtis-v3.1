// Debug Sequencer + BeatBus Tap (DEV)
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

(function arm(){
  if (globalThis.__CANON_SEQ_ARMED__) { console.log('✓ Sequencer already armed'); return; }
  globalThis.__CANON_SEQ_ARMED__ = true;

  // Tap bus.emit for visibility
  try {
    const orig = BeatBus.emit?.bind(BeatBus);
    if (!BeatBus.__tapped && typeof orig === 'function') {
      BeatBus.emit = (ev, payload) => {
        const t = Math.round(performance.now());
        console.log('📡 BUS EMIT', ev, { t, ...(payload||{}) });
        return orig(ev, payload);
      };
      BeatBus.__tapped = true;
      console.log('✅ BeatBus tap active');
    }
  } catch (e) { console.warn('BeatBus tap failed', e); }

  // Timeline listeners
  const WANT = [
    'PREWARM_GENESIS_BLUEPRINT','PREWARM_COMPLETE','BUILD_EMERGENCE_BLUEPRINT',
    'BLUEPRINT_READY','PARTICLES_START_EMERGING','PARTICLES_EMERGED'
  ];
  const KEYS = WANT.map(k => E[k] || k);
  const log = [];
  const offs = KEYS.map(ev => BeatBus.on(ev, payload => {
    const t = performance.now();
    log.push({ ev, t, payload });
    const dt = log.length>1 ? Math.round(t - log[log.length-2].t) : 0;
    console.log('🧭 seq', ev, { dt });
  }));

  function dump(){
    const rows = log.map((x,i)=>({ i, ev:x.ev, dt: i? Math.round(x.t-log[i-1].t):0 }));
    if (rows.length) { console.groupCollapsed('🧭 Emergence timeline'); console.table(rows); console.groupEnd(); }
    else { console.log('🧭 No events captured yet'); }
  }
  function clear(){ log.length=0; console.log('🧭 seq log cleared'); }
  async function probe(){
    try { BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); } catch {}
    try { BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); } catch {}
    console.log('🧪 probe fired (prewarm + build)');
    setTimeout(()=>{
      const seen = log.some(x=>x.ev === (E.PARTICLES_EMERGED || 'PARTICLES_EMERGED'));
      if (!seen) console.warn('⚠️ No PARTICLES_EMERGED within 6s — check renderer mount / DEV shim');
    }, 6000);
  }
  globalThis.CANON_SEQ = { dump, clear, probe, log, offs };
  console.log('✅ Sequencer debug armed (CANON_SEQ)');
})();