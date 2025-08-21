// @doctor:4b-disposers
const __doctorDisposers = []; // [CANON:GUARD:L1]
export class CanonGuardL1 {constructor(contracts) {this.contracts = contracts || {};this.violations = [];}
  validate(name, payload) {
    const c = this.contracts?.events?.[name];
    if (!c) return { valid: true };
    const missing = (c.shape || []).filter((k) => !(k in (payload || {})));
    if (missing.length) {const v = { component: name, message: `Missing keys: ${missing.join(',')}`, payload, level: 'error', t: Date.now() };this.violations.push(v);if (typeof console !== 'undefined') console.warn('CanonGuardL1', v.message, payload);return { valid: false, violations: [v] };}
    return { valid: true };
  }
  getViolations() {return this.violations.slice();}
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}