import { DEFAULT_SCHEMA_VERSION, validateEventPayload } from './schemas.js';

// BeatBus with Canon Dev-OS contract integration
// Uses canon-console contract registry for validation

const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS', 'RENDER_DIRECTIVE']);
const SYNC_EVENTS = new Set(['PARTICLES_EMERGED', 'FENCEPOST_LISTENERS_READY', 'ENABLE_SCROLL']);

class EventProfiler {
  constructor() {
    this.metrics = new Map();
  }

  _now() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }

  _ensure(eventName) {
    if (!this.metrics.has(eventName)) {
      this.metrics.set(eventName, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: -Infinity,
        lastEmit: 0,
      });
    }
  }

  start(eventName) {
    this._ensure(eventName);
    return this._now();
  }

  stop(eventName, startTime) {
    if (typeof startTime !== 'number') return;
    const metric = this.metrics.get(eventName);
    if (!metric) return;
    const duration = this._now() - startTime;
    metric.count += 1;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.lastEmit = this._now();
  }

  report() {
    if (!this.metrics.size) {
      console.info('[eventProfiler] No metrics recorded yet.');
      return;
    }
    const rows = Array.from(this.metrics.entries()).map(([event, metric]) => ({
      Event: event,
      Count: metric.count,
      'Total (ms)': metric.totalTime.toFixed(2),
      'Avg (ms)': (metric.totalTime / metric.count).toFixed(2),
      'Min (ms)': metric.minTime === Infinity ? '0.00' : metric.minTime.toFixed(2),
      'Max (ms)': metric.maxTime === -Infinity ? '0.00' : metric.maxTime.toFixed(2),
    })).sort((a, b) => b['Total (ms)'] - a['Total (ms)']);
    console.table(rows);
  }

  reset() {
    this.metrics.clear();
  }
}

class EventRecorder {
  constructor(bus) {
    this.bus = bus;
    this.recording = false;
    this.events = [];
    this.startTime = 0;
  }

