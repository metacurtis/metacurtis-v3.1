// canon-console/runtime/hud.js
// Canon HUD v2 — INTEGRATED UI (no macro core in this file)

(function () {
  if (typeof window === 'undefined') return;
  if (window.__canonHudV2Integrated__) return;
  window.__canonHudV2Integrated__ = true;

  // Canonical HUD presence flag
  window.__canonHudV2__ = true;

  // Force visible default on first run
  try {
    if (localStorage.getItem('canonHud:visible') == null) {
      localStorage.setItem('canonHud:visible', 'true');
    }
  } catch {}

  // Best-effort deps
  const CON    = window.CANON_CONSOLE || (window.CANON_CONSOLE = {});
  const BUS    = window.BeatBus || (window.modules && window.modules.BeatBus);
  const EVENTS = window.EVENTS || (window.MC && window.MC.EVENTS) || {};

  function getDirector() { return window.theaterDirector || window.director || window.Director; }

  // Hide legacy HUDs
  try { document.querySelectorAll('#canon-hud, #canon_pilot_ui, #canon-pilot-ui').forEach(n => n.remove()); } catch {}

  // Incident bridge (fallback)
  (function initIncidentBridge() {
    if (window.__canonBridgePush__) return;
    const local = (window.__hudIncidents = window.__hudIncidents || []);
    const push = (code, message = '', details = {}, severity = (code.includes('TIMEOUT') ? 'warn' : 'info')) => {
      const inc = { code, message, details, severity, ts: Date.now() };
      try { window.__canonIncidents?.push?.(inc); } catch {}
      local.unshift(inc); if (local.length > 64) local.pop();
      try { console.log('[HUD]', code, message, details); } catch {}
      return inc;
    };
    const get = () => (window.__canonIncidents?.getBuffer?.() || local);
    const clear = () => { try { window.__canonIncidents?.clear?.(); } catch {} local.length = 0; };
    window.__canonBridgePush__ = push; window.__canonBridgeGet__ = get; window.__canonBridgeClear__ = clear;
  })();

  // Local state
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const state = {
    visible: LS.get('canonHud:visible', true),
    pinned: LS.get('canonHud:pinned', true),
    collapsed: LS.get('canonHud:collapsed', { sys: false, bus: false, pilot: false, incidents: false, opening: false, theater: false, renderer: false, stage: false }),
    fps: 60, frames: 0, lastTick: performance.now(),
    opening: { t0: 0, emergence: false, full: false, emerged: false, tEmergence: 0, tFull: 0, tEmerged: 0 },
    director: { phase: 'idle', isRunning: false, hasRun: false, elapsed: 0 },
    renderer: { lastMode: '', lastCount: 0, atlas: false, drawRange: null },
    stage: { name: 'genesis', morph: 0, scroll: 0 },
    incidents: [],
  };

  // ---------- Toast (needs to be defined BEFORE CANON_SAFE.setMode) ----------
  function toast(msg, warn){
    try{
      let t = document.getElementById('canon-hud-toast');
      if (!t) {
        t = document.createElement('div');
        t.id='canon-hud-toast';
        t.style.cssText='position:fixed;right:12px;bottom:14px;z-index:10062;font:12px/1 ui-monospace,monospace;'+
                        'background:rgba(0,0,0,.9);border:1px solid #0f8;color:#0f8;border-radius:6px;padding:6px 8px;'+
                        'box-shadow:0 8px 24px rgba(0,0,0,.35);opacity:.98';
        document.body.appendChild(t);
      }
      t.style.borderColor = warn ? '#fb7' : '#0f8';
      t.style.color       = warn ? '#fb7' : '#0f8';
      t.textContent = msg;
      t.style.display='block';
      clearTimeout(t._hide); t._hide=setTimeout(()=>{ t.style.display='none'; }, 1600);
    }catch{}
  }

  // ---------- SAFE BUS MODE (no reload) ----------
  (function installSafeBusMode(){
    const SAFE = (window.CANON_SAFE = window.CANON_SAFE || {});
    SAFE.setMode = function safeSetMode(mode){
      try {
        const m = String(mode || '').toUpperCase();
        if (!['STRICT','TELEMETRY','TOLERANT'].includes(m)) throw new Error('Invalid mode: '+mode);
        localStorage.setItem('canonBusMode', m);
        window.__canonBridgePush__?.('BUS_MODE_SET', 'Mode='+m, { mode:m });
        try { BUS?.emit?.('CANON_BUS_MODE_CHANGED', { mode:m }); } catch {}
        toast('Bus mode → '+m+' (no reload)');
        render(); // update label immediately
      } catch (e) {
        window.__canonBridgePush__?.('BUS_MODE_ERROR', String(e?.message||e));
        toast('Bus mode error: '+(e?.message||e), true);
      }
    };
  })();

  // FPS ticker
  function tick() {
    const now = performance.now();
    state.frames++;
    if (now - state.lastTick >= 1000) {
      state.fps = Math.round((state.frames * 1000) / (now - state.lastTick));
      state.frames = 0; state.lastTick = now; render();
    }
    requestAnimationFrame(tick);
  }

  // Bus helpers
  function on(ev, fn) { try { return BUS && BUS.on && BUS.on(ev, fn); } catch { return () => {}; } }
  function emit(ev, p) { try { BUS && BUS.emit && BUS.emit(ev, p); } catch {} }

  // Opening breadcrumbs
  const offs = [];
  offs.push(on(EVENTS.BUILD_EMERGENCE_BLUEPRINT || 'BUILD_EMERGENCE_BLUEPRINT', () => {
    if (!state.opening.t0) state.opening.t0 = performance.now();
    state.opening.emergence = true; state.opening.tEmergence = performance.now(); render();
  }));
  offs.push(on(EVENTS.BLUEPRINT_READY || 'BLUEPRINT_READY', (p) => {
    const mode = p?.mode || p?.blueprint?.mode || '';
    const count = p?.blueprint?.activeCount || p?.blueprint?.particleCount || 0;
    state.renderer.lastMode = mode; state.renderer.lastCount = count;
    if (mode !== 'emergence') { state.opening.full = true; state.opening.tFull = performance.now(); }
    render();
  }));
  offs.push(on(EVENTS.PARTICLES_EMERGED || 'PARTICLES_EMERGED', () => {
    state.opening.emerged = true; state.opening.tEmerged = performance.now();
    window.__canonFencepostSeen = true; render();
  }));
  offs.push(on(EVENTS.STAGE_CHANGE || 'STAGE_CHANGE', (p) => { state.stage.name = p?.stage || p?.to || String(p); render(); }));
  offs.push(on(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', (p) => { state.stage.morph = +((p?.value ?? 0)).toFixed(3); }));

  function waitForEvent(ev, timeoutMs) {
    return new Promise(res => {
      let done = false;
      const to = setTimeout(() => { if (!done) { done = true; res(null); } }, timeoutMs || 9000);
      const off = (BUS && BUS.on) ? BUS.on(ev, (p) => { if (!done) { done = true; clearTimeout(to); off && off(); res(p); } }) : null;
    });
  }
  function alreadyEmerged() {
    if (window.__canonFencepostSeen) return true;
    try {
      const geo = window.__particleGeometry || (window.__webglBackground?.geometryRef?.current);
      const count = geo?.attributes?.position?.count || 0;
      const dr = (geo?.drawRange?.count || 0);
      return !!(count && dr);
    } catch {}
    return false;
  }

  // Macros (UI direct call; global surface provided by macro-core)
  async function macroOpening() {
    try {
      const Director = getDirector();
      const status = Director?.getStatus?.();
      if (status?.hasRun && Director?.reset) {
        Director.reset(); window.__canonFencepostSeen = false;
        state.opening = { t0: 0, emergence: false, full: false, emerged: false, tEmergence: 0, tFull: 0, tEmerged: 0 };
        await new Promise(r => setTimeout(r, 200));
      }
      if (alreadyEmerged()) { window.__canonBridgePush__('FENCEPOST_OK', 'Already emerged', {}); return true; }
      emit(EVENTS.ENGINE_VIEWPORT_HINT || 'ENGINE_VIEWPORT_HINT', {
        width: innerWidth, height: innerHeight, aspect: innerWidth / Math.max(1, innerHeight)
      });
      if (Director?.forceStart) Director.forceStart(); else if (Director?.start) Director.start();
      const emerged = await waitForEvent(EVENTS.PARTICLES_EMERGED || 'PARTICLES_EMERGED', 15000);
      if (!emerged) { window.__canonBridgePush__('FENCEPOST_TIMEOUT', 'No PARTICLES_EMERGED in 15s', {}); return false; }
      window.__canonBridgePush__('FENCEPOST_OK', 'Fencepost emerged', {}); return true;
    } catch (e) { window.__canonBridgePush__('MACRO_ERROR', String(e?.message || e), { stack: String(e?.stack || '') }); return false; }
  }
  async function macroVerifyFps() {
    try {
      const t0 = performance.now(); let frames = 0;
      await new Promise(res => { const step = () => { frames++; if (performance.now() - t0 >= 240) return res(); requestAnimationFrame(step); }; requestAnimationFrame(step); });
      const fps = Math.round(frames * 1000 / Math.max(1, (performance.now() - t0)));
      const ok = fps >= 55; window.__canonBridgePush__(ok ? 'FPS_OK' : 'FPS_LOW', 'FPS=' + fps, { fps }); return ok;
    } catch (e) { window.__canonBridgePush__('MACRO_ERROR', String(e?.message || e), { stack: String(e?.stack || '') }); return false; }
  }
  async function macroFencepost() {
    const stats = CON?.stats?.() || {}; window.__canonBridgePush__('FENCEPOST_REPORT', 'Snapshot', { stats });
  }

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #canon-hud-v2{position:fixed;right:12px;top:12px;z-index:10060;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Courier New",monospace;color:#0f8;background:rgba(0,0,0,.86);border:1px solid #0f8;border-radius:8px;width:342px;box-shadow:0 8px 24px rgba(0,0,0,.45);user-select:none;display:none;}
    #canon-hud-v2.show{display:block;}
    #canon-hud-v2 .hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid rgba(0,255,128,.25);}
    #canon-hud-v2 .hdr .ttl{font-weight:700;letter-spacing:.5px;}
    #canon-hud-v2 .hdr .btns .btn{margin-left:6px;padding:3px 6px;background:#072;color:#0f8;border:1px solid #0f8;border-radius:4px;cursor:pointer;}
    #canon-hud-v2 .sec{padding:8px 10px;border-top:1px dashed rgba(0,255,128,.15);}
    #canon-hud-v2 .sec h4{margin:0 0 6px;color:#7f8;display:flex;align-items:center;justify-content:space-between;cursor:pointer;}
    #canon-hud-v2 .kv{display:flex;justify-content:space-between;}
    #canon-hud-v2 .kv + .kv{margin-top:4px;}
    #canon-hud-v2 .pill{border:1px solid #0f8;border-radius:12px;padding:1px 6px;margin-left:6px;font-size:11px;}
    #canon-hud-v2 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
    #canon-hud-v2 .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;}
    #canon-hud-v2 .btn{padding:3px 6px;border:1px solid #0f8;background:#052;color:#0f8;border-radius:4px;cursor:pointer;}
    #canon-hud-v2 .btn:hover{background:#073;}
    #canon-hud-v2 .btn.warn{background:#520;color:#fb7;border-color:#fb7;}
    #canon-hud-v2 .btn.warn:hover{background:#630;}
    #canon-hud-v2 .list{max-height:180px;overflow:auto;border:1px solid rgba(0,255,128,.15);padding:6px;border-radius:6px;background:#020;}
    #canon-hud-v2 .row{display:flex;justify-content:space-between;padding:2px 0;}
    #canon-hud-v2 .sm{font-size:11px;opacity:.95;}
  `;
  document.head.appendChild(style);

  // Create or reuse HUD root (single declaration!)
  let hud = document.getElementById('canon-hud-v2');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'canon-hud-v2';
    document.body.appendChild(hud);
  }

  function pill(x) { return '<span class="pill">' + x + '</span>'; }
  function dd(ms) { return ms ? (Math.round(ms) + 'ms') : '—'; }
  function header(title, key, right) {
    const col = !!state.collapsed[key];
    return '<h4 data-k="' + key + '"><span>' + title + '</span><span>' + right + ' ' + (col ? '▸' : '▾') + '</span></h4>';
  }

  function render() {
    try {
      const Director = getDirector();
      const st = Director?.getStatus?.() || window.theaterStatus?.();
      if (st) {
        state.director.phase = st.phase || state.director.phase;
        state.director.isRunning = !!st.isRunning;
        state.director.hasRun = !!st.hasRun;
        state.director.elapsed = +st.elapsed || 0;
      }
    } catch {}
    try {
      const geo = window.__particleGeometry || (window.__webglBackground?.geometryRef?.current);
      const mat = window.__consciousnessMaterial || (window.__webglBackground?.material);
      if (geo && (geo.drawRange || geo.setDrawRange)) {
        const dr = (geo.drawRange || { start: 0, count: (geo.attributes?.position?.count | 0) });
        state.renderer.drawRange = { start: dr.start | 0, count: dr.count | 0 };
      }
      if (mat?.uniforms?.uAtlasTexture) state.renderer.atlas = !!mat.uniforms.uAtlasTexture.value;
    } catch {}
    try {
      state.incidents = (window.__canonBridgeGet__?.() || []).slice(0, 8);
    } catch { state.incidents = []; }

    const stats = CON?.stats?.() || {};
    const bus = stats.bus || { emit: 0, on: 0, off: 0 };
    const mode = (localStorage.canonBusMode || 'TELEMETRY').toUpperCase();
    const d = state.director, op = state.opening, r = state.renderer, stg = state.stage;

    const busRight = pill('emit ' + bus.emit) + ' ' + pill('on ' + bus.on) + ' ' + pill('off ' + bus.off);
    const openingRight = op.emerged ? pill('EMERGED') : (op.full ? pill('FULL') : (op.emergence ? pill('EMERGENCE') : pill('—')));
    const rendererRight = pill((r.lastMode || '—')) + ' ' + pill('count ' + (r.lastCount || 0));
    const stageRight = pill(stg.name) + ' ' + pill('m ' + stg.morph) + ' ' + pill('s ' + stg.scroll);

    hud.innerHTML = `
      <div class="hdr">
        <div class="ttl">CANON HUD</div>
        <div class="btns">
          <button class="btn" data-act="pin">${state.pinned ? 'Pin✓' : 'Pin'}</button>
          <button class="btn" data-act="collapse">Collapse</button>
          <button class="btn" data-act="hide">Hide</button>
        </div>
      </div>

      <div class="sec">
        <div class="grid3 sm">
          <div class="kv"><span>FPS</span><span>${state.fps}</span></div>
          <div class="kv"><span>Mode</span><span>${mode}</span></div>
          <div class="kv"><span>Bus</span><span>${bus.emit}/${bus.on}/${bus.off}</span></div>
        </div>
        <div class="grid3 sm" style="margin-top:4px">
          <button class="btn" data-act="strict">STRICT</button>
          <button class="btn" data-act="telemetry">TELEMETRY</button>
          <button class="btn" data-act="tolerant">TOLERANT</button>
        </div>
        <div class="grid3 sm" style="margin-top:4px">
          <button class="btn" data-act="macroOpen">Run Opening Macro</button>
          <button class="btn" data-act="macroVerify">Verify FPS</button>
          <button class="btn" data-act="macroFence">Fencepost Report</button>
        </div>
      </div>

      <div class="sec">${header('Bus', 'bus', busRight)}
        ${state.collapsed.bus ? '' : `<div class="kv sm"><span>BeatBus</span><span>${BUS ? 'online' : '(missing)'}</span></div>`}
      </div>

      <div class="sec">${header('Incidents', 'incidents', pill('last ' + (state.incidents.length || 0)))}
        ${state.collapsed.incidents ? '' : `
          <div class="list sm">
            ${(state.incidents || []).map(i => `<div class="row"><span>${i?.code || i?.type || 'INCIDENT'}</span><span>${new Date(i?.ts || Date.now()).toLocaleTimeString()}</span></div>`).join('') || '<div class="sm" style="opacity:.7">None</div>'}
          </div>
        `}
      </div>

      <div class="sec">${header('Opening Fencepost', 'opening', openingRight)}
        ${state.collapsed.opening ? '' : `
          <div class="grid3 sm">
            <div class="kv"><span>t0→emerg</span><span>${dd(state.opening.tEmergence - state.opening.t0)}</span></div>
            <div class="kv"><span>emerg→full</span><span>${dd(state.opening.tFull - state.opening.tEmergence)}</span></div>
            <div class="kv"><span>full→emerged</span><span>${dd(state.opening.tEmerged - state.opening.tFull)}</span></div>
          </div>
        `}
      </div>

      <div class="sec">${header('Theater', 'theater', pill(state.director.phase) + ' ' + pill(state.director.isRunning ? 'running' : 'stopped') + ' ' + (state.director.hasRun ? ' ' + pill('hasRun') : ''))}
        ${state.collapsed.theater ? '' : `
          <div>
            <div class="grid3 sm">
              <button class="btn" data-act="start">Start</button>
              <button class="btn warn" data-act="cancel">Cancel</button>
              <button class="btn" data-act="hint">Emit Hint</button>
            </div>
            <div class="kv sm"><span>Elapsed</span><span>${Math.round(state.director.elapsed)}ms</span></div>
          </div>
        `}
      </div>

      <div class="sec">${header('Renderer', 'renderer', rendererRight)}
        ${state.collapsed.renderer ? '' : `
          <div class="grid3 sm">
            <div class="kv"><span>Atlas</span><span>${state.renderer.atlas ? 'yes' : 'no'}</span></div>
            <div class="kv"><span>drawRange</span><span>${state.renderer.drawRange ? (state.renderer.drawRange.start + '..' + state.renderer.drawRange.count) : '—'}</span></div>
            <button class="btn" data-act="fix">Fix drawRange</button>
          </div>
        `}
      </div>

      <div class="sec">${header('Stage / Morph / Scroll', 'stage', stageRight)}
        ${state.collapsed.stage ? '' : `
          <div class="grid3 sm">
            <div class="kv"><span>Stage</span><span>${state.stage.name}</span></div>
            <div class="kv"><span>Morph</span><span>${state.stage.morph}</span></div>
            <div class="kv"><span>Scroll</span><span>${state.stage.scroll}</span></div>
          </div>
        `}
      </div>
    `;
  }

  // EVENT DELEGATION
  hud.addEventListener('click', async function (e) {
    const target = e.target;
    if (target.tagName === 'H4' && target.hasAttribute('data-k')) {
      const k = target.getAttribute('data-k'); state.collapsed[k] = !state.collapsed[k];
      LS.set('canonHud:collapsed', state.collapsed); render(); return;
    }
    if (!target.hasAttribute('data-act')) return;
    const act = target.getAttribute('data-act');

    switch (act) {
      case 'macroOpen': await macroOpening(); break;
      case 'macroVerify': await macroVerifyFps(); break;
      case 'macroFence': await macroFencepost(); break;

      case 'pin': state.pinned = !state.pinned; LS.set('canonHud:pinned', state.pinned); render(); break;
      case 'collapse': Object.keys(state.collapsed).forEach(k => { state.collapsed[k] = true; }); LS.set('canonHud:collapsed', state.collapsed); render(); break;
      case 'hide': state.visible = false; LS.set('canonHud:visible', false); hud.classList.remove('show'); break;

      // SAFE bus mode changes (no reload)
      case 'strict':     window.CANON_SAFE?.setMode?.('STRICT'); break;
      case 'telemetry':  window.CANON_SAFE?.setMode?.('TELEMETRY'); break;
      case 'tolerant':   window.CANON_SAFE?.setMode?.('TOLERANT'); break;

      case 'start': {
        const Director = getDirector();
        try {
          if (Director?.reset && Director?.getStatus?.()?.hasRun) {
            Director.reset(); await new Promise(r => setTimeout(r, 200));
          }
          if (Director?.forceStart) await Director.forceStart();
          else if (Director?.start) await Director.start();
        } catch (e) { console.warn('Director start failed:', e); }
      } break;

      case 'cancel': { try { const Dir = getDirector(); await Dir?.cancel?.(); } catch (e) { console.warn('Director cancel failed:', e); } } break;

      case 'hint': emit(EVENTS.ENGINE_VIEWPORT_HINT || 'ENGINE_VIEWPORT_HINT', { width: innerWidth, height: innerHeight, aspect: innerWidth / Math.max(1, innerHeight) }); break;

      case 'fix': {
        try {
          const BeatBus = window.BeatBus;
          if (!BeatBus?.emit) throw new Error('BeatBus not ready');
          const fallback = () => {
            const geo = window.__particleGeometry || (window.__webglBackground?.geometryRef?.current);
            return Math.max(0, geo?.attributes?.position?.count || 0);
          };
          const draw = Math.max(0, Math.floor(
            window.__lastDirective?.activeCount ??
            window.__lastDirective?.drawCount ??
            window.__lastActiveCount ??
            fallback()
          ));
          BeatBus.emit(EVENTS.RENDER_DIRECTIVE || 'RENDER_DIRECTIVE', { drawCount: draw });
          window.__canonBridgePush__('DRAW_RANGE_FIX_REQUEST', 'Requested renderer drawRange fix', { draw });
        } catch (e) {
          console.warn('drawRange fix request failed', e);
        }
      } break;

      default: console.warn('[HUD] Unknown action:', act);
    }
  });

  // Hotkeys
  window.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === '`') {
      state.visible = !state.visible; LS.set('canonHud:visible', state.visible);
      hud.classList.toggle('show', state.visible);
    }
  });

  // Init + HMR-safe "show"
  hud.classList.toggle('show', state.visible);
  (function hmrShowRetry(){
    if (localStorage.getItem('canonHud:visible') !== 'false') {
      const t0 = performance.now();
      (function loop(){
        const el = document.getElementById('canon-hud-v2');
        if (el) { el.classList.add('show'); return; }
        if (performance.now() - t0 > 1500) return;
        setTimeout(loop, 50);
      })();
    }
  })();

  render(); tick(); setInterval(render, 1000);

  window.addEventListener('beforeunload', function () { offs.forEach(off => { off && off(); }); });

  // Safe macro surface (no overwrite if macro-core already installed)
  try {
    window.__canonHudMacros__ = window.__canonHudMacros__ || {};
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
  } catch {}

  // === HUD robust toggles & rescue tab (idempotent) ===
  function setHudVisible(on) {
    try {
      state.visible = !!on;
      LS.set('canonHud:visible', state.visible);
      hud.classList.toggle('show', state.visible);
      const tab = document.getElementById('canon-hud-rescue-tab');
      if (tab) tab.style.display = state.visible ? 'none' : 'block';
    } catch {}
  }
  function toggleHud(){ setHudVisible(!state.visible); }

  window.CANON_CONSOLE = window.CANON_CONSOLE || {};
  if (typeof window.CANON_CONSOLE.toggleHud !== 'function') window.CANON_CONSOLE.toggleHud = toggleHud;
  if (typeof window.CANON_CONSOLE.setHudVisible !== 'function') window.CANON_CONSOLE.setHudVisible = setHudVisible;

  window.addEventListener('keydown', function(e){
    try{
      if(e.key === 'F2'){ e.preventDefault(); return toggleHud(); }
      if(e.key && e.key.toLowerCase() === 'h' && e.ctrlKey && e.shiftKey){ e.preventDefault(); return toggleHud(); }
      if(e.key && e.key.toLowerCase() === 'h' && e.ctrlKey && e.altKey){ e.preventDefault(); return toggleHud(); }
    }catch{}
  }, {capture:true});

  (function(){
    try{
      const q = new URLSearchParams(location.search);
      const want = (q.get('hud') === '1') || (location.hash||'').toLowerCase().includes('#hud') || !!window.__CANON_FORCE_HUD__;
      if (want) setHudVisible(true);
    }catch{}
  })();

  (function(){
    try{
      if(document.getElementById('canon-hud-rescue-tab')) return;
      const s = document.createElement('style');
      s.textContent = `
        #canon-hud-rescue-tab{position:fixed;right:12px;bottom:14px;z-index:10061;font:12px/1 ui-monospace,Menlo,Consolas,monospace;color:#0f8;background:rgba(0,0,0,.78);border:1px solid #0f8;border-radius:6px;padding:6px 8px;cursor:pointer;user-select:none;box-shadow:0 8px 24px rgba(0,0,0,.35);}
        #canon-hud-rescue-tab:hover{background:#063;}
      `;
      document.head.appendChild(s);
      const tab = document.createElement('div');
      tab.id = 'canon-hud-rescue-tab';
      tab.textContent = 'HUD •';
      tab.title = 'Show Canon HUD (F2 / Ctrl+Shift+H / Ctrl+Alt+H)';
      tab.onclick = ()=> setHudVisible(true);
      document.body.appendChild(tab);
      tab.style.display = state.visible ? 'none' : 'block';
      const mo = new MutationObserver(()=>{ tab.style.display = hud.classList.contains('show') ? 'none' : 'block'; });
      mo.observe(hud, {attributes:true, attributeFilter:['class']});
    }catch{}
  })();

  console.log('[HUD] Canon HUD v2 initialized (safe bus mode; no reload)');
})();

/* Kill legacy HUDs */
(function enforceSingleHud() {
  function kill() {
    ['canon-hud', 'canon_pilot_ui', 'canon-pilot-ui'].forEach(id => {
      const n = document.getElementById(id);
      if (n) n.remove();
    });
  }
  try { kill(); new MutationObserver(kill).observe(document.documentElement, { childList: true, subtree: true }); } catch {}
})();
