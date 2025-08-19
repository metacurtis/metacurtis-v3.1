// __CANON_INSTALLED__
import CanonGuardL2 from '@/canon/guard/L2.js';
import { banner, heartbeat } from '@/canon/console/banner.js';

(function init(){
  try {
    const guard = new CanonGuardL2();
    const api = {
      guard,
      status(){
        try {
          const info = (globalThis.BeatBus?.getDebugInfo?.()) || {};
          return {
            contracts: 'v1.0.0',
            mode: info.mode,
            listeners: info.listeners,
            last: info.last,
            violations: guard.getViolations().length
          };
        } catch { return { error:'no bus' }; }
      },
      violations: ()=> guard.getViolations(),
      verbosity(level='INFO'){ localStorage.canonVerbosity = level; return level; },
      perf(){
        // lightweight — real perf is measured externally; keep API for future
        return { note: 'bus timing hooks pluggable', now: Date.now() };
      },
      context(){ /* reserved for future */ }
    };
    globalThis.canon = api;
    globalThis.__CANON_GUARD_ACTIVE = true;
    globalThis.__CANON_CONSOLE_ACTIVE = true;

    if (import.meta?.env?.DEV){
      banner();
      heartbeat(30000);
    }
  } catch (e){
    console.error('Canon init failed', e);
  }
})();
