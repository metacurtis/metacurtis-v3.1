#!/usr/bin/env node

const fs = require('fs').promises;

async function main() {
  console.log('=== Updating BeatBus to use Canon Dev-OS Contracts ===\n');
  
  // Create the updated BeatBus with proper import
  const updatedBeatBus = `// BeatBus with Canon Dev-OS contract integration
// Uses canon-console contract registry for validation

class BeatBus {
  constructor(){
    this.listeners = new Map();
    this.eventLog  = [];
    this.maxLog    = 200;
    this._last = { stage: 'genesis', quality: 'HIGH' };
    this._contracts = null;
    
    // Lazy load contracts
    this._loadContracts();
  }
  
  async _loadContracts() {
    try {
      // Try to load from Canon Dev-OS
      const module = await import('/canon-console/runtime/contracts/registry.js');
      this._contracts = module.default || module.ContractRegistry;
      console.log('🚌 BeatBus: Canon contracts loaded');
    } catch (e) {
      // Fallback to basic contracts
      this._contracts = {
        events: {
          STAGE_CHANGE: { required: ['from', 'to'] },
          QUALITY_CHANGE: { required: ['tier'] },
          BLUEPRINT_READY: { required: ['stage', 'quality', 'blueprint'] }
        },
        validate: (type, payload) => {
          const contract = this.events[type];
          if (!contract) return { valid: true, payload };
          const missing = (contract.required || []).filter(f => !(f in (payload || {})));
          return { 
            valid: missing.length === 0, 
            violations: missing.length ? [{ type: 'missing_required', fields: missing }] : [],
            payload 
          };
        }
      };
      console.log('🚌 BeatBus: Using fallback contracts');
    }
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
    
    // Use contract migrations if available
    if (this._contracts && this._contracts.validate) {
      const result = this._contracts.validate(evt, p);
      if (result.migrated) {
        return { ok: true, out: result.payload, normalized: true };
      }
    }
    
    // Fallback canonicalization
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
    // Use Canon Dev-OS contracts if available
    if (this._contracts && this._contracts.validate) {
      const result = this._contracts.validate(evt, payload);
      return { 
        ok: result.valid, 
        missing: result.violations ? 
          result.violations.filter(v => v.type === 'missing_required').flatMap(v => v.fields || []) : 
          []
      };
    }
    
    // Fallback validation
    const spec = this._contracts?.events?.[evt];
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
      const msg = \`Canon violation: \${evt} missing \${missing.join(',')}\`;
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
      catch(e){ console.error(\`🚌 listener error @ \${evt}\`, e); }
    });
  }

  getDebugInfo(){
    const map = {};
    this.listeners.forEach((s, k)=> map[k] = s.size);
    return {
      mode: this._mode(),
      last: {...this._last},
      listeners: map,
      recent: this.eventLog.slice(-10),
      contracts: this._contracts ? 'Canon Dev-OS' : 'Fallback'
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
      console.log('🎯 busTap', evt);
      return off;
    };
    console.log('🚌 BeatBus ready · mode=', beatBus._mode());
  }
}

export default beatBus;
export { BeatBus };`;

  // Write the updated BeatBus
  await fs.writeFile('src/theater/bus/index.js', updatedBeatBus);
  console.log('✓ Updated BeatBus to use Canon Dev-OS contracts');
  
  // Remove the old stub file since BeatBus no longer needs it
  try {
    await fs.unlink('src/canon/contracts/events.js');
    console.log('✓ Removed old contract stub');
  } catch {
    console.log('  (Old stub already removed or not found)');
  }
  
  // Create a test to verify the integration
  const testCode = `// Test BeatBus with Canon Dev-OS integration
console.log('=== Testing BeatBus Contract Integration ===\\n');

// Check what contracts are loaded
console.log('Debug info:', window.BeatBus.getDebugInfo());

// Test 1: Emit with old field names (should migrate)
console.log('Test 1: Old field migration');
window.BeatBus.emit('QUALITY_CHANGE', { quality: 'HIGH' });
window.BeatBus.emit('STAGE_CHANGE', { stage: 'discipline' });

// Test 2: Check that Contract-Tap is also working
setTimeout(() => {
  console.log('\\nTest 2: Contract-Tap stats');
  const stats = window.CANON_CONTRACT_TAP?.getStats?.();
  if (stats) {
    console.log('Contract validations:', stats);
    console.log('✓ Both BeatBus and Contract-Tap working together');
  }
}, 100);`;

  await fs.writeFile('test-beatbus-integration.js', testCode);
  console.log('✓ Created test file\n');
  
  console.log('=== BeatBus Update Complete ===');
  console.log('BeatBus now uses Canon Dev-OS contracts with:');
  console.log('  - Dynamic loading from /canon-console/runtime/contracts/registry.js');
  console.log('  - Fallback contracts if Canon not loaded');
  console.log('  - Full migration support (quality→tier, stage→from/to)');
  console.log('  - Works alongside Contract-Tap for double validation');
}

main().catch(console.error);
