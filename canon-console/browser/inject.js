/* Canon Dev-OS Injector v3.4
 * DEV-only (by host), idempotent, DOM-ready, BeatBus counters, /@fs fallback, early stats()
 */
(() => {
  if (typeof window === 'undefined') return;
  const w = window;

  // --- DEV gating (no import.meta) -------------------------------------------
  const isDevHost = /^(localhost|127\.|0\.0\.0\.0)$/i.test(location.hostname);
  const forceOn   = !!w.__CANON_FORCE_DEV__ || localStorage.getItem('canonDevOsEnabled') === '1';
  const enabled   = isDevHost || forceOn;
  if (!enabled) return;

  // --- Idempotency -----------------------------------------------------------
  if (w.__canonInjectorV3__?.alive === true) return;
  if (!w.__canonInjectorV3__) w.__canonInjectorV3__ = { ts: Date.now(), alive: false };

  // --- Shared state (available immediately) ---------------------------------
  const L = (w.CANON_INJECTOR ||= {}).loaded ||= {
    bridge:false, pilot:false, vtap:false, mini:false, hud:false, steps:false, plays:false
  };

  const busCounts = (w.CANON_CONSOLE ||= {}).busCounts ||= { emit:0, on:0, off:0 };
  const errors    = (w.CANON_CONSOLE.errors ||= []);

  w.CANON_CONSOLE.stats = () => ({
    loaded: { ...L },
    bus:    { ...busCounts },
    mode:   localStorage.getItem('canonBusMode') || 'STRICT',
    ts:     w.__canonInjectorV3__.ts,
    errors: [...errors],
  });
  w.CANON_CONSOLE.setMode = (m) => { try { localStorage.setItem('canonBusMode', m); location.reload(); } catch(e){ errors.push(e); } };
  w.CANON_CONSOLE.showHud = () => { try { localStorage.setItem('canonHud:visible','true');  document.getElementById('canon-hud-v2')?.classList.add('show'); } catch(e){ errors.push(e);} };
  w.CANON_CONSOLE.hideHud = () => { try { localStorage.setItem('canonHud:visible','false'); document.getElementById('canon-hud-v2')?.classList.remove('show'); } catch(e){ errors.push(e);} };

  let resolveReady;
  const readyP = new Promise(r => (resolveReady = r));
  w.CANON_INJECTOR.ready = () => readyP;
  const CORE = ['bridge','pilot','vtap','hud'];
  const maybeReady = () => CORE.every(k => L[k]) && resolveReady?.();

  // First-run HUD visibility default
  try { if (localStorage.getItem('canonHud:visible') == null) localStorage.setItem('canonHud:visible','true'); } catch {}

  // DOM ready gate
  const domReady = () => new Promise(r => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') r();
    else document.addEventListener('DOMContentLoaded', () => r(), { once:true });
  });

  // Import helper (project root → /@fs WSL fallback)
  const FS_ROOT = w.__CANON_FS_BASE__ || '/@fs/home/curtis/projects/metacurtis-v3.1';
  const tryImport = async (spec) => { try { return await import(/* @vite-ignore */ spec); } catch(e){ errors.push(e); return null; } };
  const imp = async (rel, flag, onload) => {
    const p1 = `/canon-console/${rel}`;
    const p2 = `${FS_ROOT}/canon-console/${rel}`;
    let mod = await tryImport(p1); if (!mod) mod = await tryImport(p2);
    if (!mod) { console.warn(`[Canon] Failed to load ${rel} (tried ${p1} and ${p2})`); return null; }
    if (flag) L[flag] = true;
    if (onload) await onload(mod);
    maybeReady();
    return mod;
  };

  // --- BeatBus counters (install early, retry if bus not ready) --------------
  function installBusCounters() {
    try {
      const bus = w.BeatBus;
      if (!bus || bus.__canon_patched) return !!bus;

      const orig = {
        emit: bus.emit?.bind(bus),
        on:   bus.on?.bind(bus),
        off:  bus.off?.bind(bus),
      };
      if (!orig.emit || !orig.on || !orig.off) return false; // not ready yet

      bus.emit = (...args) => { busCounts.emit++; return orig.emit(...args); };
      bus.on   = (...args) => { busCounts.on++;   return orig.on(...args);  };
      bus.off  = (...args) => { busCounts.off++;  return orig.off(...args); };
      bus.__canon_patched = true;
      return true;
    } catch(e){ errors.push(e); return false; }
  }
  async function resolveBusAndPatch() {
    if (installBusCounters()) return;
    const candidates = [
      '/src/theater/bus', '/src/theater/bus.js', '/src/theater/bus/index.js',
      `${FS_ROOT}/src/theater/bus`, `${FS_ROOT}/src/theater/bus.js`
    ];
    for (const c of candidates) {
      const mod = await tryImport(c);
      if (mod) {
        const bus = mod.default || mod.BeatBus || mod;
        if (bus) w.BeatBus = bus;
        if (installBusCounters()) return;
      }
    }
    const t0 = performance.now();
    const iv = setInterval(() => {
      if (installBusCounters() || performance.now() - t0 > 2000) clearInterval(iv);
    }, 100);
  }
  resolveBusAndPatch();

  // --- Orchestrate load (Bridge → Policy/Pilot → Violation-Tap → mini HUD → HUD v2 → Steps → Playbooks)
  (async () => {
    await imp('runtime/bridge-guard.js', 'bridge');

    await imp('agent/policy.js', null);
    await imp('agent/pilot.js', 'pilot', async (m) => {
      try {
        if (typeof m.startPilot === 'function') {
          const state = await m.startPilot({ auto: true });
          w.CANON_PILOT = state || w.CANON_PILOT || {};
        }
      } catch (e) { errors.push(e); console.warn('[Canon] Pilot start failed:', e); }
    });

    await imp('runtime/violation-tap.js', 'vtap');

    await domReady();

    // Ensure counters exist before HUD mounts → numbers show at first paint
    installBusCounters();

    await imp('runtime/pilot-ui-mini.js', 'mini');

    await imp('runtime/hud.js', 'hud', () => {
      try {
        const el = document.getElementById('canon-hud-v2');
        if (!el) return;
        if (localStorage.getItem('canonHud:visible') !== 'false') el.classList.add('show');
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => document.getElementById('canon-hud-v2')?.classList.add('show'), 800);
      } catch(e){ errors.push(e); }
    });

    await imp('runtime/steps.js', 'steps');
    await imp('runtime/playbooks.js', 'plays');

    w.__canonInjectorV3__.alive = true;
    console.debug('[Canon] injector v3.4 ready:', w.CANON_CONSOLE.stats());
    maybeReady();
  })();
})();
