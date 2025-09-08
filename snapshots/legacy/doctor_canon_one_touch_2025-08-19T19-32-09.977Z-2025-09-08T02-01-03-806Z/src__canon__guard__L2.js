// __CANON_INSTALLED__
import CANON_CONTRACTS from '@/canon/contracts/events.js';
import BeatBus from '@/src/src/modules/orchestration/core/BeatBus.js';

class CanonGuardL2 {
  constructor(){
    this.violations = [];
    this.version = CANON_CONTRACTS.version;
    this.events = CANON_CONTRACTS.events;
    this._wire();
  }
  _wire(){
    Object.keys(this.events).forEach(evt=>{
      BeatBus.on(evt, (p)=>{
        // post-emit validation (should already be canonical)
        const spec = this.events[evt]; const req = spec.required||[];
        const missing = req.filter(k=> !(k in (p||{})));
        if (missing.length){
          const v = { evt, missing, payload: p, t: Date.now() };
          this.violations.push(v);
          console.warn('🛡️ CanonGuard violation (post)', v);
        }
      });
    });
  }
  getViolations(){ return this.violations.slice(); }
  clear(){ this.violations.length = 0; }
}

export default CanonGuardL2;
