// 4r-apply verify — paste in browser console after reload
console.log('=== 4r-apply verify ===');
const bus = window.BeatBus || window.CANON_BEATBUS;
console.log('bus emit:', !!bus?.emit);
console.log('forwarder loaded:', !!window.__doctor_forwarder_loaded__);
console.log('probe loaded:', !!window.__render_probe_loaded__);
console.log('apply shim loaded:', !!window.__doctor_apply_shim_loaded__);
console.log('apply hook available:', typeof window.__doctor_apply_blueprint__ === 'function');

if (bus?.emit) {
  bus.emit('BLUEPRINT_READY', { stage:'genesis', quality:'HIGH', blueprint:{ particleCount: 1400 } });
  setTimeout(()=> {
    const has = !!window.__doctor_last_blueprint__;
    console.log('last blueprint recorded:', has);
  }, 50);
}
console.log('=== /4r-apply verify ===');