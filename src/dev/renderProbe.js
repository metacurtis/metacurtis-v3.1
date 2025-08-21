// @doctor:4b-disposers
const __doctorDisposers = []; // DEV Render Probe — minimal, non-intrusive
(() => {if (typeof window === 'undefined') return;
  if (window.__RENDER_PROBE_ACTIVE__) return;
  window.__RENDER_PROBE_ACTIVE__ = true;

  const S = {
    raf: 0,
    lastTick: performance.now(),
    fps: 0,
    draws: 0,
    lastDraws: 0,
    canvases: () => Array.from(document.getElementsByTagName('canvas')),
    dpr: () => window.devicePixelRatio || 1
  };

  // Late bind boundary once (so BeatBus is protected)
  function enforceBoundary() {
    try {
      const bus = window.BeatBus;
      const canon = window.canon;
      if (bus && canon?.boundary && !bus.__boundaryEnforced) {
        canon.boundary.enforce(bus);
        bus.__boundaryEnforced = true;
        log('boundary enforced (late)');
      }
    } catch (e) {

      /* noop */}
  }

  // Wrap WebGL drawing
  function wrapWebGL() {
    const ctxProto = window.WebGLRenderingContext && window.WebGLRenderingContext.prototype;
    const ctx2Proto = window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype;
    const wrap = (proto, name) => {
      if (!proto || proto['__probe_wrapped__' + name]) return;
      const orig = proto[name];
      if (typeof orig !== 'function') return;
      proto[name] = function (...args) {
        S.draws++;
        return orig.apply(this, args);
      };
      proto['__probe_wrapped__' + name] = true;
    };
    wrap(ctxProto, 'drawArrays');
    wrap(ctxProto, 'drawElements');
    wrap(ctx2Proto, 'drawArrays');
    wrap(ctx2Proto, 'drawElements');
  }

  // Overlay
  const root = document.createElement('div');
  root.id = 'render-probe';
  Object.assign(root.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    zIndex: 999999,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    background: 'rgba(0,0,0,0.85)',
    color: '#0f0',
    padding: '8px 10px',
    border: '1px solid #0f0',
    borderRadius: '6px',
    fontSize: '12px',
    pointerEvents: 'none',
    whiteSpace: 'pre'
  });
  const line = (k, v) => `${k.padEnd(14)} ${v}`;
  const btnBar = document.createElement('div');
  Object.assign(btnBar.style, {
    marginTop: '6px',
    display: 'flex',
    gap: '6px',
    pointerEvents: 'auto'
  });
  const mkBtn = (txt, on) => {
    const b = document.createElement('button');
    b.textContent = txt;
    Object.assign(b.style, {
      background: '#0f0',
      color: '#000',
      border: 'none',
      padding: '3px 6px',
      cursor: 'pointer'
    });
    b.onclick = on;
    return b;
  };
  const setMode = (m) => () => {
    window.canon?.setMode?.(m);
    log('mode→', m);
  };
  btnBar.append(
    mkBtn('STRICT', setMode('STRICT')),
    mkBtn('WARN', setMode('WARN')),
    mkBtn('→ genesis', () => emitStage('genesis')),
    mkBtn('tier HIGH', () => emitQuality('HIGH'))
  );
  root.append(btnBar);
  document.body.appendChild(root);

  function emitStage(to) {
    const cur = window.SC?.get?.('stage') || 'boot';
    window.BeatBus?.emit?.('STAGE_CHANGE', { from: cur, to });
  }
  function emitQuality(t) {
    window.BeatBus?.emit?.('QUALITY_CHANGE', { tier: t });
  }
  function log() {
    console.log('[RenderProbe]', ...arguments);
  }

  // CSS sanity for canvas/root
  function cssGuards() {
    const ensureRule = (css) => {
      const id = btoa(css).slice(0, 8);
      if (document.getElementById('rp-' + id)) return;
      const s = document.createElement('style');
      s.id = 'rp-' + id;
      s.textContent = css;
      document.head.appendChild(s);
    };
    // Make sure root stretches & canvas is visible
    ensureRule(`
      html, body, #root { height: 100%; }
      canvas { display:block; }
    `);
  }

  // Update loop
  function tick() {
    enforceBoundary();
    const now = performance.now();
    S.raf++;
    if (now - S.lastTick >= 1000) {
      S.fps = S.raf;
      S.raf = 0;
      S.lastTick = now;
      const cvs = S.canvases();
      const size = cvs[0] ?
      `${cvs[0].width}x${cvs[0].height} (css ${cvs[0].clientWidth}x${cvs[0].clientHeight})` :
      '—';
      const mode = window.canon?.boundary?.mode || '—';
      const tele = window.canon?.boundary?.getReport?.()?.telemetry || {
        total: 0,
        valid: 0,
        invalid: 0,
        rejected: 0
      };
      const drawDelta = S.draws - S.lastDraws;
      S.lastDraws = S.draws;
      root.firstChild?.remove?.(); // remove button bar for clean re-render at top
      root.innerHTML = [
      line('FPS', String(S.fps)),
      line('Draws/s', String(drawDelta)),
      line('Total draws', String(S.draws)),
      line('Canvas', String(size)),
      line('DPR', String(S.dpr())),
      line('Boundary', String(mode)),
      line('Emits total', String(tele.total || 0)),
      line('Valid/Invalid', `${tele.valid || 0}/${tele.invalid || 0}`)].
      join('\n');
      root.appendChild(btnBar);

      // Hints
      const hint = document.createElement('div');
      Object.assign(hint.style, { marginTop: '6px', color: '#0f0', opacity: 0.85 });
      const hasCanvas = !!S.canvases().length;
      const suggestions = [];
      if (!hasCanvas) suggestions.push('No <canvas> found → ensure WebGLBackground mounts.');
      if (hasCanvas && drawDelta === 0 && S.fps > 0)
      suggestions.push('RAF is ticking but 0 draw calls → check shader compile / render loop.');
      if (
      hasCanvas &&
      S.canvases()[0] && (
      S.canvases()[0].clientWidth === 0 || S.canvases()[0].clientHeight === 0))

      suggestions.push('Canvas size is 0 → sizing CSS or setSize().');
      if ((tele.total || 0) === 0)
      suggestions.push(
        'No events emitted → emit STAGE_CHANGE/QUALITY_CHANGE with buttons above.'
      );
      hint.textContent = suggestions.length ? 'Hints: ' + suggestions.join(' | ') : 'OK';
      root.appendChild(hint);
    }
    requestAnimationFrame(tick);
  }

  cssGuards();
  wrapWebGL();
  requestAnimationFrame(tick);
})(); // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}