// canon-console/runtime/playbooks-extra.js
// Canon Playbooks Extra

export const ExtraPlaybooks = {};

// RECOVER_DIM_POINTS - Fix particle visibility
ExtraPlaybooks.RECOVER_DIM_POINTS = async (ctx = {}) => {
  console.log('[Playbook:RECOVER_DIM_POINTS] Starting recovery...');
  
  try {
    // Direct reference since both files are in same directory
    const { set_draw_range_from_uniforms } = await import('./steps-extra.js');
    const result = await set_draw_range_from_uniforms(ctx);
    
    if (result.success) {
      window.BeatBus?.emit?.('FENCEPOST_REPORT', {
        type: 'DRAW_RANGE_RECOVERED',
        count: result.count,
        ts: Date.now()
      });
    }
    
    return result;
  } catch (e) {
    console.error('[Playbook:RECOVER_DIM_POINTS] Error:', e);
    return { success: false, error: String(e) };
  }
};

// OPENING_FENCEPOST - Await emergence with timeout
ExtraPlaybooks.OPENING_FENCEPOST = async (ctx = {}) => {
  const bus = window.BeatBus;
  if (!bus || !bus.on) {
    console.warn('[Playbook:OPENING_FENCEPOST] No BeatBus');
    return { success: false, error: 'No BeatBus' };
  }
  
  const EVENTS = window.EVENTS || {};
  const evName = EVENTS.PARTICLES_EMERGED || 'PARTICLES_EMERGED';
  const start = performance.now();
  const timeoutMs = ctx.timeoutMs || 4500;
  
  console.log('[Playbook:OPENING_FENCEPOST] Waiting for', evName, 'timeout:', timeoutMs);
  
  let off = null;
  const ok = await new Promise((resolve) => {
    let done = false;
    off = bus.on(evName, () => {
      if (done) return;
      done = true;
      resolve(true);
    });
    setTimeout(() => {
      if (done) return;
      done = true;
      resolve(false);
    }, timeoutMs);
  });
  
  if (typeof off === 'function') {
    try { off(); } catch {}
  }
  
  const dt = Math.round(performance.now() - start);
  const payload = { dt, ts: Date.now(), timeoutMs };
  
  bus.emit(ok ? 'FENCEPOST_OK' : 'FENCEPOST_TIMEOUT', payload);
  console.log('[Playbook:OPENING_FENCEPOST]', ok ? 'OK' : 'TIMEOUT', payload);
  
  return { success: ok, ...payload };
};

// Export for window access
if (typeof window !== 'undefined') {
  window.CANON_PLAYBOOKS_EXTRA = ExtraPlaybooks;
}

export default ExtraPlaybooks;
