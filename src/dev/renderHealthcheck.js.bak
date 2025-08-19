// src/dev/renderHealthcheck.js
(function(){
  if (typeof window==='undefined' || window.__RENDER_HEALTHCHECK__) return;
  async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  async function run({force=false}={}){
    const renderer = window.renderer, scene = window.scene, camera = window.camera;
    if (!renderer || !scene || !camera) return { ok:false, reason:'no renderer/scene/camera' };
    const before = { calls: renderer.info.render.calls, frame: performance.now() };
    // optional: try to kick a minimal tick
    renderer.render(scene, camera);
    await sleep(16);
    const after = { calls: renderer.info.render.calls, frame: performance.now() };
    const gl = renderer.getContext?.();
    const err = gl && gl.getError ? gl.getError() : 0;
    const ok = (after.calls > before.calls) && (!err || err===0);
    return { ok, callsDelta: after.calls - before.calls, glError: err||0, objects: scene.children.length };
  }
  window.__RENDER_HEALTHCHECK__ = run;
  console.info('🩺 Render healthcheck ready: await __RENDER_HEALTHCHECK__()');
})();