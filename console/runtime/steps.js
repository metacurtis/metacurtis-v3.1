// console/runtime/steps.js
// Minimal L2 step library (no deps), uses THREE from global import inside inject runtime.
export const Steps = {
  async set_draw_range_from_uniforms(ctx){
    const live = window.scene; if (!live) return { ok:false, error:'no live scene' };
    let points=null; live.traverse(o=>{ if(!points && o.isPoints && o.geometry) points=o; });
    if (!points) return { ok:false, error:'no Points geometry' };
    const geo = points.geometry; const attr = geo.getAttribute('position');
    const max = attr? attr.count : 0;
    const active = Math.min(max, Math.floor(points.material?.uniforms?.uActiveCount?.value ?? max));
    if (Number.isFinite(active) && active>0){ geo.setDrawRange(0, active); }
    return { ok:true, active };
  },
  async compile_variant(ctx, args={}) {
    const { defines = {}, target = 'shadow' } = args;
    const { THREE, shaders, ShadowRenderer } = ctx.deps;
    if (!ctx.shadow) ctx.shadow = new ShadowRenderer(THREE);
    await ctx.shadow.init();
    const mat = ctx.shadow.buildMaterial(shaders.vs, shaders.fs, defines);
    const result = await ctx.shadow.compileAndWarm(mat);
    ctx.shadowMaterial = mat;
    ctx.shadowCompile = result;
    return { ok: result.compileOk && result.linkOk && result.validateOk, ...result };
  },

  async assert(ctx, args={}) {
    const { shaderCompileOk=true, linkOk=true, validateOk=true } = args;
    const r = ctx.shadowCompile || {};
    const ok = (!!r.compileOk === shaderCompileOk) && (!!r.linkOk === linkOk) && (!!r.validateOk === validateOk);
    return { ok, details: r };
  },

  async hotswap_material(ctx, args={}) {
    // Replace the first ShaderMaterial Points in live scene with the validated shadowMaterial
    const live = window.scene;
    const renderer = window.renderer;
    if (!live || !renderer) return { ok:false, error:'no live scene/renderer' };

    let points = null;
    live.traverse(o=>{
      if (!points && o.isPoints && o.material && o.material.isShaderMaterial) points = o;
    });
    if (!points) return { ok:false, error:'no target Points with ShaderMaterial' };
    ctx._swapTarget = points;

    // clone to detach from shadow renderer; copy known uniforms (esp. uAtlasTexture)
    const newMat = ctx.shadowMaterial.clone();
    const oldMat = points.material;
    if (oldMat && oldMat.uniforms && newMat.uniforms) {
      for (const k of Object.keys(oldMat.uniforms)) {
        if (newMat.uniforms[k]) newMat.uniforms[k].value = oldMat.uniforms[k].value;
      }
    }
    points.material = newMat;
    points.material.needsUpdate = true;
    ctx._materialOld = oldMat;
    ctx._materialNew = newMat;
    return { ok:true };
  },

  async verify_metrics(ctx, args={}) {
    const { fpsMin = 50, glErrors = 0, probeMs = 240 } = args;
    const renderer = window.renderer;
    const scene = window.scene;
    const camera = window.camera;
    if (!renderer || !scene || !camera) return { ok:false, error:'no live renderer/scene/camera' };

    const gl = renderer.getContext?.();
    const t0 = performance.now(); let frames = 0; let lastErr = 0;
    while (performance.now() - t0 < probeMs) {
      renderer.render(scene, camera);
      frames++;
      if (gl && gl.getError) lastErr = gl.getError();
    }
    const fps = (frames / (probeMs/1000));
    const ok = fps >= fpsMin && (lastErr === glErrors);
    return { ok, fps, lastErr };
  },

  async rollback(ctx) {
    if (ctx._swapTarget && ctx._materialOld) {
      ctx._swapTarget.material = ctx._materialOld;
      ctx._swapTarget.material.needsUpdate = true;
      ctx._materialOld = null; ctx._materialNew = null;
    }
    return { ok:true };
  }
};