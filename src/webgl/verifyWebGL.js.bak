// WebGL Verification Script
export function verifyWebGL() {
  const report = {
    renderer: !!window.renderer,
    scene: !!window.scene,
    camera: !!window.camera,
    canvas: !!document.querySelector('canvas'),
    THREE: !!window.THREE,
  };

  console.table(report);

  if (Object.values(report).every(v => v)) {
    console.log('✅ WebGL fully initialized');
  } else {
    console.error('❌ WebGL initialization incomplete:', report);
  }

  return report;
}

// Add to window for console access
window.verifyWebGL = verifyWebGL;

// Auto-verify after short delay
setTimeout(verifyWebGL, 1000);