  _now() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }

  _clone(payload) {
    if (typeof structuredClone === 'function') {
      try { return structuredClone(payload); } catch (_) {}
    }
    try {
      return JSON.parse(JSON.stringify(payload));
    } catch (_) {
      return payload;
    }
  }

  start() {
    if (this.recording) return;
    this.recording = true;
    this.startTime = this._now();
    this.events = [];
    console.log('[eventRecorder] 🔴 recording started');
  }

  stop() {
    if (!this.recording) return;
    this.recording = false;
    console.log(`[eventRecorder] ⏹️ recorded ${this.events.length} events`);
  }

  record(eventName, payload) {
    if (!this.recording) return;
    const timestamp = this._now() - this.startTime;
    this.events.push({
      name: eventName,
      payload: this._clone(payload),
      timestamp,
    });
  }

  export() {
    return {
      version: DEFAULT_SCHEMA_VERSION,
      duration: this._now() - this.startTime,
      events: this.events.slice(),
    };
  }

  async replay(recording, options = {}) {
    if (!recording || !Array.isArray(recording.events)) {
      console.warn('[eventRecorder] Invalid recording supplied to replay');
      return;
    }
    const speed = Number(options.speed) > 0 ? options.speed : 1.0;
    const originalState = this.recording;
    this.recording = false;
    console.log('[eventRecorder] ▶️ replaying', recording.events.length, 'events');
    let lastTimestamp = 0;
    for (const event of recording.events) {
      const delay = Math.max(0, (event.timestamp - lastTimestamp) / speed);
      lastTimestamp = event.timestamp;
      await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        this.bus.emit(event.name, this._clone(event.payload));
      } catch (error) {
        console.error('[eventRecorder] replay emit failed', event.name, error);
      }
    }
    console.log('[eventRecorder] ✅ replay complete');
    this.recording = originalState;
  }

  save(filename) {
    if (typeof window === 'undefined') return;
    const data = this.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `events-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getAPI() {
    return {
      start: () => this.start(),
      stop: () => this.stop(),
      export: () => this.export(),
      replay: (recording, speed) => this.replay(recording, { speed }),
      save: (filename) => this.save(filename),
      get events() {
        return this.events;
      },
    };
  }
}

class BeatBus {
  constructor(){
    this.listeners = new Map();
    this.eventLog  = [];
    this.maxLog    = 200;
    this._last = { stage: 'genesis', quality: 'HIGH' };
    this._contracts = null;
    this._batchMap = new Map();
    this._batchFlushScheduled = false;
    this._batchFlushHandle = null;
    this._profiler = new EventProfiler();
    this.middleware = [];
    this._sequence = 0;
    this._recorder = new EventRecorder(this);
    
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

  use(fn){
    if (typeof fn !== 'function') {
      throw new TypeError('[BeatBus] middleware must be a function');
    }
    this.middleware.push(fn);
    return () => {
      const idx = this.middleware.indexOf(fn);
      if (idx >= 0) this.middleware.splice(idx, 1);
    };
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
      const extended = {};
      if (p.index !== undefined) extended.index = p.index;
      if (p.stageIndex !== undefined) extended.stageIndex = p.stageIndex;
      if (p.scrollPercent !== undefined) extended.scrollPercent = p.scrollPercent;
      if (p.localProgress !== undefined) extended.localProgress = p.localProgress;
      if (p.source !== undefined) extended.source = p.source;
      if (p.stage !== undefined) extended.stage = p.stage;
      const out = { from: p.from, to: p.to };
      if (Object.keys(extended).length) out._extended = extended;
      return { ok: !!(p.from && p.to), out, normalized: ('stage' in payload) };
    }
    if (evt==='QUALITY_CHANGE'){
      if (p.quality && !p.tier) p.tier = p.quality;
      const extended = {};
      if (p.particleCount !== undefined) extended.particleCount = p.particleCount;
      if (p.dpr !== undefined) extended.dpr = p.dpr;
      if (p.reason !== undefined) extended.reason = p.reason;
      if (p.from !== undefined) extended.from = p.from;
      if (p.quality !== undefined) extended.quality = p.quality;
      const out = { tier: p.tier };
      if (Object.keys(extended).length) out._extended = extended;
      return { ok: !!p.tier, out, normalized: ('quality' in payload) };
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
    let canonPayloadWithBase = this._applyBaseFields(evt, canonPayload);
    const middlewareResult = this._runMiddleware(evt, canonPayloadWithBase);
    if (middlewareResult.blocked) {
      return;
    }
    canonPayloadWithBase = this._applyBaseFields(evt, middlewareResult.payload);

    // maintain last state hints for better "from"
    if (evt==='STAGE_CHANGE' && canonPayloadWithBase?.to) this._last.stage = canonPayloadWithBase.to;
    if (evt==='QUALITY_CHANGE' && canonPayloadWithBase?.tier) this._last.quality = canonPayloadWithBase.tier;

    const startTime = this._profiler.start(evt);

    if (this._shouldBatch(evt, canonPayloadWithBase)) {
      const existing = this._batchMap.get(evt);
      if (existing) {
        existing.payload = canonPayloadWithBase;
        existing.normalized = normalized;
        existing.startTime = Math.min(existing.startTime, startTime);
      } else {
        this._batchMap.set(evt, { payload: canonPayloadWithBase, normalized, startTime });
      }
      this._scheduleBatchFlush();
      return;
    }

    this._dispatch(evt, canonPayloadWithBase, normalized);
    this._profiler.stop(evt, startTime);
  }

  _now() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }

  _shouldBatch(evt, payload) {
    if (!BATCH_EVENTS.has(evt)) return false;
    if (evt === 'RENDER_DIRECTIVE') {
      if (!payload) return false;
      if (payload.enterQrMode || payload.exitQrMode) return false;
      if (payload.kind) return false;
    }
    return true;
  }

  _scheduleBatchFlush() {
    if (this._batchFlushScheduled) return;
    this._batchFlushScheduled = true;
    const flush = () => {
      this._batchFlushScheduled = false;
      this._batchFlushHandle = null;
      this._flushBatch();
    };
    if (typeof requestAnimationFrame === 'function') {
      this._batchFlushHandle = requestAnimationFrame(flush);
    } else {
      this._batchFlushHandle = setTimeout(flush, 16);
    }
  }

  _flushBatch() {
    if (!this._batchMap.size) return;
    const entries = Array.from(this._batchMap.entries());
    this._batchMap.clear();
    for (const [evt, entry] of entries) {
      const payloadWithBase = this._applyBaseFields(evt, entry.payload);
      this._dispatch(evt, payloadWithBase, entry.normalized);
      this._profiler.stop(evt, entry.startTime);
    }
  }

  _dispatch(evt, payload, normalized) {
    const listenerSet = this.listeners.get(evt);
    const listenerCount = listenerSet ? listenerSet.size : 0;

    if (evt === 'RENDER_DIRECTIVE') {
      console.log('🚌 BeatBus.emit called:', {
        eventName: evt,
        hasPayload: !!payload,
        payloadKeys: payload ? Object.keys(payload) : [],
        listenerCount,
      });
    }

    this._recorder.record(evt, payload);
    this._log(evt, { payload, normalized });
    if (!listenerSet || listenerCount === 0) return;

    if (SYNC_EVENTS.has(evt)) {
      listenerSet.forEach((fn) => this._safeInvoke(fn, evt, payload));
    } else {
      listenerSet.forEach((fn) => this._scheduleAsyncInvoke(fn, evt, payload));
    }
  }

  _applyBaseFields(evt, payload) {
    if (!payload || typeof payload !== 'object') return payload;
    if (typeof payload.timestamp !== 'number' || !Number.isFinite(payload.timestamp)) {
      payload.timestamp = this._now();
    }
    if (!payload.source) {
      payload.source = this._inferSource(evt, payload);
    }
    if (!payload._meta || typeof payload._meta !== 'object') {
      payload._meta = {};
    }
    if (!payload._meta.version) {
      payload._meta.version = DEFAULT_SCHEMA_VERSION;
    }
    if (payload._meta.sequence === undefined || payload._meta.sequence === null) {
      payload._meta.sequence = this._sequence++;
    }
    return payload;
  }

  _inferSource(evt, payload) {
    if (payload && typeof payload.source === 'string' && payload.source.length) {
      return payload.source;
    }
    if (payload?._extended && typeof payload._extended.source === 'string') {
      return payload._extended.source;
    }
    return `beatbus:${evt}`;
  }

  _runMiddleware(evt, payload) {
    let current = payload;
    for (const fn of this.middleware) {
      if (typeof fn !== 'function') continue;
      try {
        const result = fn(evt, current);
        if (result === false) {
          console.warn(`[BeatBus] ${evt} blocked by middleware`, fn.name || 'anonymous');
          return { blocked: true };
        }
        if (result !== undefined) {
          current = result;
        }
      } catch (error) {
        console.error(`[BeatBus] middleware error @ ${evt}`, error);
      }
    }
    return { blocked: false, payload: current };
  }

  _safeInvoke(fn, evt, payload) {
    try {
      fn(payload);
    } catch (error) {
      console.error(`🚌 listener error @ ${evt}`, error);
    }
  }

  _scheduleAsyncInvoke(fn, evt, payload) {
    const invoke = () => this._safeInvoke(fn, evt, payload);
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(invoke);
    } else {
      Promise.resolve().then(invoke);
    }
  }

  reportProfiler() {
    this._profiler.report();
  }

  resetProfiler() {
    this._profiler.reset();
  }

  getRecorder() {
    return this._recorder;
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

const schemaMiddleware = (eventName, payload) => {
  const result = validateEventPayload(eventName, payload);
  if (!result.valid) {
    console.warn(`[BeatBus] Schema violation for ${eventName}`, {
      errors: result.errors,
      payload,
    });
  }
  return payload;
};

beatBus.use(schemaMiddleware);

// Singleton guard: prevent accidental re-instantiation (DEV fails fast)
if (typeof globalThis !== 'undefined') {
  const SYM = '__BEATBUS_SINGLETON__';
  const existing = globalThis[SYM];
  if (existing && existing !== beatBus) {
    throw new Error('[BeatBus] Multiple instances detected');
  }
  globalThis[SYM] = beatBus;
}

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
  if (!window.eventProfiler) {
    window.eventProfiler = {
      report: () => beatBus.reportProfiler(),
      reset: () => beatBus.resetProfiler(),
    };
  }
  if (!window.eventRecorder) {
    const recorderAPI = beatBus.getRecorder().getAPI();
    window.eventRecorder = recorderAPI;
  }
}

export default beatBus;
export { BeatBus };
