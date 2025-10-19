/* Canon Dev-OS Injector v3.6 - Complete with Lifecycle Guards & Learning System
 * DEV-only (by host), idempotent, DOM-ready, BeatBus counters, /@fs fallback, early stats()
 */
(() => {
  if (typeof window === 'undefined') return;
  const w = window;

  const isDevHost = /^(localhost|127\.|0\.0\.0\.0)$/i.test(location.hostname);
  const forceOn = !!w.__CANON_FORCE_DEV__ || localStorage.getItem('canonDevOsEnabled') === '1';

  let __forceHud = false;
  try {
    const q = new URLSearchParams(location.search);
    __forceHud = (q.get('hud') === '1') || (location.hash || '').toLowerCase().includes('#hud') || !!window.__CANON_FORCE_HUD__;
    if (__forceHud) localStorage.setItem('canonHud:visible','true');
  } catch {}
  
  if (!(isDevHost || forceOn)) return;

  if (w.__canonInjectorV3__ && w.__canonInjectorV3__.alive === true) return;
  if (!w.__canonInjectorV3__) w.__canonInjectorV3__ = { ts: Date.now(), alive: false };

  var CANON_INJECTOR = w.CANON_INJECTOR || {};
  w.CANON_INJECTOR = CANON_INJECTOR;

  var L = CANON_INJECTOR.loaded || {
    bridge: false, pilot: false, vtap: false, mini: false,
    hud: false, macros: false, steps: false, plays: false,
    contractTap: false, lifecycleGuards: false, learningSystem: false,
    blueprintGuard: false, incidents: false
  };
  CANON_INJECTOR.loaded = L;

  var CANON_CONSOLE = w.CANON_CONSOLE || {};
  w.CANON_CONSOLE = CANON_CONSOLE;

  var busCounts = CANON_CONSOLE.busCounts || { emit: 0, on: 0, off: 0 };
  CANON_CONSOLE.busCounts = busCounts;

  var errors = CANON_CONSOLE.errors || [];
  CANON_CONSOLE.errors = errors;

  CANON_CONSOLE.stats = function () {
    return {
      loaded: Object.assign({}, L),
      bus: Object.assign({}, busCounts),
      mode: (localStorage.getItem('canonBusMode') || 'STRICT'),
      ts: w.__canonInjectorV3__.ts,
      errors: errors.slice()
    };
  };
  
  CANON_CONSOLE.setMode = function (m) {
    try { localStorage.setItem('canonBusMode', m); location.reload(); } catch (e) { errors.push(e); }
  };
  
  CANON_CONSOLE.showHud = function () {
    try {
      localStorage.setItem('canonHud:visible', 'true');
      var el = document.getElementById('canon-hud-v2');
      if (el) {
        el.classList.add('show');
        el.style.display = 'block';
      }
    } catch (e) { errors.push(e); }
  };
  
  CANON_CONSOLE.hideHud = function () {
    try {
      localStorage.setItem('canonHud:visible', 'false');
      var el = document.getElementById('canon-hud-v2');
      if (el) {
        el.classList.remove('show');
        el.style.display = 'none';
      }
    } catch (e) { errors.push(e); }
  };

  var resolveReady = null;
  var readyP = new Promise(function (r) { resolveReady = r; });
  CANON_INJECTOR.ready = function () { return readyP; };
  
  var CORE = ['bridge', 'pilot', 'vtap', 'hud', 'macros'];
  function maybeReady() {
    for (var i = 0; i < CORE.length; i++) { if (!L[CORE[i]]) return; }
    if (resolveReady) resolveReady();
  }

  try {
    if (localStorage.getItem('canonHud:visible') == null) {
      localStorage.setItem('canonHud:visible', 'true');
    }
  } catch (e) {}

  function domReady() {
    return new Promise(function (r) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') r();
      else document.addEventListener('DOMContentLoaded', function () { r(); }, { once: true });
    });
  }

  var FS_ROOT = w.__CANON_FS_BASE__ || '/@fs/home/curtis/projects/metacurtis-v3.1';
  function tryImport(spec) { return import(/* @vite-ignore */ spec).catch(function () { return null; }); }
  
  function imp(rel, flag, onload) {
    var p1 = '/canon-console/' + rel, p2 = FS_ROOT + '/canon-console/' + rel;
    return tryImport(p1).then(function (mod) { return mod || tryImport(p2); })
      .then(function (mod) {
        if (!mod) { console.warn('[Canon] Failed to load', rel, '(tried', p1, 'and', p2, ')'); return null; }
        if (flag) L[flag] = true;
        if (onload) return Promise.resolve(onload(mod)).then(function () { maybeReady(); return mod; });
        maybeReady(); return mod;
      });
  }

  function installBusCounters() {
    try {
      var bus = w.BeatBus; if (!bus || bus.__canon_patched) return !!bus;
      var emit = bus.emit && bus.emit.bind ? bus.emit.bind(bus) : null;
      var on = bus.on && bus.on.bind ? bus.on.bind(bus) : null;
      var off = bus.off && bus.off.bind ? bus.off.bind(bus) : null;
      if (!emit || !on || !off) return false;
      bus.emit = function () { busCounts.emit++; return emit.apply(bus, arguments); };
      bus.on = function () { busCounts.on++; return on.apply(bus, arguments); };
      bus.off = function () { busCounts.off++; return off.apply(bus, arguments); };
      bus.__canon_patched = true; return true;
    } catch (e) { errors.push(e); return false; }
  }

  function resolveBusAndPatch() {
    if (installBusCounters()) return;
    var cands = [
      '/src/theater/bus', '/src/theater/bus.js', '/src/theater/bus/index.js',
      FS_ROOT + '/src/theater/bus', FS_ROOT + '/src/theater/bus.js'
    ];
    (function next(i) {
      if (i >= cands.length) {
        var t0 = performance.now();
        var iv = setInterval(function () {
          if (installBusCounters() || performance.now() - t0 > 2000) clearInterval(iv);
        }, 100);
        return;
      }
      tryImport(cands[i]).then(function (mod) {
        if (mod) {
          var b = mod.default || mod.BeatBus || mod;
          if (b) w.BeatBus = b;
          if (installBusCounters()) return;
        }
        next(i + 1);
      });
    })(0);
  }
  resolveBusAndPatch();

  async function ensureMacrosReady() {
    const ok = () =>
      (typeof window.CANON_CONSOLE?.runMacro === 'function' &&
       typeof window.CANON_CONSOLE?.listMacros === 'function' &&
       Array.isArray(window.CANON_CONSOLE.listMacros()) &&
       window.CANON_CONSOLE.listMacros().length >= 1);

    if (ok()) return true;

    try {
      await import(/* @vite-ignore */ '/canon-console/runtime/hud-macro-core.js?bust=' + Date.now());
    } catch {}

    if (ok()) return true;

    const t0 = performance.now();
    while (performance.now() - t0 < 1500) {
      await new Promise(r => setTimeout(r, 100));
      if (ok()) return true;
    }

    console.warn('[Canon] Macro surface still not ready after retries.');
    return false;
  }

  function forceShowHud() {
    try {
      if (localStorage.getItem('canonHud:visible') === 'false') return;
      
      var attempts = 0;
      var tryShow = function() {
        var el = document.getElementById('canon-hud-v2');
        if (el) {
          el.classList.add('show');
          el.style.display = 'block';
          console.debug('[Canon] HUD made visible (attempt ' + (attempts + 1) + ')');
          return true;
        }
        attempts++;
        if (attempts < 10) {
          setTimeout(tryShow, 200);
        }
        return false;
      };
      
      tryShow();
    } catch (e) { 
      errors.push(e); 
    }
  }

  // Main loading chain
  imp('runtime/bridge-guard.js', 'bridge')
    .then(function () { return imp('agent/policy.js', null); })
    .then(function () {
      return imp('agent/pilot.js', 'pilot', function (m) {
        try {
          if (typeof m.startPilot === 'function') {
            return m.startPilot({ auto: true }).then(function (st) {
              w.CANON_PILOT = st || w.CANON_PILOT || {};
            });
          }
        } catch (e) { errors.push(e); }
      });
    })
    .then(function () { return imp('runtime/violation-tap.js', 'vtap'); })
    .then(function () {
      // Install incident store + sinks
      return imp('runtime/incidents.js', 'incidents', function (m) {
        try {
          if (m?.installIncidentPipeline) {
            m.installIncidentPipeline(w);
          }
        } catch (e) {
          errors.push(e);
          console.warn('Incident pipeline error:', e);
        }
      });
    })
    .then(function () {
      // Install Contract-Tap
      return imp('runtime/contract-tap.js', 'contractTap', function (m) {
        try {
          const BeatBus = w.BeatBus || w.theaterBus?.bus;
          const incidentCollector = w.CANON_CONSOLE?.incidents || { 
            add: function(incident) {
              console.warn('[Contract]', incident.message, incident.context);
            }
          };
          
          if (BeatBus && m.default && m.default.installContractTap) {
            m.default.installContractTap(BeatBus, incidentCollector);
            L.contractTap = true;
            console.log('📝 Contract-Tap installed');
          }
        } catch (e) {
          errors.push(e);
          console.warn('Contract-Tap error:', e);
        }
      });
    })
    .then(function () {
      // Install Lifecycle Guards
      return imp('runtime/lifecycle-guards.js', 'lifecycleGuards', function (m) {
        try {
          const BeatBus = w.BeatBus || w.theaterBus?.bus;
          const incidentCollector = w.CANON_CONSOLE?.incidents || { 
            add: function(incident) { console.warn('[Lifecycle]', incident); }
          };
          
          if (BeatBus && m.default) {
            m.default.install(BeatBus, incidentCollector);
            L.lifecycleGuards = true;
            w.CANON_LIFECYCLE = m.default; // Expose for debugging
            console.log('🛡️ Lifecycle Guards installed');
          }
        } catch (e) {
          errors.push(e);
          console.warn('Lifecycle Guards error:', e);
        }
      });
    })
    .then(function () {
      // Install Learning System
      return imp('runtime/learning-system.js', 'learningSystem', function (m) {
        try {
          const incidentCollector = w.CANON_CONSOLE?.incidents || {
            add: function(incident) { console.warn('[Learning]', incident); }
          };
          
          if (m.default) {
            m.default.install(incidentCollector);
            L.learningSystem = true;
            w.CANON_LEARNING = m.default; // Expose for debugging
            console.log('🧠 Learning System installed');
          }
        } catch (e) {
          errors.push(e);
          console.warn('Learning System error:', e);
        }
      });
    })
    .then(function () {
      // Install Blueprint Guard V2
      return imp('runtime/blueprint-guard-v2.js', 'blueprintGuard', function (m) {
        try {
          const BeatBus = w.BeatBus || w.theaterBus?.bus;
          const incidentCollector = w.CANON_CONSOLE?.incidents || { add: console.warn };
          
          return tryImport('/src/theater/events.js').then(function(evMod) {
            if (evMod && evMod.EVENTS && m.default) {
              m.default.install(BeatBus, incidentCollector, evMod.EVENTS);
              L.blueprintGuard = true;
              console.log('🛡️ Blueprint Guard V2 installed');
            }
          });
        } catch (e) { 
          errors.push(e); 
          console.warn('Blueprint Guard V2 error:', e);
        }
      });
    })
    .then(function () { return domReady(); })
    .then(function () { installBusCounters(); })
    .then(function () { return imp('runtime/pilot-ui-mini.js', 'mini'); })
    .then(function () {
      return imp('runtime/hud.js', 'hud', function () {
        forceShowHud();
      });
    })
    .then(function () { return imp('runtime/hud-macro-core.js', 'macros'); })
    .then(function () { return ensureMacrosReady(); })
    .then(function () { return imp('runtime/steps.js', 'steps'); })
    .then(function () { return imp('runtime/playbooks.js', 'plays'); })
    .then(function () {
      w.__canonInjectorV3__.alive = true;
      console.debug('[Canon] Injector v3.6 ready:', w.CANON_CONSOLE.stats());
      
      forceShowHud();
      
      window.addEventListener('keydown', function(e) {
        if (e.key === 'F2') {
          e.preventDefault();
          var el = document.getElementById('canon-hud-v2');
          if (el) {
            if (el.classList.contains('show')) {
              CANON_CONSOLE.hideHud();
            } else {
              CANON_CONSOLE.showHud();
            }
          }
        }
        
        if (e.ctrlKey && e.key.toLowerCase() === 'h') {
          e.preventDefault();
          var el = document.getElementById('canon-hud-v2');
          if (el) {
            if (el.classList.contains('show')) {
              CANON_CONSOLE.hideHud();
            } else {
              CANON_CONSOLE.showHud();
            }
          }
        }
      }, true);
      
      maybeReady();
    });
})();


