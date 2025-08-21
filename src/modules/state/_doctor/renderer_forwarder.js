// @doctor:4r renderer_forwarder
(() => {
  if (typeof window === 'undefined' || window.__doctor_forwarder_loaded__) return;
  window.__doctor_forwarder_loaded__ = true;

  const subscribeWith = (bus) => {
    if (!bus || typeof bus.on !== 'function') return false;
    if (window.__doctor_bp_off) return true; // already wired
    const off = bus.on('BLUEPRINT_READY', (payload) => {
      try {
        window.__doctor_last_blueprint__ = payload;
        const apply =
          (window.rendererBridge && typeof window.rendererBridge.applyBlueprint === 'function' && window.rendererBridge.applyBlueprint) ||
          (window.AppRenderer && typeof window.AppRenderer.applyBlueprint === 'function' && window.AppRenderer.applyBlueprint) ||
          null;
        if (apply) apply(payload);
        if (window.__render_probe__?.update) window.__render_probe__.update(payload);
      } catch (e) {
        console.error('🧩 [4r] forward error', e);
      }
    });
    window.__doctor_bp_off = off;
    window.__doctor_bp_subscribed__ = true;
    console.log('🧩 [4r] Forwarder subscribed');
    return true;
  };

  const tryGlobals = () => {
    const bus = window.BeatBus || window.CANON_BEATBUS;
    return subscribeWith(bus);
  };

  // 1) Try any existing global instance
  if (tryGlobals()) return;

  // 2) Force import canonical BeatBus to guarantee instantiation + globals
  import('/src/modules/orchestration/core/BeatBus.js')
    .then((mod) => {
      const bus = mod?.default || window.BeatBus || window.CANON_BEATBUS || mod?.BeatBus || mod?.bus;
      if (subscribeWith(bus)) return;

      // 3) Retry a few times in case init order delays .on
      let tries = 0;
      const t = setInterval(() => {
        const ok = tryGlobals();
        if (ok || ++tries > 60) clearInterval(t);
      }, 50);
    })
    .catch((e) => {
      console.warn('🧩 [4r] BeatBus import failed:', e);
      // last resort: keep polling globals
      let tries = 0;
      const t = setInterval(() => {
        const ok = tryGlobals();
        if (ok || ++tries > 60) clearInterval(t);
      }, 50);
    });
})();