/* HotDors Text SelfBoot — patch + verify (no UI, console only)
   Auto-runs when imported. Exposes: hotdors.verify(), hotdors.fit(), hotdors.setPointSize(px),
   hotdors.setScale(s), hotdors.densify(ms), hotdors.purgeAllen({geometry:true})
*/
(() => {
  if (window.__HOTDORS_TEXT_SELFBOOT__) return;
  window.__HOTDORS_TEXT_SELFBOOT__ = true;

  const LOG  = (...a)=>console.log('%c[HotDors]', 'color:#7CFCC5', ...a);
  const WARN = (...a)=>console.warn('%c[HotDors]', 'color:#FFB86B', ...a);

  // --- R3F discovery ---
  function getStores(){
    const out=[]; document.querySelectorAll('canvas').forEach(c=>{
      const gs=c.__r3f?.root?.getState||c.__r3f?.store?.getState||c.__r3f?.fiber?.store?.getState;
      if (!gs) return; try { const st=gs(); if (st?.scene&&st?.camera) out.push({canvas:c,state:st}); } catch{}
    }); return out;
  }
  function pickPoints(state){
    const pts=[]; state.scene.traverse(o=>{ if(o?.isPoints&&o.geometry&&o.material) pts.push(o); });
    if(!pts.length) return null;
    const score=g=>(g.getAttribute('atmosphericPosition')?10:0)+(g.getAttribute('text3DPosition')?6:0)+(g.getAttribute('text3DPosition')?2:0)+((g.getAttribute('position')?.count||0)/1e6);
    pts.sort((a,b)=>score(b.geometry)-score(a.geometry)); return pts[0];
  }

  // --- helpers ---
  const attr = (g,n)=>g?.getAttribute?.(n)||null;
  function computeTextBounds(geo){
    const t=attr(geo,'text3DPosition'); const a=t?.array; if(!a||!a.length) return null;
    let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
    for(let i=0;i<a.length;i+=3){ const x=a[i],y=a[i+1]; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
    return {minX,maxX,minY,maxY,cx:(minX+maxX)/2,cy:(minY+maxY)/2,w:maxX-minX,h:maxY-minY};
  }

  // --- patches ---
  function ensureTextAttr(geo){
    if (attr(geo,'text3DPosition')) return 'present';
    const allen = attr(geo,'text3DPosition');
    if (allen){ geo.setAttribute('text3DPosition', allen); return 'aliased'; }
    return 'missing';
  }
  function purgeAllenShader(mat){
    let vs=mat.vertexShader||''; let changed=false;
    if(/text3DPosition/.test(vs)){ vs=vs.replace(/text3DPosition/g,'text3DPosition'); changed=true; }
    const lifted=vs.replace(/clamp\(\s*gl_PointSize\s*,\s*1\.0\s*,\s*32\.0\s*\)/g,'clamp(gl_PointSize, 1.0, 64.0)');
    if(lifted!==vs){ vs=lifted; changed=true; }
    if(changed){ mat.vertexShader=vs; mat.needsUpdate=true; }
    return changed;
  }
  function purgeAllenGeometry(geo){
    if (attr(geo,'text3DPosition') && attr(geo,'text3DPosition')) {
      try { geo.deleteAttribute('text3DPosition'); return true; } catch {}
    }
    return false;
  }
  function bumpPointSize(mat,minPx=36){
    const u=mat.uniforms||{}; if(u.uPointSize && typeof u.uPointSize.value==='number' && u.uPointSize.value<minPx){ u.uPointSize.value=minPx; mat.uniformsNeedUpdate=true; return true; }
    return false;
  }
  function setFullDrawRange(geo){
    const pos=attr(geo,'position'); const buf=pos?.count||0;
    const dr = (geo.drawRange && typeof geo.drawRange.count==='number')?geo.drawRange.count:buf;
    if(buf && dr<buf){ geo.setDrawRange(0,buf); return {buf,prev:dr,changed:true}; }
    return {buf,prev:dr,changed:false};
  }
  function fitCameraToText({geo,mesh,cam,size,pad=1.25,fill=0.8}){
    const b=computeTextBounds(geo); if(!b) return false;
    mesh.position.set(-b.cx,-b.cy,0);
    const vfov=cam.fov*Math.PI/180; const z=cam.position.z||60; const viewH=2*z*Math.tan(vfov/2);
    const scale=(viewH*fill)/Math.max(1e-6,b.h); mesh.scale.set(scale,scale,1);
    const aspect = (size?.width&&size?.height)?(size.width/size.height):(innerWidth/innerHeight);
    const w=b.w*scale,h=b.h*scale; const distV=(h/2)/Math.tan(vfov/2)*pad; const distH=((w/2)/aspect)/Math.tan(vfov/2)*pad;
    cam.position.set(0,0,Math.max(distV,distH)); cam.updateProjectionMatrix(); return true;
  }
  function densifyOver(ms,mat,geo){
    const pos=attr(geo,'position'); const cap=pos?.count||0; if(!cap) return;
    const u=mat.uniforms||{}; const start=(u.uActiveCount?.value|0)||Math.min(2000,cap);
    const steps=Math.max(1,Math.floor(ms/160)); const inc=Math.max(1,Math.floor((cap-start)/steps));
    let cur=Math.max(1,start); const iv=setInterval(()=>{ cur=Math.min(cap,cur+inc); geo.setDrawRange(0,cur); if(u.uActiveCount){u.uActiveCount.value=cur; mat.uniformsNeedUpdate=true;} if(cur>=cap) clearInterval(iv); },160);
  }

  function verify({mesh,geo,mat,cam}){
    const u=mat.uniforms||{}; const pos=attr(geo,'position'); const text=attr(geo,'text3DPosition'); const allen=attr(geo,'text3DPosition');
    const buf=pos?.count||0; const draw=(geo.drawRange && typeof geo.drawRange.count==='number')?geo.drawRange.count:buf;
    const usesAllen=/text3DPosition/i.test(mat.vertexShader||''); const sizePx=u.uPointSize?.value ?? null; const active=u.uActiveCount?.value ?? draw;
    const b=computeTextBounds(geo);
    const vfov = cam.fov*Math.PI/180; const z=cam.position.z||60; const viewH=2*z*Math.tan(vfov/2);
    const hFrac = b ? +(((b.h*mesh.scale.y)/viewH).toFixed(2)) : null;

    const checks = {
      text_attr_present: !!text,
      shader_has_allen:  !usesAllen,
      point_size_ok:     typeof sizePx==='number' && sizePx>=24,
      draw_ok:           draw>=Math.min(buf,active),
      active_le_buf:     active<=buf
    };
    const pass = (checks.text_attr_present && !usesAllen && checks.point_size_ok && checks.draw_ok && checks.active_le_buf);
    console.groupCollapsed(pass ? '%cSELF-VERIFY PASS' : '%cSELF-VERIFY WARN', pass ? 'color:#7CFCC5;font-weight:700' : 'color:#FFB86B;font-weight:700');
    console.table({
      text3DPosition: checks.text_attr_present, shader_uses_allen: usesAllen, uPointSize: sizePx,
      draw: draw+'/'+buf, active, heightCoverage: (hFrac!=null? (hFrac*100|0)+'%':'n/a')
    });
    console.groupEnd();
    return { pass, buf, draw, active, sizePx, hFrac };
  }

  function applyOnce(){
    const stores=getStores(); if(!stores.length) return false;
    let chosen=null, S=null; for(const s of stores){ const p=pickPoints(s.state); if(p){ chosen=p; S=s.state; break; } }
    if(!chosen) return false;
    const mesh=chosen, geo=chosen.geometry, mat=chosen.material, cam=S.camera;

    const textState = ensureTextAttr(geo);
    if (textState==='missing') WARN('No text3DPosition/text3DPosition on geometry.');

    const ps = purgeAllenShader(mat); if(ps) LOG('Patched shader (allen→text, size clamp ≤64).');
    const bumped = bumpPointSize(mat,36); if(bumped) LOG('Raised uPointSize → 36.');
    const dr = setFullDrawRange(geo); if(dr.changed) LOG('Expanded drawRange', dr.prev, '→', dr.buf+'.');

    const fitted = fitCameraToText({geo,mesh,cam,size:S.size,pad:1.25,fill:0.8}); if(fitted) LOG('Fit camera to text.');
    const u=mat.uniforms||{}; const active=(u.uActiveCount?.value|0)||0; const cap=attr(geo,'position')?.count||0;
    if (!active || active<cap) { densifyOver(1200,mat,geo); LOG('Densifying to full buffer.'); }

    window.hotdors = {
      mesh, geo, mat, cam, state:S,
      verify: ()=>verify({mesh,geo,mat,cam}),
      fit: ()=>fitCameraToText({geo,mesh,cam,size:S.size}),
      setPointSize:(px=36)=>{ if(mat.uniforms?.uPointSize){ mat.uniforms.uPointSize.value=px; mat.uniformsNeedUpdate=true; LOG('uPointSize →',px); } },
      setScale:(s=1)=>{ mesh.scale.set(s,s,1); LOG('mesh scale →',s); },
      densify:(ms=1200)=>densifyOver(ms,mat,geo),
      purgeAllen:(opts={geometry:false})=>{
        const changedVS = purgeAllenShader(mat);
        let removed=false; if(opts.geometry) removed = purgeAllenGeometry(geo);
        LOG('purgeAllen',{shaderPatched:changedVS, geometryRemoved:removed});
        return { shaderPatched:changedVS, geometryRemoved:removed };
      }
    };

    const res=verify({mesh,geo,mat,cam});
    if(res.pass) LOG('Self-verify PASS'); else WARN('Self-verify WARN — see table.');
    return true;
  }

  let tries=0; (function loop(){ const ok=applyOnce(); if(!ok && tries++<300) requestAnimationFrame(loop); })();
})();
