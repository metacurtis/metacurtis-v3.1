// TDZ-safe, cycle-resilient BeatBus adapter (singleton)
// Exports a working bus immediately; upgrades to the real BeatBus (if present) after module init.

class FallbackBus {
  constructor(){ this._t = new Map(); }
  on(type, fn){ const a = this._t.get(type)||[]; a.push(fn); this._t.set(type,a); return () => this.off(type, fn); }
  off(type, fn){ const a = this._t.get(type)||[]; const i = a.indexOf(fn); if (i > -1) a.splice(i,1); this._t.set(type,a); }
  emit(type, payload){ (this._t.get(type)||[]).forEach(fn => { try { fn(payload); } catch (e) { console.error('[BeatBus]', e); } }); }
}

let instance = globalThis.__CANON_BEATBUS__ || new FallbackBus();
globalThis.__CANON_BEATBUS__ = instance;
globalThis.CANON_BEATBUS = instance;

export default instance;
export const bus = instance;
export let BeatBusClass = null;

// Try to upgrade AFTER current tick to avoid TDZ on BeatBus.js default/class exports
queueMicrotask(async () => {
  try {
    const mod = await import('@/theater/bus'); // resolved once BeatBus.js is fully initialized
    let next = null;

    if (mod?.default && typeof mod.default.on === 'function') {
      next = mod.default;
    } else if (typeof mod?.BeatBus === 'function') {
      BeatBusClass = mod.BeatBus;
      next = new mod.BeatBus();
    } else if (typeof mod?.BeatBusClass === 'function') {
      BeatBusClass = mod.BeatBusClass;
      next = new mod.BeatBusClass();
    }

    if (next && next !== instance) {
      // migrate listeners so early subscriptions keep working
      const topics = Array.from(instance._t?.keys?.() || []);
      for (const t of topics) {
        for (const fn of (instance._t.get(t) || [])) {
          next.on?.(t, fn);
        }
      }
      globalThis.__CANON_BEATBUS__ = next;
      globalThis.CANON_BEATBUS = next;
      instance = next;
    }
  } catch (_e) {
    // No real BeatBus available (or still loading); fallback is fine.
  }
});
