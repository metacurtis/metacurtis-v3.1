import './canon/init-amplified.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

import '@/dev/hotdors.text.selfboot.js'; // HOTDORS self-boot (console)

// Initialize state bridge
import _StateCommands from "@/state/commands/StateCommands";

// Import Canon L2 (now it exists!)

const rootEl = document.getElementById('root');

if (!rootEl) {
  console.error('❌ Could not find #root element');
} else {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
  console.log('✅ React app mounted');
}

// DEV helpers
if (import.meta.env.DEV) {
  // Canon is already attached via init.js
  console.log('📦 Canon Status:');
  console.log('  Guard:', !!window.__CANON_GUARD_ACTIVE);
  console.log('  Console:', !!window.__CANON_CONSOLE_ACTIVE);
  console.log('  BeatBus:', !!window.BeatBus);

  // Global debug helpers
  window.canonDebug = {
    guard: () => window.canon?.guard?.getViolations(),
    console: () => window.canon?.panel?.patterns,
    bus: () => window.BeatBus?.getDebugInfo(),
    emit: (evt, data) => window.BeatBus?.emit(evt, data),
  };
}

// HOTDORS UNMUTE+SLIDER (dev-only, idempotent)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (function(){
    if (window.__HOTDORS_UNMUTE__) return; window.__HOTDORS_UNMUTE__=true;

    // Unmute Canon/console and surface real errors
    try { const C=window.Canonical||{}; if (C.flags) C.flags.consoleMuted=false; } catch {}
    ;['log','info','warn','error','debug'].forEach(k=>{ if(typeof console[k]!=='function'){ console[k]=function(){} }});
    window.addEventListener('error', e => console.error('[page error]', e.message||e.error||e));
    window.addEventListener('unhandledrejection', e => console.error('[unhandled]', e.reason));

    // Tiny Morph slider (no React import)
    if (!document.getElementById('hotdors-morph')) {
      const box=document.createElement('div'); box.id='hotdors-morph';
      Object.assign(box.style,{position:'fixed',left:'12px',bottom:'12px',zIndex:10000,background:'rgba(0,0,0,.45)',color:'#9EFADF',padding:'8px 10px',borderRadius:'8px',font:'12px/16px ui-monospace, SFMono-Regular, Menlo, monospace',backdropFilter:'blur(6px)'});
      const label=document.createElement('span'); label.textContent='Morph'; label.style.marginRight='8px';
      const input=document.createElement('input'); input.type='range'; input.min='0'; input.max='1'; input.step='0.01'; input.value='0';
      const val=document.createElement('span'); val.style.marginLeft='8px'; val.textContent='0.00';
      const setMorph=(v)=>{ val.textContent=v.toFixed(2);
        try{ const m=window.__consciousnessMaterial; const u=m?.uniforms; const key=u?.uMorphProgress?'uMorphProgress':(u?.morphProgress?'morphProgress':null); if(key){ u[key].value=v; m.uniformsNeedUpdate=true; } }catch{}
        try{ window.BeatBus?.emit?.(window.EVENTS?.MORPH_PROGRESS||'MORPH_PROGRESS',{value:v}); }catch{}
      };
      input.addEventListener('input', e => setMorph(parseFloat(e.target.value)));
      box.appendChild(label); box.appendChild(input); box.appendChild(val);
      document.body.appendChild(box);
    }
  })();
}
