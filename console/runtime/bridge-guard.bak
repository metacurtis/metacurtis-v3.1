// console/runtime/bridge-guard.js
(function(){
  if (typeof window==='undefined') return;
  const gpuInfo = ()=>{
    try{ const c=document.createElement('canvas'); const gl=c.getContext('webgl2')||c.getContext('webgl');
      const dbg = gl && gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):undefined;
      const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):undefined;
      return { webgl2: !!c.getContext('webgl2'), vendor, renderer, integrated:/Intel|Iris|UHD/i.test(renderer||'') };
    }catch(_){ return {}; }
  };
  const push = (code, message, detail={})=>{
    try{
      window.CANON_PILOT?.create({
        code, severity:(detail.severity||'info'), message: String(message||code),
        evidence: { logs: detail.logs, glLog: detail.glLog, linkLog: detail.linkLog, file: detail.file, line: detail.line, column: detail.column },
        context: { stage: detail.stage, particleCount: detail.particleCount, gpu: gpuInfo(), shader: detail.shader },
        tags: ['CanonGuard'].concat(detail.tags||[])
      });
    } catch(e){ /* noop */ }
  };

  // If Canon Guard emits structured events, lift them into Console incidents.
  window.addEventListener('canon:blueprint:guarded', (e)=>{
    const d = e.detail || {};
    const fixes = Array.isArray(d.fixes)? d.fixes.join(', '): (d.fixes||'');
    push('BLUEPRINT_GUARDED', `Blueprint guarded ${fixes||'(no-op)'}`, d);
  });

  window.addEventListener('canon:guard:action', (e)=>{
    const d = e.detail || {};
    push(d.code || 'GUARD_ACTION', d.message || 'Guard action', d);
  });

  // Optional: pick up Guard console breadcrumbs
  const origError = console.error, origWarn = console.warn;
  console.error = (...args)=>{ try{ if (String(args[0]).includes('Canon Guard')) push('GUARD_ERROR', args.map(String).join(' '), {severity:'error'});}catch (_) { /* noop */ }; origError(...args); };
  console.warn  = (...args)=>{ try{ if (String(args[0]).includes('Canon Guard')) push('GUARD_WARN',  args.map(String).join(' '), {severity:'warn'});}catch (_) { /* noop */ };  origWarn(...args);  };

  console.info('�� Canon L2↔Guard bridge listening');
})();
