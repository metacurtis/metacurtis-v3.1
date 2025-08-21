// @doctor:4b-disposers
const __doctorDisposers = []; // WebGL Verification Script
export function verifyWebGL() {const report = {
    renderer: !!window.renderer,
    scene: !!window.scene,
    camera: !!window.camera,
    canvas: !!document.querySelector('canvas'),
    THREE: !!window.THREE
  };

  console.table(report);

  if (Object.values(report).every((v) => v)) {
    console.log('✅ WebGL fully initialized');
  } else {
    console.error('❌ WebGL initialization incomplete:', report);
  }

  return report;
}

// Add to window for console access
window.verifyWebGL = verifyWebGL;

// Auto-verify after short delay
setTimeout(verifyWebGL, 1000); // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}