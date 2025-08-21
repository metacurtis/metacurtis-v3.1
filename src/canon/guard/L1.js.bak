// [CANON:GUARD:L1]
export class CanonGuardL1 {
  constructor(contracts){ this.contracts=contracts||{}; this.violations=[]; }
  validate(name, payload){
    const c = this.contracts?.events?.[name];
    if (!c) return { valid:true };
    const missing = (c.shape||[]).filter(k => !(k in (payload||{})));
    if (missing.length){ const v = { component:name, message:`Missing keys: ${missing.join(',')}`, payload, level:'error', t:Date.now() }; this.violations.push(v); if (typeof console!=='undefined') console.warn('CanonGuardL1', v.message, payload); return {valid:false, violations:[v]}; }
    return { valid:true };
  }
  getViolations(){ return this.violations.slice(); }
}
