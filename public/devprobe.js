(()=>{
  const box = document.createElement('div');
  box.id = 'devprobe';
  box.style.cssText = 'position:fixed;top:8px;right:8px;z-index:999999;font:12px/1.3 ui-monospace,monospace;background:#041;border:1px solid #0a4;color:#bff;padding:6px 8px;border-radius:6px;box-shadow:0 0 0 1px #000 inset';
  box.textContent = 'probe: index.html loaded';
  (document.body||document.documentElement).appendChild(box);

  const say = (t)=>{ try{ box.textContent = 'probe: ' + t; }catch{} };
  window.addEventListener('error', e => { say('error: '+(e?.message||e)); console.error('[probe] window error', e); });
  window.addEventListener('unhandledrejection', e => { say('unhandled: '+(e?.reason?.message||e?.reason||e)); console.error('[probe] unhandled', e); });
  document.addEventListener('DOMContentLoaded', ()=>say('DOMContentLoaded'));
  window.addEventListener('load', ()=>say('window.load'));
  console.log('[probe] injected');
  // Expose a helper for app code:
  window.__probeSay = say;
})();