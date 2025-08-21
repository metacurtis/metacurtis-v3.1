// @doctor:4b-disposers
const __doctorDisposers = []; // @doctor:phase4b-hmr-dbdff18d - Component listener cleanup
const __componentDisposers = [];

// Store original methods if component uses them directly
const __captureUnsub = (unsub) => {
  if (typeof unsub === 'function') {
    __componentDisposers.push(unsub);
  }
  return unsub;
};
// DEV-only Boundary Sentinel (minimal)
// Late-binds boundary enforcement and small dev helpers.
(() => {
  const log = (...a) => console.log('[BoundarySentinel]', ...a);

  function enforce() {
    try {
      const bus = window.BeatBus;
      const canon = window.canon;
      if (bus && canon?.boundary && !bus.__boundaryEnforced) {
        canon.boundary.enforce(bus);
        bus.__boundaryEnforced = true;
        log('✅ boundary enforced (late-bind)');
      }
    } catch (e) {
      console.warn('[BoundarySentinel] enforce failed', e);
    }
  }

  function wrapEmit() {
    const bus = window.BeatBus;
    if (!bus || bus.__emitWrapped) return;
    const orig = bus.emit?.bind(bus);
    if (typeof orig !== 'function') return;
    bus.emit = function (evt, payload) {
      if (!bus.__boundaryEnforced) enforce();
      try {
        return orig(evt, payload);
      } finally {
        window.__BOUNDARY_EMITS = window.__BOUNDARY_EMITS || [];
        window.__BOUNDARY_EMITS.push({ evt, t: Date.now() });
        if (window.__BOUNDARY_EMITS.length > 300) window.__BOUNDARY_EMITS.shift();
      }
    };
    bus.__emitWrapped = true;
    log('emit() wrapped for telemetry');
  }

  function start() {
    enforce();
    wrapEmit();
    const id = setInterval(() => {
      enforce();
      wrapEmit();
    }, 250);
    setTimeout(() => clearInterval(id), 5000);

    // tiny DEV helpers
    if (!('BUS' in window)) Object.defineProperty(window, 'BUS', { get: () => window.BeatBus });
    window.busTap = window.busTap || ((evt, fn) => window.BeatBus?.on?.(evt, fn));
    window.tap =
    window.tap || ((evt, fn = (p) => console.log('[tap]', evt, p)) => window.busTap(evt, fn));
  }

  if (document.readyState === 'loading') {__doctorDisposers.push(() => {
      document.removeEventListener('DOMContentLoaded', start);});document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();


// @doctor:phase4b-hmr-dbdff18d - HMR dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    __componentDisposers.forEach((d) => {
      try {d();} catch (e) {console.warn('Dispose error:', e);}
    });
    __componentDisposers.length = 0;"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});
  });
}

/* TODO: Wrap listener calls with __captureUnsub:
   const unsub = __captureUnsub(bus.on('EVENT', handler));
   Lines with uncaptured listeners: 
*/