// Canon Sequencer Debug (DEV)
// Records key BeatBus events and provides CANON_SEQ.{probe,dump,clear}
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

const WANT = [
  'PREWARM_GENESIS_BLUEPRINT',
  'PREWARM_COMPLETE',
  'BUILD_EMERGENCE_BLUEPRINT',
  'BLUEPRINT_READY',
  'PARTICLES_START_EMERGING',
  'PARTICLES_EMERGED',
];
const KEYS = WANT.map(k => E[k] || k);
const log = [];
function on(ev){ return BeatBus.on(ev, payload => {
  const t = performance.now();
  log.push({ ev, t, payload });
  const dt = log.length>1 ? Math.round(t - log[log.length-2].t) : 0;
  console.log('🧭 seq', ev, { dt, payload });
  if (ev === (E.PARTICLES_EMERGED || 'PARTICLES_EMERGED')) summarize();
});}
const offs = KEYS.map(on);

function summarize(){
  const rows = log.map((x,i)=>({ i, ev:x.ev, dt: i? Math.round(x.t-log[i-1].t):0 }));
  console.groupCollapsed('🧭 Emergence timeline');
  console.table(rows);
  console.groupEnd();
}

function probe(){
  try{ BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); }catch{}
  try{ BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); }catch{}
  console.log('🧪 probe: fired (prewarm + build)');
  setTimeout(()=>{
    const seen = log.some(x=>x.ev === (E.PARTICLES_EMERGED || 'PARTICLES_EMERGED'));
    if (!seen) console.warn('⚠️ No PARTICLES_EMERGED after 6s — check renderer mount or ensure DEV shim is active.');
  }, 6000);
}

globalThis.CANON_SEQ = { probe, dump:summarize, clear:()=>{ log.length=0; console.log('🧭 seq log cleared'); }, log, offs };
console.log('✅ Sequencer debug armed (CANON_SEQ)');
