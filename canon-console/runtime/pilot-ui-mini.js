// canon-console/runtime/pilot-ui-mini.js
(function(){
  if (typeof window==='undefined') return;
  if (document.getElementById('canon-pilot-ui')) return;
  const box=document.createElement('div'); box.id='canon-pilot-ui';
  box.style='position:fixed;right:10px;bottom:10px;z-index:10050;font:12px/1.4 monospace;background:#000a;color:#0f8;padding:8px 10px;border:1px solid #0f8;border-radius:6px';
  const btn=document.createElement('button'); btn.textContent='Auto: ...'; btn.style='all:unset;cursor:pointer;color:#0cf;margin-right:8px';
  const span=document.createElement('span'); span.textContent='Pilot idle';
  box.appendChild(btn); box.appendChild(span); document.body.appendChild(box);
  const sync=()=>{ try{ const st=window.CANON_PILOT?.getState?.(); btn.textContent='Auto: '+(st?.auto?'ON':'OFF'); }catch{} };
  btn.onclick=()=>{ const st=window.CANON_PILOT?.getState?.(); window.CANON_PILOT?.setAuto?.(!st?.auto); sync(); };
  window.addEventListener('canon:pilot:action', e=>{ const a=e.detail; span.textContent = a?.type==='playbook' ? ('Applied '+a.id+' ['+(a.result?.ok?'ok':'fail')+']') : 'Pilot action'; });
  window.addEventListener('canon:pilot:decision', e=>{ span.textContent = 'Decision: '+(e.detail?.decision?.action||'OBSERVE'); });
  setInterval(sync, 1000); sync();
})();