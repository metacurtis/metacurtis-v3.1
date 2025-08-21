// __CANON_INSTALLED__
import CANON_CONTRACTS from '@/canon/contracts/events.js';
import BeatBus from '@/modules/orchestration/core/BeatBus.js';


// @doctor:phase4b-hmr-dbdff18d - Component listener cleanup
// @doctor:4b-disposers
const __doctorDisposers = [];const __componentDisposers = [];
// Store original methods if component uses them directly
const __captureUnsub = (unsub) => {
  if (typeof unsub === 'function') {
    __componentDisposers.push(unsub);
  }
  return unsub;
};
class CanonGuardL2 {
  constructor() {
    this.violations = [];
    this.version = CANON_CONTRACTS.version;
    this.events = CANON_CONTRACTS.events;
    this._wire();
  }
  _wire() {
    Object.keys(this.events).forEach((evt) => {// @doctor:4b-handler
      const __doctor_handler_1 = (p) => {
        // post-emit validation (should already be canonical)
        const spec = this.events[evt];const req = spec.required || [];
        const missing = req.filter((k) => !(k in (p || {})));
        if (missing.length) {
          const v = { evt, missing, payload: p, t: Date.now() };
          this.violations.push(v);
          console.warn('🛡️ CanonGuard violation (post)', v);
        }
      }; // @doctor:4b-capture
      const __doctor_unsub_2 = BeatBus.on(evt, __doctor_handler_1);__doctorDisposers.push(__doctor_unsub_2);});
  }
  getViolations() {return this.violations.slice();}
  clear() {this.violations.length = 0;}
}

export default CanonGuardL2;


// @doctor:phase4b-hmr-dbdff18d - HMR dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    __componentDisposers.forEach((d) => {
      try {d();} catch (e) {console.warn('Dispose error:', e);}
    });
    __componentDisposers.length = 0;"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});
  });
}

/* TODO: Wrap listener calls with __captureUnsub:
   const unsub = __captureUnsub(bus.on('EVENT', handler));
   Lines with uncaptured listeners: 14
*/