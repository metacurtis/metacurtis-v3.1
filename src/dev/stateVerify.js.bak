// stateVerify — tiny DevTools smoke for state→engine path
import State from '@/modules/state/StateController.js';
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as THEATER_EVENTS } from '@/theater/events.js';

function waitOnce(event, timeout=3000){
  return new Promise((resolve)=>{
    let done=false; const off = BeatBus.on(event, (p)=>{ if(done) return; done=true; try{ off&&off(); }catch(_){} resolve({event,p}); });
    setTimeout(()=>{ if(done) return; done=true; try{ off&&off(); }catch(_){} resolve(null); }, timeout);
  });
}

async function smoke(){
  const t0 = (typeof performance!=='undefined'?performance.now():Date.now());
  const pWarm = waitOnce(THEATER_EVENTS.PREWARM_COMPLETE, 2500);
  const pEmerge = waitOnce(THEATER_EVENTS.PARTICLES_EMERGED, 6000);
  State.setStage('genesis');
  const warm = await pWarm;
  const emerge = await pEmerge;
  const dt = (typeof performance!=='undefined'?performance.now():Date.now()) - t0;
  const res = { prewarm: !!warm, emerged: !!emerge, ms: Math.round(dt) };
  try { console.log('🧪 stateVerify:', res); } catch(_){}
  return res;
}

globalThis.stateVerify = { smoke, waitOnce };
globalThis.stateCoreSmoke = smoke;
try { console.log('🧪 stateVerify loaded → run stateVerify.smoke()'); } catch(_){}
