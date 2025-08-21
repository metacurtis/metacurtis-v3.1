// src/dev/unlockConsole.js
// Minimal, safe dev helper: expose SC/BUS, taps, and keep boundary enforced.
(() => {
  const log = (...a) => console.log('[UnlockConsole]', ...a);

  // Re-expose StateCore handles (lazy import so Vite dev path works)
  async function rebindSC() {
    if (window.SC) return;
    try {
      const mod = await import('/src/modules/state/StateCore.js');
      const core = mod.default || mod.stateCore || mod.StateCore;
      if (core) {
        window.StateCore = core;
        window.SC = {
          get: core.get?.bind(core),
          set: core.set?.bind(core),
          snapshot: core.getSnapshot?.bind(core),
          atoms: core.atoms || {},
        };
        log('SC rebound', Object.keys(window.SC.atoms));
      }
    } catch (e) {
      console.warn('[UnlockConsole] StateCore import failed:', e);
    }
  }

  function enforceBoundary() {
    try {
      if (window.BeatBus && window.canon?.boundary && !window.BeatBus.__boundaryEnforced) {
        window.canon.boundary.enforce(window.BeatBus);
        window.BeatBus.__boundaryEnforced = true;
        log('Boundary enforced');
      }
    } catch (e) {
      /* ignore */
    }
  }

  function wrapBus() {
    const BUS = window.BeatBus;
    if (!BUS || BUS.__emitWrapped) return;
    const _emit = BUS.emit?.bind(BUS);
    if (typeof _emit !== 'function') return;
    BUS.emit = (evt, payload) => {
      BUS.lastEmit = { evt, payload, t: Date.now() };
      BUS.eventLog = BUS.eventLog || [];
      BUS.eventLog.push(BUS.lastEmit);
      if (BUS.eventLog.length > 400) BUS.eventLog.shift();
      return _emit(evt, payload);
    };
    BUS.getDebugInfo = () => {
      const listeners = {};
      if (BUS.listeners?.forEach) BUS.listeners.forEach((set, key) => (listeners[key] = set.size));
      return { listeners, lastEmit: BUS.lastEmit, logSize: BUS.eventLog?.length || 0 };
    };
    BUS.__emitWrapped = true;
    log('BeatBus emit wrapped (debug)');
  }

  function installTaps() {
    const BUS = window.BeatBus;
    if (!BUS) return;
    window.busTap =
      window.busTap || ((evt, fn = p => console.log('[tap]', evt, p)) => BUS.on?.(evt, fn));
    [
      'STAGE_CHANGE',
      'QUALITY_CHANGE',
      'BLUEPRINT_READY',
      'STATE_STAGE_UPDATED',
      'STATE_QUALITY_UPDATED',
    ].forEach(ev => window.busTap(ev));
    log('Taps installed');
  }

  function boot() {
    enforceBoundary();
    wrapBus();
    installTaps();
    rebindSC();
    window.__UNLOCK = {
      pause: () => window.BeatBusBridge?.pause?.(),
      resume: () => window.BeatBusBridge?.resume?.(),
      status: () => ({
        boundary: window.canon?.boundary?.getReport?.(),
        bus: window.BeatBus?.getDebugInfo?.(),
        scAtoms: Object.keys(window.SC?.atoms || {}),
      }),
    };
    log('Ready. Shortcuts: window.SC, window.BeatBus, window.__UNLOCK');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();
})();
