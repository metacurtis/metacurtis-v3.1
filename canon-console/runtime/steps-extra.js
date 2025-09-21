// canon-console/runtime/steps-extra.js
export const ExtraSteps = {
  set_draw_range_from_uniforms({ geometry, material }) {
    try {
      const active = material?.uniforms?.uActiveCount?.value ?? geometry?.attributes?.particleIndex?.count ?? 0;
      if (typeof active === 'number' && geometry?.setDrawRange) {
        geometry.setDrawRange(0, active);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  convert_tiers_to_tierData({ blueprint }) {
    try {
      if (blueprint?.tiers && !blueprint.tierData) {
        blueprint.tierData = new Float32Array(blueprint.tiers);
        return { ok: true, changed: true };
      }
      return { ok: true, changed: false };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};


// verify_fps_probe - FPS measurement step
export const verify_fps_probe = async (ctx = {}) => {
  try {
    const frames = 30;
    const times = [];
    let last = performance.now();
    
    await new Promise((resolve) => {
      let n = 0;
      function step() {
        const now = performance.now();
        times.push(now - last);
        last = now;
        if (++n >= frames) return resolve();
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    
    times.shift(); // drop first
    const avg = times.reduce((a,b) => a+b, 0) / times.length;
    const fps = 1000 / avg;
    const ok = fps >= 50;
    
    window.BeatBus?.emit?.(ok ? 'FPS_OK' : 'FPS_LOW', {
      fps: Number(fps.toFixed(1)),
      avgMs: Number(avg.toFixed(2)),
      frames,
      ts: Date.now()
    });
    
    console.log('[Steps:verify_fps_probe]', { fps, avg });
    return { success: true, fps, avgMs: avg };
  } catch (e) {
    console.warn('[Steps:verify_fps_probe] failed:', e);
    return { success: false, error: String(e) };
  }
};

ExtraSteps.verify_fps_probe = verify_fps_probe;
