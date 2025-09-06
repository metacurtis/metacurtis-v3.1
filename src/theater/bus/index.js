// src/theater/bus/index.js
// Canon BeatBus — single source of truth (TDZ-safe), with optional contract checks and light middleware.

import { EVENTS } from '@/theater/events.js';

// Optional contracts (if present). Otherwise the bus runs in telemetry mode.
let CONTRACTS = null;
try {
  CONTRACTS = (await import('@/canon/contracts/events.js')).default || null;
} catch {
  /* no contracts; telemetry mode */
}

class BeatBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    /** @type {Array<Function>} middleware: mw(next) => (evt, payload) => any */
    this.middlewares = [];

    this.eventLog = [];
    this.maxLog = 200;

    this.metrics = { eventsEmitted: 0 };
    this._last = { stage: 'genesis', quality: 'HIGH' };
    this._mode = this._detectMode(); // 'STRICT' | 'TELEMETRY'

    // bind and compose emit pipeline
    this._emitCore = this._emitCore.bind(this);
    this.emit = this._compose();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Subscriptions
  // ────────────────────────────────────────────────────────────────────────────
  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.off(evt, fn);
  }

  once(evt, fn) {
    const wrap = (p) => {
      try { fn(p); } finally { this.off(evt, wrap); }
    };
    return this.on(evt, wrap);
  }

  off(evt, fn) {
    const set = this.listeners.get(evt);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) this.listeners.delete(evt);
  }

  getListenerCount(evt) {
    if (evt) return this.listeners.get(evt)?.size || 0;
    let total = 0;
    this.listeners.forEach(s => total += s.size);
    return total;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Middleware (lightweight)
  // .use(mw) where mw: next => (evt, payload) => any
  // ────────────────────────────────────────────────────────────────────────────
  use(mw) {
    if (typeof mw !== 'function') return () => {};
    this.middlewares.push(mw);
    this.emit = this._compose();
    // return disposer
    return () => {
      const i = this.middlewares.indexOf(mw);
      if (i > -1) this.middlewares.splice(i, 1);
      this.emit = this._compose();
    };
  }

  _compose() {
    let next = this._emitCore;
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      try { next = this.middlewares[i](next); }
      catch (e) { console.warn('[BeatBus] middleware attach failed:', e?.message); }
    }
    return (evt, payload) => next(evt, payload);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Emit (pipeline terminator)
  // ────────────────────────────────────────────────────────────────────────────
  _emitCore(evt, payload = {}) {
    const { ok: canonOk, out: p, normalized } = this._canonicalize(evt, payload);
    const { ok: validOk, missing } = this._validate(evt, p);

    if (!canonOk || !validOk) {
      const msg = `Canon violation: ${evt}${missing?.length ? ` missing ${missing.join(',')}` : ''}`;
      if (this._mode === 'STRICT') {
        console.error('🚫', msg, { payload });
        this._log('VIOLATION', { evt, payload, missing, mode: this._mode });
        return;
      } else {
        console.warn('⚠️', msg, { payload, mode: this._mode });
        this._log('VIOLATION', { evt, payload, missing, mode: this._mode });
        if (!canonOk) return; // cannot proceed if we cannot canonicalize
      }
    }

    // Maintain last state hints
    if (evt === EVENTS.STAGE_CHANGE && p?.to) this._last.stage = p.to;
    if (evt === EVENTS.QUALITY_CHANGE && p?.tier) this._last.quality = p.tier;

    // Deliver
    this.metrics.eventsEmitted++;
    this._log(evt, { payload: p, normalized });

    const set = this.listeners.get(evt);
    if (!set || set.size === 0) return;

    set.forEach(fn => {
      try { fn(p); }
      catch (e) { console.error(`🚌 listener error @ ${evt}`, e); }
    });
  }

  emit(evt, payload = {}) {
    // replaced by composed pipeline in constructor
    return this._emitCore(evt, payload);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Canonicalization / Validation / Logging
  // ────────────────────────────────────────────────────────────────────────────
  _canonicalize(evt, payload = {}) {
    const p = { ...payload };

    if (evt === EVENTS.STAGE_CHANGE) {
      const out = { from: p.from ?? this._last.stage ?? 'unknown', to: p.to ?? p.stage };
      return { ok: !!(out.from && out.to), out, normalized: !!p.stage };
    }

    if (evt === EVENTS.QUALITY_CHANGE) {
      const out = { tier: p.tier ?? p.quality };
      return { ok: !!out.tier, out, normalized: !!p.quality };
    }

    if (evt === EVENTS.BLUEPRINT_READY) {
      const out = {
        stage: p.stage ?? p.to ?? p.name,
        quality: p.quality ?? p.tier,
        blueprint: p.blueprint,
        cached: !!p.cached,
        mode: p.mode
      };
      return { ok: !!(out.stage && out.quality && out.blueprint), out, normalized: !!(p.tier || p.to) };
    }

    // default: pass-through
    return { ok: true, out: p, normalized: false };
  }

  _validate(evt, payload) {
    if (!CONTRACTS) return { ok: true, missing: [] };
    const spec = CONTRACTS.events?.[evt];
    if (!spec) return { ok: true, missing: [] };
    const req = spec.required || [];
    const missing = req.filter(k => !(k in (payload || {})));
    return { ok: missing.length === 0, missing };
  }

  _log(evt, data) {
    try {
      this.eventLog.push({ t: Date.now(), evt, data });
      if (this.eventLog.length > this.maxLog) this.eventLog.shift();
    } catch {}
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Diagnostics
  // ────────────────────────────────────────────────────────────────────────────
  getDebugInfo() {
    const map = {};
    this.listeners.forEach((set, k) => { map[k] = set.size; });
    return {
      mode: this._mode,
      last: { ...this._last },
      listeners: map,
      recent: this.eventLog.slice(-10),
      metrics: { ...this.metrics }
    };
  }

  _detectMode() {
    try {
      const dev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
      const ls = (typeof globalThis !== 'undefined' && globalThis.localStorage) ? localStorage.canonBusMode : null;
      return (ls || (dev ? 'TELEMETRY' : 'TELEMETRY')).toUpperCase();
    } catch { return 'TELEMETRY'; }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TDZ-safe global singleton
// ──────────────────────────────────────────────────────────────────────────────
const singleton = globalThis.__CANON_BEATBUS__ || new BeatBus();
globalThis.__CANON_BEATBUS__ = singleton;

// Optional dev globals
if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
  globalThis.BeatBus = singleton;
  globalThis.busTap = (evt, fn) => {
    const off = singleton.on(evt, fn);
    console.log('🧪 busTap', evt);
    return off;
  };
  // Example: console.table(BeatBus.getDebugInfo().listeners)
  console.log('🚌 BeatBus ready · mode=', singleton.getDebugInfo().mode);
}

export default singleton;
export { BeatBus };