// === Single-Writer Watchdog (DEV only) ======================================
// Prevents GPU writes outside renderer - Canon Dev-OS v3.7
// Installed: 2025-09-21T02:38:29.701Z
(function installSingleWriterWatchdog() {
  try {
    if (window.__gpuWatchdogInstalled) return;
    window.__gpuWatchdogInstalled = true;

    const mode = localStorage.getItem('canonSingleWriter') || 'warn';
    const allowlist = [
      'WebGLBackground.jsx',
      'WebGLCanvas.jsx',
      '/src/components/webgl/',
      'renderer'  // Allow any file with 'renderer' in the path
    ];

    window.__gpuViolations = [];
    
    const checkCaller = (fnName) => {
      if (typeof globalThis !== 'undefined' && globalThis.__GPU_WATCHDOG_SUSPEND__ === true) {
        return;
      }
      const stack = new Error().stack || '';
      const allowed = allowlist.some(pattern => stack.includes(pattern));
      
      if (!allowed) {
        // Extract the most relevant caller from stack
        const lines = stack.split('\n');
        const callerLine = lines[3] || lines[2] || 'unknown';
        
        const violation = {
          fn: fnName,
          timestamp: Date.now(),
          caller: callerLine.trim()
        };
        
        window.__gpuViolations.push(violation);
        console.warn('[GPU Watchdog]', fnName, 'from non-renderer:', violation.caller);
        
        // Report to Canon systems
        if (window.BeatBus?.emit) {
          window.BeatBus.emit('CANON_VIOLATION', { 
            type: 'SINGLE_WRITER', 
            ...violation 
          });
        }
        
        if (window.CANON_CONSOLE?.incidents?.add) {
          window.CANON_CONSOLE.incidents.add({
            code: 'SINGLE_WRITER_VIOLATION',
            severity: 'error',
            message: `GPU write from non-renderer: ${fnName}`,
            context: violation
          });
        }
        
        if (mode === 'strict') {
          throw new Error(`GPU SINGLE_WRITER_VIOLATION: ${fnName} from non-renderer`);
        }
      }
    };

    // Wait for THREE.js then patch
    const patchThree = () => {
      if (!window.THREE?.BufferGeometry?.prototype) {
        window.__gpuWatchdogRetries = (window.__gpuWatchdogRetries || 0) + 1;
        if (window.__gpuWatchdogRetries < 50) {
          setTimeout(patchThree, 100);
        } else {
          console.warn('[GPU Watchdog] THREE.js not found after 50 attempts');
        }
        return;
      }

      const proto = window.THREE.BufferGeometry.prototype;
      const orig = {
        setAttribute: proto.setAttribute,
        setDrawRange: proto.setDrawRange
      };
      
      // Patch setAttribute
      proto.setAttribute = function(...args) {
        checkCaller('setAttribute');
        return orig.setAttribute.apply(this, args);
      };
      
      // Patch setDrawRange
      proto.setDrawRange = function(...args) {
        checkCaller('setDrawRange');
        return orig.setDrawRange.apply(this, args);
      };
      
      // Also patch ShaderMaterial uniforms if available
      if (window.THREE.ShaderMaterial?.prototype) {
        const shaderProto = window.THREE.ShaderMaterial.prototype;
        const uniformsDesc = Object.getOwnPropertyDescriptor(shaderProto, 'uniforms');
        if (uniformsDesc?.set) {
          Object.defineProperty(shaderProto, 'uniforms', {
            ...uniformsDesc,
            set: function(value) {
              checkCaller('uniforms.set');
              return uniformsDesc.set.call(this, value);
            }
          });
        }
      }
      
      console.log('🛡️ GPU Watchdog v3.7 active (mode:', mode, ')');
      console.log('📊 Use window.CANON_GPU_WATCHDOG for control');
    };
    
    patchThree();
    
    // Control API
    window.CANON_GPU_WATCHDOG = {
      version: '3.7',
      test: () => {
        if (!window.THREE) return 'THREE.js not loaded yet';
        const before = window.__gpuViolations.length;
        try {
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('test', new THREE.Float32BufferAttribute([0,0,0], 3));
          const after = window.__gpuViolations.length;
          return after > before ? 
            '✅ Watchdog working! Caught violation.' : 
            '❌ No violation caught - check installation';
        } catch(e) {
          return '✅ Strict mode working: ' + e.message;
        }
      },
      getViolations: () => window.__gpuViolations,
      clearViolations: () => { window.__gpuViolations = []; },
      setMode: (m) => { 
        localStorage.setItem('canonSingleWriter', m);
        console.log('[GPU Watchdog] Mode set to:', m);
        return m;
      },
      getMode: () => localStorage.getItem('canonSingleWriter') || 'warn'
    };
    
  } catch (e) {
    console.error('[GPU Watchdog] Install failed:', e);
  }
})();
// === End Single-Writer Watchdog =============================================

