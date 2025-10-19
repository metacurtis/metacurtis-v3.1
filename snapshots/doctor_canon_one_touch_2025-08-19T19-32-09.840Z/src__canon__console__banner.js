// __CANON_INSTALLED__
import BeatBus from '@/src/src/modules/orchestration/core/BeatBus.js';
let heartbeatTimer;

export function banner(){
  try {
    const info = BeatBus.getDebugInfo();
    const tag = `Canon v1.0 · mode=${info.mode} · listeners=${Object.keys(info.listeners).length}`;
    console.log('%c🛡️ Canon active','color:#7ef;font-weight:bold;', tag);
  } catch(e){}
}

export function heartbeat(periodMs = 45000){
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(()=>{
    const d = BeatBus.getDebugInfo();
    const vCount = (globalThis.canon?.guard?.getViolations()?.length) ?? 0;
    console.log('⏱️ Canon Heartbeat · mode=%s · violations=%d · lastStage=%s · lastQuality=%s',
      d.mode, vCount, d.last?.stage, d.last?.quality);
  }, periodMs);
}
