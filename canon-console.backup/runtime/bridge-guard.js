// canon-console/runtime/bridge-guard.js
(function(){
  if (typeof window==='undefined') return;
  const gpu = ()=>{ try{ const c=document.createElement('canvas'); const gl=c.getContext('webgl2')||c.getContext('webgl');
    const dbg=gl && gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
    const vendor=dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):undefined;
    const renderer=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):undefined;
    return { webgl2:!!c.getContext('webgl2'), vendor, renderer, integrated:/Intel|Iris|UHD/i.test(String(renderer)) }; }catch(_){ return {}; } };
  const push=(code,msg,detail={})=>{
    window.CANON_PILOT?.create?.({ code, severity: detail.severity||'info', message:String(msg||code),
      evidence:{ logs: detail.logs, glLog: detail.glLog, linkLog: detail.linkLog },
      context:{ stage: detail.stage, particleCount: detail.particleCount, gpu: gpu(), shader: detail.shader },
      tags:(['CanonGuard']).concat(detail.tags||[]) });
  };
  window.addEventListener('canon:blueprint:guarded', e=>{
    const d=e.detail||{}; const fixes=Array.isArray(d.fixes)?d.fixes.join(', '):(d.fixes||'');
    push('BLUEPRINT_GUARDED', 'Blueprint guarded '+(fixes||'(no-op)'), d);
  });
  window.addEventListener('canon:guard:action', e=>{
    const d=e.detail||{}; push(d.code||'GUARD_ACTION', d.message||'Guard action', d);
  });
  console.info('🔗 Guard→Console bridge active');
})();