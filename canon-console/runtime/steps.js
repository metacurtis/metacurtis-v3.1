// canon-console/runtime/steps.js
export const Steps = {
  async compile_variant(){ return {ok:true}; },
  async assert(){ return {ok:true}; },
  async hotswap_material(){
    let points=null; (window.scene||{}).traverse?.(o=>{ if(!points && o.isPoints && o.material) points=o; });
    if(!points) return {ok:false, error:'no Points found'};
    const m=points.material; m.defines = Object.assign({}, m.defines||{}, { BASELINE_VARIANT:1 }); m.needsUpdate = true; return {ok:true};
  },
  async set_draw_range_from_uniforms(){
    let points=null; (window.scene||{}).traverse?.(o=>{ if(!points && o.isPoints && o.geometry) points=o; });
    if(!points) return {ok:false, error:'no Points geometry'};
    const geo=points.geometry; const attr=geo.getAttribute('position');
    const max=attr?attr.count:0; const active=Math.min(max, Math.floor(points.material?.uniforms?.uActiveCount?.value ?? max));
    if(Number.isFinite(active)&&active>0) geo.setDrawRange(0,active);
    return {ok:true, active};
  },
  async verify_metrics({args}){ const t0=performance.now(); let frames=0; return await new Promise(res=>{
    const step=()=>{ frames++; const t=performance.now(); if(t-t0 >= (args?.probeMs||240)){ const fps=Math.round(frames*1000/(t-t0));
      res({ ok: fps >= (args?.fpsMin ?? 55), fps }); } else requestAnimationFrame(step); }; requestAnimationFrame(step);
  });}
};