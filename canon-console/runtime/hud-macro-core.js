// canon-console/runtime/hud-macro-core.js
// Macro core for Canon HUD v2 — installs well-known macros and exposes helpers

(function installHudMacroCore(){
  if (typeof window === 'undefined') return;
  if (window.__canonHudMacroCoreV3) {
    console.debug('[HUD] Macro Core already present');
    return;
  }
  window.__canonHudMacroCoreV3 = true;

  const push = (code, message, details = {}, severity = 'info') => {
    try {
      const inc = { code, message, severity, details, ts: Date.now() };
      if (typeof window.__canonBridgePush__ === 'function') {
        window.__canonBridgePush__(code, message, details, severity);
      } else {
        (window.__canonIncidentBacklog ||= []).unshift(inc);
        if (window.__canonIncidentBacklog.length > 64) window.__canonIncidentBacklog.pop();
      }
      return inc;
    } catch (err) {
      console.warn('[HUD] push error', err);
      return null;
    }
  };

  const waitForEvent = (eventName, timeoutMs = 12000) => new Promise(resolve => {
    const BeatBus = window.BeatBus;
    if (!BeatBus?.on) return resolve(null);
    let done = false;
    const off = BeatBus.on(eventName, payload => {
      if (done) return;
      done = true;
      try { off?.(); } catch {}
      resolve(payload || true);
    });
    setTimeout(() => {
      if (done) return;
      done = true;
      try { off?.(); } catch {}
      resolve(null);
    }, timeoutMs);
  });

  const alreadyEmerged = () => {
    if (window.__canonFencepostSeen) return true;
    try {
      const geo = window.__particleGeometry || window.__webglBackground?.geometryRef?.current;
      const count = geo?.attributes?.position?.count || 0;
      const draw = geo?.drawRange?.count || 0;
      return !!(count && draw);
    } catch { return false; }
  };

  async function macroOpening() {
    try {
      const BeatBus = window.BeatBus;
      const Director = window.theaterDirector;
      if (!BeatBus || !BeatBus.emit) {
        push('MACRO_ERROR', 'BeatBus not ready', { macro: 'macroOpening' }, 'warn');
        return false;
      }

      if (alreadyEmerged()) {
        push('FENCEPOST_OK', 'Already emerged, skipping');
        return true;
      }

      if (Director?.getStatus?.()?.hasRun && Director?.reset) {
        Director.reset();
        window.__canonFencepostSeen = false;
        await new Promise(r => setTimeout(r, 200));
      }

      BeatBus.emit(window.EVENTS?.ENGINE_VIEWPORT_HINT || 'ENGINE_VIEWPORT_HINT', {
        width: window.innerWidth,
        height: window.innerHeight,
        aspect: window.innerWidth / Math.max(1, window.innerHeight)
      });

      if (Director?.forceStart) Director.forceStart();
      else if (Director?.start) Director.start();

      const emerged = await waitForEvent(window.EVENTS?.PARTICLES_EMERGED || 'PARTICLES_EMERGED', 15000);
      if (!emerged) {
        push('FENCEPOST_TIMEOUT', 'No PARTICLES_EMERGED within 15s', {}, 'warn');
        return false;
      }

      window.__canonFencepostSeen = true;
      push('FENCEPOST_OK', 'Fencepost emerged');
      return true;
    } catch (err) {
      push('MACRO_ERROR', String(err?.message || err), { stack: String(err?.stack || '') }, 'error');
      return false;
    }
  }

  async function macroVerifyFps() {
    try {
      const ms = 240;
      let frames = 0;
      const t0 = performance.now();
      await new Promise(resolve => {
        const step = () => {
          frames += 1;
          if (performance.now() - t0 >= ms) return resolve();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      const fps = Math.round(frames * 1000 / (performance.now() - t0));
      const ok = fps >= 55;
      push(ok ? 'FPS_OK' : 'FPS_LOW', `FPS=${fps}`, { fps });
      return ok;
    } catch (err) {
      push('MACRO_ERROR', String(err?.message || err), { stack: String(err?.stack || '') }, 'error');
      return false;
    }
  }

  async function macroFencepost() {
    try {
      const stats = window.CANON_CONSOLE?.stats?.() || {};
      push('FENCEPOST_REPORT', 'Snapshot', { stats });
      return true;
    } catch (err) {
      push('MACRO_ERROR', String(err?.message || err), { stack: String(err?.stack || '') }, 'error');
      return false;
    }
  }

  window.__canonHudMacros__ = Object.assign({}, window.__canonHudMacros__, {
    macroOpening,
    macroVerify: macroVerifyFps,
    macroFence: macroFencepost,
  });

  window.CANON_CONSOLE = window.CANON_CONSOLE || {};
  if (typeof window.CANON_CONSOLE.runMacro !== 'function') {
    window.CANON_CONSOLE.runMacro = (name) => {
      const fn = window.__canonHudMacros__?.[name];
      if (typeof fn !== 'function') throw new Error('No macro: ' + name);
      return fn();
    };
  }
  if (typeof window.CANON_CONSOLE.listMacros !== 'function') {
    window.CANON_CONSOLE.listMacros = () => Object.keys(window.__canonHudMacros__ || {});
  }

  console.debug('[HUD] Macro Core installed. Macros:', window.CANON_CONSOLE.listMacros());
})();
