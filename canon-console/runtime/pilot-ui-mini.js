// canon-console/runtime/pilot-ui-mini.js
// Canon Pilot — Mini HUD (DEV-only, idempotent, auto-hides if HUD v2 is active)
//
// Behavior:
// - If HUD v2 is present (window.__canonHudV2__), this mini HUD does not render.
// - Else it renders a tiny "Auto: ON/OFF" badge + last decision/action.
// - Updates every 1s and on pilot events. Click toggles Auto.
//
(function () {
  if (typeof window === 'undefined') return;

  // If the rich HUD is active, do not render the mini HUD.
  if (window.__canonHudV2__) {
    const stale = document.getElementById('canon-pilot-ui');
    if (stale) stale.style.display = 'none';
    return;
  }

  const ROOT_ID = 'canon-pilot-ui';
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    // refresh wiring if element exists (idempotent)
    wire(existing);
    return;
  }

  // Create base container
  const box = document.createElement('div');
  box.id = ROOT_ID;
  box.style.cssText = [
    'position:fixed', 'right:10px', 'bottom:10px', 'z-index:10050',
    'font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Courier New",monospace',
    'background:#000', 'color:#0f8', 'padding:8px 10px',
    'border:1px solid #0f8', 'border-radius:6px',
    'box-shadow:0 6px 18px rgba(0,0,0,.35)'
  ].join(';');

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const btn = document.createElement('button');
  btn.textContent = 'Auto: …';
  btn.style.cssText = 'all:unset;cursor:pointer;color:#0cf;margin-right:8px';

  const span = document.createElement('span');
  span.textContent = 'Pilot idle';

  row.appendChild(btn);
  row.appendChild(span);

  const fine = document.createElement('div');
  fine.style.cssText = 'margin-top:4px;color:#8fa;opacity:.85;font-size:11px';
  fine.textContent = 'Canon Pilot L3/L4';

  box.appendChild(row);
  box.appendChild(fine);
  document.body.appendChild(box);

  wire(box);

  function wire(el) {
    const PILOT = window.CANON_PILOT;

    function sync() {
      try {
        const st = PILOT?.getState?.() || {};
        btn.textContent = 'Auto: ' + (st.auto ? 'ON' : 'OFF');
        const last = st.lastAction || st.lastDecision;
        if (last) {
          const kind = last.kind || last.type || 'pilot';
          const id   = last.id   || last.code || '';
          span.textContent =
            kind === 'playbook'
            ? `Applied ${id} [${last.ok === false ? 'fail' : 'ok'}]`
            : (last.action ? `Decision: ${last.action}` : 'Pilot observing');
        } else {
          span.textContent = 'Pilot observing';
        }
      } catch {
        btn.textContent  = 'Auto: …';
        span.textContent = 'Pilot idle';
      }
    }

    // Toggle auto
    btn.onclick = () => {
      try {
        const st = PILOT?.getState?.() || {};
        PILOT?.setAuto?.(!st.auto);
      } catch {}
      sync();
    };

    // Pilot events
    const onDecision = (e) => {
      try {
        const d = e?.detail?.decision;
        if (!d) return;
        span.textContent = `Decision: ${d.action || 'OBSERVE'}`;
      } catch {}
    };
    const onAction = (e) => {
      try {
        const a = e?.detail;
        if (!a) return;
        span.textContent =
          (a.type === 'playbook')
          ? `Applied ${a.id} [${a.result?.ok ? 'ok' : 'fail'}]`
          : 'Pilot action';
      } catch {}
    };

    window.addEventListener('canon:pilot:decision', onDecision);
    window.addEventListener('canon:pilot:action', onAction);

    const timer = setInterval(sync, 1000);
    sync();

    // Cleanup (idempotent)
    el.__canonPilotMiniCleanup__ && el.__canonPilotMiniCleanup__();
    el.__canonPilotMiniCleanup__ = () => {
      clearInterval(timer);
      window.removeEventListener('canon:pilot:decision', onDecision);
      window.removeEventListener('canon:pilot:action', onAction);
    };

    window.addEventListener('beforeunload', () => {
      el.__canonPilotMiniCleanup__ && el.__canonPilotMiniCleanup__();
    }, { once: true });
  }
})();
