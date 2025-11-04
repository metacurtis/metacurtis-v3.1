// src/modules/state/bridges/StateDebugger.js
// Facade over EventDebugger so state/index.js can import a default without Vite hard-failing.
// Tries to load EventDebugger at runtime; gracefully no-ops if it's not present.

async function optionalImport(spec) {
  try {
    const mod = await import(/* @vite-ignore */ spec);
    return mod?.default || mod || null;
  } catch {
    return null;
  }
}

async function loadEventDebugger() {
  // 1) Try alias path, but keep it opaque to Vite
  const aliasSpec = '@/modules/orchestration/core/' + 'EventDebugger.js';
  let dbg = await optionalImport(aliasSpec);
  if (dbg) return dbg;

  // 2) Try a relative path from this file (works even if alias is misconfigured)
  const relUrl = new URL('../../orchestration/core/EventDebugger.js', import.meta.url).href;
  dbg = await optionalImport(relUrl);
  if (dbg) return dbg;

  // 3) Fall back to globals if an injector put it on window
  if (typeof window !== 'undefined') {
    if (window.eventDebugger && (window.eventDebugger.toggle || window.eventDebugger.initialize)) {
      return window.eventDebugger; // likely an instance
    }
    if (window.EventDebugger && (window.EventDebugger.getInstance || window.EventDebugger.initialize)) {
      return window.EventDebugger.getInstance ? window.EventDebugger.getInstance() : window.EventDebugger;
    }
  }

  // 4) Nothing found — return a no-op shim
  if (import.meta.env?.DEV) {
    console.warn('ℹ️ StateDebugger: EventDebugger not found. Using no-op shim.');
  }
  return {
    initialize() {},
    toggle() {},
    show() {},
    hide() {},
    clear() {},
    exportLog() {}
  };
}

const _implPromise = loadEventDebugger();

class StateDebugger {
  static #instance = null;

  static getInstance() {
    if (!StateDebugger.#instance) StateDebugger.#instance = new StateDebugger();
    return StateDebugger.#instance;
  }

  constructor() {
    if (StateDebugger.#instance) return StateDebugger.#instance;
    this._impl = null;       // will be set once the promise resolves
    this._pending = [];      // buffer calls until impl is ready

    _implPromise.then((impl) => {
      this._impl = impl;
      // flush buffered calls
      this._pending.forEach(([method, args]) => this._impl[method]?.(...args));
      this._pending = [];
    });

    if (import.meta.env?.DEV) {
      // handy for quick toggles in console
      window.stateDebugger = this;
    }
  }

  // proxy helpers that queue until ready
  _call(method, ...args) {
    if (this._impl) return this._impl[method]?.(...args);
    this._pending.push([method, args]);
    return undefined;
  }

  initialize(opts = {}) { return this._call('initialize', opts); }
  toggle()               { return this._call('toggle'); }
  show()                 { return this._call('show'); }
  hide()                 { return this._call('hide'); }
  clear()                { return this._call('clear'); }
  exportLog()            { return this._call('exportLog'); }
}

export default StateDebugger.getInstance();
export { StateDebugger };
