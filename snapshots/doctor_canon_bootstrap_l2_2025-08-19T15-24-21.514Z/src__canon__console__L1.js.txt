// [CANON:CONSOLE:L1]
export class CanonConsoleL1 {
  constructor(){ this.patterns=new Map(); this.verbosity='critical'; this._orig = null; if (import.meta?.env?.DEV) this.hijack(); }
  hijack(){
    if (this._orig) return;
    this._orig = { ...console };
    const prio = { error:3, warn:2, log:1 }, thresh = ()=>({critical:3, important:2, verbose:1}[this.verbosity]||3);
    ['log','warn','error'].forEach(m=>{
      console[m] = (...args)=>{ this.detect(m,args);
        if (prio[m] >= thresh()) this._orig[m](...args);
      };
    });
    console.info('🖥️  CanonConsole L1 active');
  }
  restore(){ if(!this._orig) return; Object.assign(console, this._orig); this._orig=null; }
  detect(level,args){ const key = this._hash(args); const p = this.patterns.get(key)||{count:0,first:Date.now()}; p.count++; p.last=Date.now(); this.patterns.set(key,p); if (p.count===5) this._orig.warn('CanonConsole: repeating pattern', args[0]); }
  _hash(args){ try{ return JSON.stringify(args[0]).slice(0,120); }catch{ return String(args[0]).slice(0,120); } }
}
