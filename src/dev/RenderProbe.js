// @doctor:4r RenderProbe
(() => {
  if (typeof window === 'undefined' || window.__render_probe_loaded__) return;
  window.__render_probe_loaded__ = true;

  const root = document.createElement('div');
  root.id = '__render_probe__';
  root.style.cssText = 'position:fixed;z-index:2147483647;right:8px;top:8px;padding:6px 8px;font:12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;background:#111a;border:1px solid #333;color:#9fe;backdrop-filter:blur(3px);border-radius:6px;pointer-events:none';
  root.innerHTML = '🩺 RenderProbe — idle';
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.contains(root)) document.body.appendChild(root);
  });

  const canvas = document.createElement('canvas');
  canvas.width = 80; canvas.height = 40;
  canvas.style.cssText = 'display:block;margin-top:4px;border:1px solid #333';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const draw = (n=0) => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const dots = Math.min(60, n|0);
    for (let i=0;i<dots;i++){
      const x = Math.random()*canvas.width;
      const y = Math.random()*canvas.height;
      ctx.fillRect(x,y,1,1);
    }
  };

  window.__render_probe__ = {
    update(bp){
      try {
        const stage = bp?.stage ?? 'unknown';
        const qual  = bp?.quality ?? bp?.tier ?? 'unknown';
        const pc    = bp?.blueprint?.particleCount ?? bp?.particleCount ?? 0;
        root.firstChild.nodeValue = '🩺 RenderProbe — ' + stage + ' · ' + qual + ' · ' + pc + 'p';
        draw(pc/50);
      } catch(e) { console.warn('[RenderProbe]', e); }
    }
  };

  console.log('🩺 RenderProbe attached');
})();