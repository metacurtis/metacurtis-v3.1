// canon-console/runtime/hud.js
// Canon HUD v2 — full Dev-OS dashboard (idempotent, DEV-only)
//
// Highlights:
// - Auto-hides legacy mini HUDs (#canon-hud, #canon_pilot_ui, #canon-pilot-ui)
// - Toggle HUD with Alt+`
// - Sections: System/Bus, Pilot, Incidents, Opening Fencepost, Theater, Renderer, Stage
// - Controls: bus mode (STRICT/TELEMETRY/TOLERANT), Pilot Auto, Run Playbook, Verify FPS,
//             Theater Start/Cancel/Emit Hint, Renderer Fix drawRange
// - Persists UI state in localStorage (canonHud:*)

(function () {
  if (typeof window === 'undefined') return;
  if (window.__canonHudV2__) return;
  window.__canonHudV2__ = true;

  // Hide any legacy HUDs to avoid double UI
  try {
    const legacy = document.querySelector('#canon-hud, #canon_pilot_ui, #canon-pilot-ui');
    if (legacy) legacy.style.display = 'none';
  } catch {}

  // Best-effort deps
  const CON   = window.CANON_CONSOLE;
  const PILOT = window.CANON_PILOT;
  const BUS   = window.BeatBus || (window.modules && window.modules.BeatBus);
  const EV    = window.EVENTS || (window.MC && window.MC.EVENTS) || {};
  const Director = window.theaterDirector || window.director;

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const state = {
    visible  : LS.get('canonHud:visible',   true),
    pinned   : LS.get('canonHud:pinned',    true),
    collapsed: LS.get('canonHud:collapsed', { sys:false, bus:false, pilot:false, incidents:false, opening:false, theater:false, renderer:false, stage:false }),

    fps: 60, frames: 0, lastTick: performance.now(),
    busMode: (localStorage.canonBusMode || 'WARN').toUpperCase(),

    opening : { t0:0, emergence:false, full:false, emerged:false, tEmergence:0, tFull:0, tEmerged:0 },
    director: { phase:'idle', isRunning:false, hasRun:false, elapsed:0 },
    renderer: { lastMode:'', lastCount:0, atlas:false, drawRange:null },
    stage   : { name:'genesis', morph:0, scroll:0 },
    incidents: [],
  };

  // Tick FPS
  function tick() {
    const now = performance.now();
    state.frames++;
    if (now - state.lastTick >= 1000) {
      state.fps = Math.round((state.frames * 1000) / (now - state.lastTick));
      state.frames = 0; state.lastTick = now;
      render();
    }
    requestAnimationFrame(tick);
  }

  // Bus helpers
  function on(ev, fn){ try { return BUS && BUS.on && BUS.on(ev, fn); } catch { return ()=>{}; } }
  function emit(ev, p){ try { BUS && BUS.emit && BUS.emit(ev, p); } catch {} }

  // Opening breadcrumbs
  const offs = [];
  offs.push(on(EV.BUILD_EMERGENCE_BLUEPRINT, () => { if (!state.opening.t0) state.opening.t0 = performance.now(); state.opening.emergence = true; state.opening.tEmergence = performance.now(); render(); }));
  offs.push(on(EV.BLUEPRINT_READY, (p) => {
    const mode  = p?.mode || p?.blueprint?.mode || '';
    const count = p?.blueprint?.activeCount || p?.blueprint?.particleCount || 0;
    state.renderer.lastMode = mode; state.renderer.lastCount = count;
    if (mode !== 'emergence') { state.opening.full = true; state.opening.tFull = performance.now(); }
    render();
  }));
  offs.push(on(EV.PARTICLES_EMERGED, () => { state.opening.emerged = true; state.opening.tEmerged = performance.now(); render(); }));

  // Stage/morph
  offs.push(on(EV.STAGE_CHANGE,   (p) => { state.stage.name  = p?.stage || p?.to || String(p); render(); }));
  offs.push(on(EV.MORPH_PROGRESS, (p) => { state.stage.morph = +((p?.value??0)).toFixed(3); render(); }));

  // Snapshots
  function pullDirector() {
    try {
      const st = Director?.getStatus?.();
      if (!st) return;
      state.director.phase     = st.phase;
      state.director.isRunning = st.isRunning;
      state.director.hasRun    = st.hasRun;
      state.director.elapsed   = st.elapsed || 0;
    } catch {}
  }
  function pullRenderer() {
    try {
      const geo = window.__particleGeometry || (window.__webglBackground && window.__webglBackground.geometryRef && window.__webglBackground.geometryRef.current);
      const mat = window.__consciousnessMaterial || (window.__webglBackground && window.__webglBackground.material);
      if (geo && geo.drawRange) state.renderer.drawRange = { start: geo.drawRange.start||0, count: geo.drawRange.count||0 };
      if (mat && mat.uniforms && mat.uniforms.uAtlasTexture) state.renderer.atlas = !!mat.uniforms.uAtlasTexture.value;
    } catch {}
  }
  function pullIncidents() {
    try {
      const s = (window.__canonIncidents && window.__canonIncidents.getBuffer && window.__canonIncidents.getBuffer()) || [];
      state.incidents = s.slice(0, 8);
    } catch { state.incidents = []; }
  }

  // DOM
  const style = document.createElement('style');
  style.textContent = `
    #canon-hud-v2 { position:fixed; right:12px; top:12px; z-index:10060;
      font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Courier New",monospace;
      color:#0f8; background:rgba(0,0,0,.86); border:1px solid #0f8; border-radius:8px;
      width:342px; box-shadow:0 8px 24px rgba(0,0,0,.45); user-select:none; display:none; }
    #canon-hud-v2.show { display:block; }
    #canon-hud-v2 .hdr { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-bottom:1px solid rgba(0,255,128,.25);}
    #canon-hud-v2 .hdr .ttl { font-weight:700; letter-spacing:.5px; }
    #canon-hud-v2 .hdr .btns .btn { margin-left:6px; padding:3px 6px; background:#072; color:#0f8; border:1px solid #0f8; border-radius:4px; cursor:pointer;}
    #canon-hud-v2 .sec { padding:8px 10px; border-top:1px dashed rgba(0,255,128,.15); }
    #canon-hud-v2 .sec h4 { margin:0 0 6px; color:#7f8; display:flex; align-items:center; justify-content:space-between; cursor:pointer; }
    #canon-hud-v2 .kv { display:flex; justify-content:space-between; }
    #canon-hud-v2 .kv + .kv { margin-top:4px; }
    #canon-hud-v2 .pill{ border:1px solid #0f8; border-radius:12px; padding:1px 6px; margin-left:6px; font-size:11px;}
    #canon-hud-v2 .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:6px;}
    #canon-hud-v2 .grid3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;}
    #canon-hud-v2 .btn{ padding:3px 6px; border:1px solid #0f8; background:#052; color:#0f8; border-radius:4px; cursor:pointer;}
    #canon-hud-v2 .btn.warn{ background:#520; color:#fb7; border-color:#fb7;}
    #canon-hud-v2 .list{ max-height:180px; overflow:auto; border:1px solid rgba(0,255,128,.15); padding:6px; border-radius:6px; background:#020;}
    #canon-hud-v2 .row{ display:flex; justify-content:space-between; padding:2px 0;}
    #canon-hud-v2 .sm{ font-size:11px; opacity:.95;}
  `;
  document.head.appendChild(style);

  const hud = document.createElement('div');
  hud.id = 'canon-hud-v2';
  document.body.appendChild(hud);

  function pill(x){ return `<span class="pill">${x}</span>`; }
  function dd(ms){ return ms ? `${Math.round(ms)}ms` : '—'; }

  function header(title, key, right=''){
    const col = !!state.collapsed[key];
    return `
      <h4 data-k="${key}">
        <span>${title}</span>
        <span>${right} ${col?'▸':'▾'}</span>
      </h4>
    `;
  }

  function render() {
    pullDirector(); pullRenderer(); pullIncidents();
    const beats = (CON && CON.stats && CON.stats().beat) || {emit:0,on:0,off:0};
    const mode  = (localStorage.canonBusMode || 'WARN').toUpperCase();
    state.busMode = mode;

    const d = state.director, op = state.opening, r = state.renderer, st = state.stage;

    hud.innerHTML = `
      <div class="hdr">
        <div class="ttl">CANON HUD</div>
        <div class="btns">
          <button class="btn" data-act="pin">${state.pinned?'Pin✓':'Pin'}</button>
          <button class="btn" data-act="collapse">Collapse</button>
          <button class="btn" data-act="hide">Hide</button>
        </div>
      </div>

      <div class="sec">
        <div class="grid3 sm">
          <div class="kv"><span>FPS</span><span>${state.fps}</span></div>
          <div class="kv"><span>Mode</span><span>${mode}</span></div>
          <div class="kv"><span>Events</span><span>${beats.emit}</span></div>
        </div>
        <div class="grid3 sm" style="margin-top:4px">
          <button class="btn" data-act="strict">STRICT</button>
          <button class="btn" data-act="telemetry">TELEMETRY</button>
          <button class="btn" data-act="tolerant">TOLERANT</button>
        </div>
      </div>

      <div class="sec">${header('Bus','bus', `${pill('emit '+beats.emit)} ${pill('on '+beats.on)} ${pill('off '+beats.off)}`)}
        ${state.collapsed.bus?'':`
        <div class="kv sm"><span>BeatBus</span><span>${BUS?'online':'(missing)'}</span></div>`}
      </div>

      <div class="sec">${header('Pilot','pilot', pill(PILOT?'online':'offline'))}
        ${state.collapsed.pilot?'':`
        <div class="grid2 sm">
          <button class="btn" data-act="auto">${(PILOT?.getState?.()?.auto ? 'Auto: ON' : 'Auto: OFF')}</button>
          <button class="btn" data-act="verify">Verify FPS</button>
        </div>
        <div class="grid2 sm" style="margin-top:4px">
          <button class="btn" data-act="playbooks">Run Playbook…</button>
          <button class="btn warn" data-act="clear">Clear Incidents</button>
        </div>`}
      </div>

      <div class="sec">${header('Incidents','incidents', pill('last '+(state.incidents.length||0)))}
        ${state.collapsed.incidents?'':`
        <div class="list sm">
          ${(state.incidents||[]).map(i=>`
            <div class="row"><span>${i?.code||i?.type||'INCIDENT'}</span>
            <span>${new Date(i?.ts||Date.now()).toLocaleTimeString()}</span></div>`).join('') || '<div class="sm" style="opacity:.7">None</div>'}
        </div>`}
      </div>

      <div class="sec">${header('Opening Fencepost','opening', `${op.emerged?pill('EMERGED'):op.full?pill('FULL'):op.emergence?pill('EMERGENCE'):pill('—')}`)}
        ${state.collapsed.opening?'':`
        <div class="grid3 sm">
          <div class="kv"><span>t0→emerg</span><span>${dd(op.tEmergence - op.t0)}</span></div>
          <div class="kv"><span>emerg→full</span><span>${dd(op.tFull - op.tEmergence)}</span></div>
          <div class="kv"><span>full→emerged</span><span>${dd(op.tEmerged - op.tFull)}</span></div>
        </div>`}
      </div>

      <div class="sec">${header('Theater','theater', `${pill(d.phase)} ${pill(d.isRunning?'running':'stopped')} ${d.hasRun?pill('hasRun'):''}`)}
        ${state.collapsed.theater?'':`
        <div class="grid3 sm">
          <button class="btn" data-act="start">Start</button>
          <button class="btn warn" data-act="cancel">Cancel</button>
          <button class="btn" data-act="hint">Emit Hint</button>
        </div>
        <div class="kv sm"><span>Elapsed</span><span>${Math.round(d.elapsed)}ms</span></div>`}
      </div>

      <div class="sec">${header('Renderer','renderer', `${pill(r.lastMode||'—')} ${pill('count '+(r.lastCount||0))}`)}
        ${state.collapsed.renderer?'':`
        <div class="grid3 sm">
          <div class="kv"><span>Atlas</span><span>${r.atlas?'yes':'no'}</span></div>
          <div class="kv"><span>drawRange</span><span>${r.drawRange? (r.drawRange.start+'..'+r.drawRange.count) : '—'}</span></div>
          <button class="btn" data-act="fix">Fix drawRange</button>
        </div>`}
      </div>

      <div class="sec">${header('Stage / Morph / Scroll','stage', `${pill(st.name)} ${pill('m '+st.morph)} ${pill('s '+st.scroll)}`)}
        ${state.collapsed.stage?'':`
        <div class="grid3 sm">
          <div class="kv"><span>Stage</span><span>${st.name}</span></div>
          <div class="kv"><span>Morph</span><span>${st.morph}</span></div>
          <div class="kv"><span>Scroll</span><span>${st.scroll}</span></div>
        </div>`}
      </div>
    `;

    hud.querySelectorAll('h4[data-k]').forEach(h => {
      h.onclick = () => {
        const k = h.getAttribute('data-k');
        state.collapsed[k] = !state.collapsed[k];
        LS.set('canonHud:collapsed', state.collapsed);
        render();
      };
    });

    hud.querySelectorAll('[data-act]').forEach(btn=>{
      const act = btn.getAttribute('data-act');
      btn.onclick = async () => {
        switch (act) {
          case 'pin': state.pinned=!state.pinned; LS.set('canonHud:pinned', state.pinned); position(); break;
          case 'collapse': Object.keys(state.collapsed).forEach(k=>state.collapsed[k]=true); LS.set('canonHud:collapsed', state.collapsed); render(); break;
          case 'hide': state.visible=false; LS.set('canonHud:visible', false); hud.classList.remove('show'); break;

          case 'strict':    localStorage.canonBusMode='STRICT';    location.reload(); break;
          case 'telemetry': localStorage.canonBusMode='TELEMETRY'; location.reload(); break;
          case 'tolerant':  localStorage.canonBusMode='TOLERANT';  location.reload(); break;

          case 'auto':      try { PILOT?.setAuto?.(!(PILOT.getState()?.auto)); render(); } catch {} break;
          case 'verify':    try { window.__canonIncidents?.runVerifyMetrics?.(); } catch {} break;
          case 'playbooks': try { window.__canonIncidents?.openPlaybookMenu?.(); } catch {} break;
          case 'clear':     try { window.__canonIncidents?.clear?.(); render(); } catch {} break;

          case 'start':     try { await (window.theaterDirector||window.director)?.start?.(); }  catch(e){ console.warn('dirStart', e); } break;
          case 'cancel':    try { await (window.theaterDirector||window.director)?.cancel?.(); } catch(e){ console.warn('dirCancel',e); } break;
          case 'hint':      emit(EV.ENGINE_VIEWPORT_HINT, { width: innerWidth, height: innerHeight, aspect: innerWidth/Math.max(1,innerHeight) }); break;

          case 'fix':
            try {
              const geo = window.__particleGeometry || (window.__webglBackground && window.__webglBackground.geometryRef && window.__webglBackground.geometryRef.current);
              const mat = window.__consciousnessMaterial || (window.__webglBackground && window.__webglBackground.material);
              const max = geo?.attributes?.position?.count || 0;
              const active = Math.min(max, Math.floor(mat?.uniforms?.uActiveCount?.value ?? max));
              geo?.setDrawRange?.(0, active);
              console.info('drawRange →', active);
            } catch (e) { console.warn('drawRange fix failed', e); }
            break;
        }
      };
    });
  }

  function position(){
    hud.style.right = state.pinned ? '12px' : '12px';
    hud.style.top   = state.pinned ? '12px' : '12px';
  }

  // Hotkey: Alt+` to toggle
  window.addEventListener('keydown', (e)=>{
    if (e.altKey && e.key === '`') {
      state.visible = !state.visible;
      LS.set('canonHud:visible', state.visible);
      hud.classList.toggle('show', state.visible);
    }
  });

  // Init
  position();
  hud.classList.toggle('show', state.visible);
  render();
  tick();
  setInterval(render, 1000); // incidents/dir/renderer soft poll

  window.addEventListener('beforeunload', () => { offs.forEach(off => off && off()); });
})();


/* Kill legacy HUDs (defensive) */
(function enforceSingleHud(){
  const kill = () => {
    for (const id of ['canon-hud','canon_pilot_ui','canon-pilot-ui']) {
      const n = document.getElementById(id); if (n) n.remove();
    }
  };
  try {
    kill();
    new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});
  } catch {}
})();
