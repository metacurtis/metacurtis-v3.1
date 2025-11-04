// src/modules/state/core/StateController.js
// Canon StateController — singleton with before/after write hooks
// Exports both default and named { StateController } to satisfy all imports.

class StateController {
  static #instance = null;

  static getInstance(initial = {}) {
    if (!StateController.#instance) {
      StateController.#instance = new StateController(initial);
    }
    return StateController.#instance;
  }

  constructor(initial = {}) {
    if (StateController.#instance) return StateController.#instance;

    this.state = {
      stage: 'genesis',
      tier: 'HIGH',                 // LOW|MEDIUM|HIGH|ULTRA
      morph: { progress: 0 },       // 0..1
      color: { palette: 'default', override: null },
      camera: { mode: 'orbit', target: [0, 0, 0] },
      session: { startedAt: Date.now() },
      ...initial,
    };

    this.beforeWrite = new Set();
    this.afterWrite = new Set();
    this.subscribers = new Set();
    this.history = [];
    this.maxHistory = 100;
    this.bus = null; // optional BeatBus bridge

    StateController.#instance = this;

    if (import.meta.env.DEV) {
      // Easy dev access
      window.SC = this;
      console.log('🧭 StateController ready (window.SC)');
    }
  }

  /** read */
  get() { return this.state; }
  snapshot() { return JSON.parse(JSON.stringify(this.state)); }
  select(selector) { try { return selector(this.state); } catch { return undefined; } }

  /** subscribe */
  onBeforeWrite(fn) { this.beforeWrite.add(fn); return () => this.beforeWrite.delete(fn); }
  onAfterWrite(fn)  { this.afterWrite.add(fn);  return () => this.afterWrite.delete(fn); }
  subscribe(fn)     { this.subscribers.add(fn); return () => this.subscribers.delete(fn); }

  /** core write (immutable-ish shallow merge) */
  write(category, patch, meta = {}) {
    const prev = this.state;
    const next = { ...prev, ...patch };

    // before hooks
    for (const fn of this.beforeWrite) {
      try { fn(prev, { category, patch, meta }); } catch (e) { console.warn('beforeWrite error:', e); }
    }

    this.state = next;

    const entry = { ts: Date.now(), category, patch, meta, prev, next };
    this.history.push(entry);
    if (this.history.length > this.maxHistory) this.history.shift();

    // after hooks
    for (const fn of this.afterWrite) {
      try { fn(this.state, entry); } catch (e) { console.warn('afterWrite error:', e); }
    }
    // subscribers
    for (const fn of this.subscribers) {
      try { fn(this.state, entry); } catch (e) { console.warn('subscriber error:', e); }
    }

    return next;
  }

  /** convenience APIs */
  setStage(to, meta = {}) {
    const from = this.state.stage;
    this.write('transition', { stage: to }, meta);
    if (this.bus?.emit) this.bus.emit('STAGE_CHANGE', { from, to });
  }

  setTier(tier, meta = {}) {
    this.write('quality', { tier }, meta);
    if (this.bus?.emit) this.bus.emit('QUALITY_CHANGE', { tier });
  }

  setMorphProgress(value, meta = {}) {
    const v = Math.max(0, Math.min(1, Number(value) || 0));
    this.write('morph', { morph: { ...this.state.morph, progress: v } }, meta);
    if (this.bus?.emit) this.bus.emit('MORPH_PROGRESS', { value: v });
  }

  /** optional BeatBus bridge */
  attachBus(BeatBus) {
    this.bus = BeatBus || null;
    return () => { this.bus = null; };
  }

  /** dispose */
  dispose() {
    this.beforeWrite.clear();
    this.afterWrite.clear();
    this.subscribers.clear();
  }
}

export default StateController;
export { StateController };
