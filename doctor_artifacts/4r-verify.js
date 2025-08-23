// 4r verify — paste into browser console after the app loads
console.log('=== 4r verify ===');
const bus = window.BeatBus || window.CANON_BEATBUS;
console.log('bus emit available:', !!bus?.emit);
console.log('forwarder loaded:', !!window.__doctor_forwarder_loaded__);
console.log('probe loaded:', !!window.__render_probe_loaded__);
console.log('subscribed:', !!window.__doctor_bp_subscribed__);

if (bus?.emit) {
  bus.emit('BLUEPRINT_READY', { stage:'genesis', quality:'HIGH', blueprint:{ particleCount: 1200 } });
  setTimeout(() => {
    console.log('last blueprint seen:', !!window.__doctor_last_blueprint__);
  }, 50);
}
console.log('apply available:',
  typeof window.rendererBridge?.applyBlueprint === 'function' ||
  typeof window.AppRenderer?.applyBlueprint === 'function' ||
  typeof window.__doctor_apply_blueprint__ === 'function'
);
console.log('=== /4r verify ===');