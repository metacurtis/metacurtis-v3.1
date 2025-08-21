#!/usr/bin/env node
/**
 * doctor_boundary_min.cjs
 * Purpose: ensure canon.boundary.enforce(window.BeatBus) is active in DEV, even with HMR timing.
 * - Creates src/dev/boundarySentinel.js (idempotent)
 * - Ensures src/main.jsx loads it in DEV
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MAIN = path.join(ROOT, 'src', 'main.jsx');
const SENTINEL = path.join(ROOT, 'src', 'dev', 'boundarySentinel.js');

function ensureSentinel() {
  const code = `// DEV-only Boundary Sentinel (minimal)
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
    bus.emit = function(evt, payload) {
      if (!bus.__boundaryEnforced) enforce();
      try { return orig(evt, payload); }
      finally {
        window.__BOUNDARY_EMITS = window.__BOUNDARY_EMITS || [];
        window.__BOUNDARY_EMITS.push({ evt, t: Date.now() });
        if (window.__BOUNDARY_EMITS.length > 300) window.__BOUNDARY_EMITS.shift();
      }
    };
    bus.__emitWrapped = true;
    log('emit() wrapped for telemetry');
  }

  function start() {
    enforce(); wrapEmit();
    const id = setInterval(() => { enforce(); wrapEmit(); }, 250);
    setTimeout(() => clearInterval(id), 5000);

    // tiny DEV helpers
    if (!('BUS' in window)) Object.defineProperty(window, 'BUS', { get: () => window.BeatBus });
    window.busTap = window.busTap || ((evt, fn) => window.BeatBus?.on?.(evt, fn));
    window.tap = window.tap || ((evt, fn = (p) => console.log('[tap]', evt, p)) => window.busTap(evt, fn));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
`;
  fs.mkdirSync(path.dirname(SENTINEL), { recursive: true });
  if (!fs.existsSync(SENTINEL) || fs.readFileSync(SENTINEL, 'utf8') !== code) {
    fs.writeFileSync(SENTINEL, code, 'utf8');
    console.log('✅ wrote src/dev/boundarySentinel.js');
  } else {
    console.log('ℹ️ src/dev/boundarySentinel.js already up-to-date');
  }
}

function patchMain() {
  if (!fs.existsSync(MAIN)) {
    console.warn('⚠️ src/main.jsx not found; skip patch');
    return;
  }
  let s = fs.readFileSync(MAIN, 'utf8');
  if (s.includes("dev/boundarySentinel.js")) {
    console.log('ℹ️ main.jsx already loads boundarySentinel');
    return;
  }
  const devBlock = `if (import.meta.env.DEV) {
  import('./dev/boundarySentinel.js').then(() => console.log('BoundarySentinel active'));
}
`;
  // Try to append near the end to avoid parser surprises
  s = s.trimEnd() + '\n\n' + devBlock;
  fs.writeFileSync(MAIN, s, 'utf8');
  console.log('✅ patched src/main.jsx to load boundarySentinel in DEV');
}

ensureSentinel();
patchMain();
console.log('🎯 Minimal boundary doctor complete.');
