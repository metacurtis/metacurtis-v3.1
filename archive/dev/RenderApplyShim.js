// src/dev/RenderApplyShim.js
// DEVELOPMENT RENDER SHIM - Catches and forwards blueprint events

// Immediate execution, no conditionals that could fail
(() => {
  // Prevent double-load
  if (window.__doctor_apply_shim_loaded__) {
    console.log('🔄 Shim already loaded');
    return;
  }
  
  console.log('%c🩺 RENDER SHIM INITIALIZING', 
    'background: #00ff00; color: #000; font-size: 14px; padding: 4px');
  
  // Initialize state
  window.__doctor_apply_shim_loaded__ = true;
  window.__doctor_apply_hits__ = 0;
  window.__doctor_last_blueprint__ = null;
  window.__doctor_queue__ = [];
  window.__doctor_rid__ = window.__doctor_rid__ || 0;
  
  // Helper: Check if payloads are the same
  const samePayload = (a, b) => {
    if (!a || !b) return false;
    try {
      return JSON.stringify({ 
        s: a.stage, 
        q: a.quality, 
        c: a.blueprint?.particleCount 
      }) === JSON.stringify({ 
        s: b.stage, 
        q: b.quality, 
        c: b.blueprint?.particleCount 
      });
    } catch { 
      return false; 
    }
  };
  
  // Core delivery function
  const deliver = (payload) => {
    window.__doctor_apply_hits__++;
    window.__doctor_last_blueprint__ = payload;
    
    console.log(`🎯 Shim: Blueprint ${window.__doctor_apply_hits__}`, {
      stage: payload?.stage,
      quality: payload?.quality,
      particles: payload?.blueprint?.particleCount
    });
    
    // Try to apply immediately
    if (window.AppRenderer?.applyBlueprint) {
      try {
        window.AppRenderer.applyBlueprint(payload);
        window.__doctor_apply_last_delivered_at__ = performance.now();
        console.log('✅ Shim: Applied to renderer');
      } catch (e) {
        console.error('❌ Shim: Apply failed', e);
      }
    } else {
      // Queue for later (de-duplicate)
      const tail = window.__doctor_queue__[window.__doctor_queue__.length - 1];
      if (!samePayload(tail, payload)) {
        window.__doctor_queue__.push(payload);
        console.log(`⏳ Shim: Queued (${window.__doctor_queue__.length} waiting)`);
      }
    }
  };
  
  // Blueprint handler
  const onBlueprint = (payload) => {
    if (!payload) return;
    
    // Add tracking ID
    if (!payload._rid) {
      payload._rid = ++window.__doctor_rid__;
    }
    
    deliver(payload);
  };
  
  // Wait for BeatBus to be available
  const setupListeners = () => {
    // Try multiple bus locations
    const bus = window.BeatBus || window.bus || window.Bus;
    
    if (!bus) {
      console.warn('⏳ Shim: BeatBus not ready, retrying...');
      setTimeout(setupListeners, 50);
      return;
    }
    
    console.log('🚌 Shim: Attaching to BeatBus');
    
    // Listen for blueprints (try multiple event names)
    const events = ['BLUEPRINT_READY', 'blueprint-ready', 'blueprintReady'];
    events.forEach(eventName => {
      if (bus.on) {
        bus.on(eventName, onBlueprint);
        console.log(`  ✅ Listening for: ${eventName}`);
      }
    });
    
    // Also try EVENTS constant if available
    import('@/theater/events.js').then(module => {
      if (module.EVENTS?.BLUEPRINT_READY && bus.on) {
        bus.on(module.EVENTS.BLUEPRINT_READY, onBlueprint);
        console.log(`  ✅ Listening for: ${module.EVENTS.BLUEPRINT_READY}`);
      }
    }).catch(() => {
      // Events file might not exist yet
    });
  };
  
  // Start listening
  setupListeners();
  
  // Queue flusher (runs every 100ms)
  const flushInterval = setInterval(() => {
    if (!window.AppRenderer?.applyBlueprint) return;
    if (!window.__doctor_queue__?.length) return;
    
    const queue = window.__doctor_queue__.splice(0);
    console.log(`🔄 Shim: Flushing ${queue.length} blueprints`);
    
    queue.forEach(payload => {
      try {
        window.AppRenderer.applyBlueprint(payload);
      } catch (e) {
        console.error('Flush error:', e);
      }
    });
    
    window.__doctor_apply_last_delivered_at__ = performance.now();
  }, 100);
  
  // Status helper
  window.__doctor_shim_status__ = () => ({
    loaded: true,
    hits: window.__doctor_apply_hits__,
    lastSeen: !!window.__doctor_last_blueprint__,
    queued: window.__doctor_queue__?.length || 0,
    hasAppRenderer: !!window.AppRenderer?.applyBlueprint,
    lastDeliveredAt: window.__doctor_apply_last_delivered_at__ || null,
    busConnected: !!(window.BeatBus || window.bus)
  });
  
  // HMR cleanup
  if (import.meta?.hot) {
    import.meta.hot.dispose(() => {
      clearInterval(flushInterval);
      window.__doctor_apply_shim_loaded__ = false;
    });
  }
  
  console.log('✅ Render shim ready:', window.__doctor_shim_status__());
})();

// Export for type checking (optional)
export default true;