// >>> Canon Bus Limiter v1 <
(function CanonBusLimiter() {
  try {
    if (window.__canonBusLimiterInstalled) return;
    window.__canonBusLimiterInstalled = true;
    const w = window; const bus = w.BeatBus;
    if (!bus || !bus.emit || !bus.on) return;

    const origEmit = bus.emit.bind(bus);

    const cfg = {
      enabled: (localStorage.getItem('canonBusLimiter') || 'off') === 'on',
      rules: parseRules(localStorage.getItem('canonBusLimiterRules') || 'MORPH_PROGRESS:60,RENDERER_TUNE:120,TICK:50'),
      exceptions: new Set(['BLUEPRINT_READY', 'PARTICLES_EMERGED', 'CURSOR_SHOW', 'CURSOR_BLINK', 'TERMINAL_TYPE', 'SCREEN_FILL', 'ENGINE_VIEWPORT_HINT', 'STAGE_CHANGE', 'ENABLE_SCROLL']),
      last: Object.create(null)
    };

    function parseRules(str) {
      const m = Object.create(null);
      String(str || '').split(',').map(s => s.trim()).filter(Boolean).forEach(pair => {
        const [ev, ms] = pair.split(':'); const key = (ev || '').trim(); const val = Math.max(0, +ms || 0);
        if (key) m[key] = val;
      });
      return m;
    }

    function shouldDrop(ev) {
      if (!cfg.enabled) return false;
      if (cfg.exceptions.has(ev)) return false;
      const minMs = cfg.rules[ev];
      if (!minMs) return false;
      const now = performance.now();
      const last = cfg.last[ev] || 0;
      if (now - last < minMs) return true;
      cfg.last[ev] = now;
      return false;
    }

    bus.emit = function (ev, ...rest) {
      if (shouldDrop(ev)) return false;
      return origEmit(ev, ...rest);
    };

    (w.CANON_CONSOLE = w.CANON_CONSOLE || {}).bus = Object.assign({}, w.CANON_CONSOLE.bus, {
      enableLimiter(on) { try { cfg.enabled = !!on; localStorage.setItem('canonBusLimiter', on ? 'on' : 'off'); } catch { } return { enabled: cfg.enabled, rules: cfg.rules }; },
      setLimiterRules(spec) { cfg.rules = parseRules(spec); try { localStorage.setItem('canonBusLimiterRules', spec); } catch { } return cfg.rules; },
      getLimiter() { return { enabled: cfg.enabled, rules: cfg.rules }; },
      histogram(seconds = 2) {
        return new Promise(async (res) => {
          const hist = Object.create(null);
          const e = bus.emit.bind(bus);
          bus.emit = function (ev, ...rest) { hist[ev] = (hist[ev] || 0) + 1; return e(ev, ...rest); };
          await new Promise(r => setTimeout(r, Math.max(250, seconds * 1000 | 0)));
          bus.emit = e;
          const rows = Object.entries(hist).sort((a, b) => b[1] - a[1]).map(([ev, n]) => ({ ev, count: n, perSecond: +(n / seconds).toFixed(1) }));
          try { console.table(rows.slice(0, 15)); } catch { }
          res(rows);
        });
      }
    });

    console.debug('[Canon] Bus Limiter installed:', (w.CANON_CONSOLE.bus && w.CANON_CONSOLE.bus.getLimiter && w.CANON_CONSOLE.bus.getLimiter()));
  } catch (e) { console.warn('BusLimiter init failed', e); }
})();

