/**
 * RendererPort implementation for three.js.
 * Works as a stub if 'three' isn't installed yet.
 */
let ctx = { el:null, renderer:null, scene:null, camera:null, _resize:null };

export async function init(el, opts = {}) {
  ctx.el = el;
  try {
    const THREE = await import('three');
    const canvas = el instanceof globalThis.HTMLCanvasElement ? el : undefined;
    ctx.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
    if (!canvas) el.appendChild(ctx.renderer.domElement);
    ctx.scene = new THREE.Scene();
    ctx.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    ctx.camera.position.set(0, 0, 5);

    const resize = () => {
      const w = el.clientWidth || el.width || 1;
      const h = el.clientHeight || el.height || 1;
      ctx.renderer.setSize(w, h, false);
      ctx.camera.aspect = w / h;
      ctx.camera.updateProjectionMatrix();
    };
    resize();
    globalThis.addEventListener?.('resize', resize);
    ctx._resize = resize;

    // simple ambient to prove it's alive (if three exists)
    const light = new THREE.AmbientLight(0xffffff, 1.0);
    ctx.scene.add(light);
  } catch (e) {
    console.warn('[adapter/three] "three" not installed, running as no-op.', e?.message);
  }
}

export function update(dt, state) {
  if (ctx.renderer && ctx.scene && ctx.camera) {
    ctx.renderer.render(ctx.scene, ctx.camera);
  }
}

export function dispose() {
  if (ctx._resize) globalThis.removeEventListener?.('resize', ctx._resize);
  if (ctx.renderer) ctx.renderer.dispose();
  ctx = { el:null, renderer:null, scene:null, camera:null, _resize:null };
}
