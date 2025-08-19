// __CANON_INSTALLED__
// Central event bus with canonical enforcement.
import CANON_CONTRACTS from '@/canon/contracts/events.js';

class BeatBus {
  constructor(){
    this.listeners = new Map();
    this.eventLog  = [];
    this.maxLog    = 200;
    this._last = { stage: 'genesis', quality: 'HIGH' };
  }

  on(evt, fn){
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn){
    const wrap = (p) => { try{ fn(p); } finally { this.off(evt, wrap); } };
    return this.on(evt, wrap);
  }
  off(evt, fn){
    const set = this.listeners.get(evt); if (!set) return;
    set.delete(fn); if (set.size===0) this.listeners.delete(evt);
  }

  _mode(){
    try {
      const dev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
      const ls = (typeof globalThis !== 'undefined' && globalThis.localStorage) ? localStorage.canonBusMode : null;
      return (ls || (dev ? 'STRICT' : 'TELEMETRY')).toUpperCase();
    } catch { return 'TELEMETRY'; }
  }

  _canonicalize(evt, payload = {}){
    const p = {...payload};
    // tolerant mapping → canonical, tracked as normalized:true
    if (evt==='STAGE_CHANGE'){
      if (p.stage && !p.to) p.to = p.stage;
      if (!p.from) p.from = this._last.stage || 'unknown';
      return { ok: !!(p.from && p.to), out: { from:p.from, to:p.to }, normalized: ('stage' in payload) };
    }
    if (evt==='QUALITY_CHANGE'){
      if (p.quality && !p.tier) p.tier = p.quality;
      return { ok: !!p.tier, out: { tier:p.tier }, normalized: ('quality' in payload) };
    }
    if (evt==='BLUEPRINT_READY'){
      const stage   = p.stage ?? p.to ?? p.name;
      const quality = p.quality ?? p.tier;
      const blueprint = p.blueprint;
      const out = { stage, quality, blueprint, cached: !!p.cached };
      return { ok: !!(stage && quality && blueprint), out, normalized: ('tier' in p || 'to' in p) };
    }
    return { ok: true, out: p, normalized:false };
  }

  _validate(evt, payload){
    const spec = CANON_CONTRACTS.events[evt];
    if (!spec) return { ok:true, missing:[] };
    const required = spec.required || [];
    const missing = required.filter(k => !(k in (payload||{})));
    return { ok: missing.length===0, missing };
  }

  _log(evt, data){
    try {
      this.eventLog.push({ t: Date.now(), evt, data });
      if (this.eventLog.length>this.maxLog) this.eventLog.shift();
    } catch {}
  }

  emit(evt, payload = {}){
    const mode = this._mode();
    const { ok:canonOk, out:canonPayload, normalized } = this._canonicalize(evt, payload);
    const { ok:validOk, missing } = this._validate(evt, canonPayload);

    if (!canonOk || !validOk){
      const msg = `Canon violation: ${evt} missing ${missing.join(',')}`;
      if (mode==='STRICT'){
        console.error('🚫', msg, { payload });
        this._log('VIOLATION', { evt, payload, missing, mode });
        return;
      }
      if (mode==='TELEMETRY' || mode==='TOLERANT'){
        console.warn('⚠️', msg, { payload, mode });
        this._log('VIOLATION', { evt, payload, missing, mode });
        // proceed only in TELEMETRY/TOLERANT if we can form a best-effort payload
        if (!canonOk) return;
      }
    }

    // maintain last state hints for better "from"
    if (evt==='STAGE_CHANGE' && canonPayload?.to) this._last.stage = canonPayload.to;
    if (evt==='QUALITY_CHANGE' && canonPayload?.tier) this._last.quality = canonPayload.tier;

    this._log(evt, { payload: canonPayload, normalized });
    const set = this.listeners.get(evt); if (!set || set.size===0) return;

    set.forEach(fn => {
      try { fn(canonPayload); }
      catch(e){ console.error(`🚌 listener error @ ${evt}`, e); }
    });
  }

  getDebugInfo(){
    const map = {};
    this.listeners.forEach((s, k)=> map[k] = s.size);
    return {
      mode: this._mode(),
      last: {...this._last},
      listeners: map,
      recent: this.eventLog.slice(-10)
    };
  }
}

const beatBus = new BeatBus();

// DEV globals (optional)
if (typeof window !== 'undefined'){
  if (import.meta?.env?.DEV){
    globalThis.BeatBus = beatBus;
    globalThis.busTap = (evt, fn) => {
      const off = beatBus.on(evt, fn);
      console.log('�� busTap', evt);
      return off;
    };
    console.log('🚌 BeatBus ready · mode=', beatBus._mode());
  }
}

export default beatBus;
export { BeatBus };