// Set default limiter settings
try {
  if (localStorage.getItem('canonBusLimiter') == null) {
    localStorage.setItem('canonBusLimiter', 'on');
  }
  if (localStorage.getItem('canonBusLimiterRules') == null) {
    localStorage.setItem('canonBusLimiterRules', 'MORPH_PROGRESS:80,RENDERER_TUNE:160,TICK:80');
  }
} catch {}

console.log('\n╔════════════════════════════════════════╗\n║  Canon Dev-OS v3.6 - HUD Controls     ║\n╠════════════════════════════════════════╣\n║  F2         = Toggle HUD (easiest)     ║\n║  Ctrl+H     = Toggle HUD (laptop)      ║\n║  ?hud=1     = Force on via URL         ║\n║                                        ║\n║  Console Commands:                     ║\n║  CANON_CONSOLE.showHud()              ║\n║  CANON_CONSOLE.hideHud()              ║\n║  CANON_CONSOLE.stats()                ║\n╚════════════════════════════════════════╝\n');

// Learning System incident hook - HOT-DORS injected
(function installLearningHook() {
  try {
    if (window.__canonLearningHook__) return;
    window.__canonLearningHook__ = true;
    
    const bus = window.BeatBus;
    if (!bus || !bus.on) return;
    
    // Hook these incident types
    const incidentTypes = [
      'CANON_VIOLATION', 'GUARD_WARN', 'GUARD_ERROR',
      'SHADER_COMPILE_ERROR', 'SHADER_COMPILE_FAIL', 'SHADER_LINK_FAIL',
      'FPS_LOW', 'FENCEPOST_TIMEOUT', 'BLUEPRINT_INVALID'
    ];
    
    const tap = (eventName) => {
      bus.on(eventName, (payload) => {
        try {
          if (window.CANON_LEARNING?.recordPattern) {
            window.CANON_LEARNING.recordPattern(eventName, {
              payload,
              ts: Date.now()
            });
          }
        } catch (e) {}
      });
    };
    
    incidentTypes.forEach(tap);
    console.log('🧠 Learning System connected to', incidentTypes.length, 'incident types');
    
  } catch (e) {
    console.warn('[Canon] Learning hook failed:', e);
  }
})();
