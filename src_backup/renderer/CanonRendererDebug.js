import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
// Canon Console Renderer Debug Interface (v1.1)
// Loaded by WebGLBackground via side-effect import
(function () {
  function hasThree() { return !!(window.THREE || window.renderer); }

  window.canonRendererDebug = {
    testRender: () => {
      const bp = window.engineDebug?.getCurrentBlueprint?.();
      if (!bp) return console.warn('No blueprint available');
      window.webglBackground?.testRender?.();
      console.log('✅ Test render triggered');
    },
    checkHealth: () => {
      const stats = window.webglBackground?.getStats?.();
      const health = {
        renderer: !!window.renderer,
        scene: !!window.scene,
        camera: !!window.camera,
        points: !!window.points || !!(window.scene && window.scene.children?.some(c => c.isPoints)),
        particleCount: stats?.particleCount || 0,
        fps: stats?.fps || 0,
        memory: stats?.memory || {}
      };
      try { console.table(health); } catch { console.log(health); }
      return health;
    },
    forceUpdate: () => {
      const bp = window.engineDebug?.getCurrentBlueprint?.();
      if (bp && window.particleRenderer) {
        window.particleRenderer.upsert(bp);
        console.log('✅ Forced particle update');
      }
    },
    greenTest: () => {
      if (!hasThree()) return console.warn('THREE not available');
      const THREE_NS = window.THREE ?? {};
      const pts =
        window.points ||
        (window.scene && window.scene.children?.find?.(c => c.isPoints));
      if (!pts) return console.warn('No Points in scene');
      if (THREE_NS.Color) pts.material.color = new THREE_NS.Color(0x00ff00);
      pts.material.size = 8;
      pts.material.needsUpdate = true;
      window.renderer?.render?.(window.scene, window.camera);
      console.log('✅ Particles should be bright green now');
    },
    stressTest: (count = 10) => {
      if (!window.renderer) return console.warn('No renderer');
      const times = [];
      for (let i = 0; i < count; i++) {
        const t = performance.now();
        window.renderer.render(window.scene, window.camera);
        times.push(performance.now() - t);
      }
      const avg = times.reduce((a, b) => a + b, 0) / Math.max(times.length,1);
      console.log(`📊 Average render: ${avg.toFixed(2)}ms → ${(1000/avg).toFixed(0)} FPS`);
    }
  };

  console.log('🎮 Canon Renderer Debug ready → canonRendererDebug.checkHealth() / testRender() / greenTest()');
})();
