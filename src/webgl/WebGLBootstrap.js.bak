// Auto-generated WebGL Bootstrap
import * as THREE from 'three';

class WebGLBootstrap {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animationId = null;
  }

  init(container = document.body) {
    console.log('[WebGLBootstrap] Initializing...');

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // Make globally accessible for debugging
    window.renderer = this.renderer;
    window.scene = this.scene;
    window.camera = this.camera;

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Render loop exists elsewhere

    // Verification cube (remove after confirming it works)
    this.addTestCube();

    console.log('[WebGLBootstrap] ✅ Initialization complete');
    return { renderer: this.renderer, scene: this.scene, camera: this.camera };
  }

  handleResize() {
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    // Rotate test cube if it exists
    if (this.testCube) {
      this.testCube.rotation.x += 0.01;
      this.testCube.rotation.y += 0.01;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  addTestCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    this.testCube = new THREE.Mesh(geometry, material);
    this.scene.add(this.testCube);
    console.log('[WebGLBootstrap] Test cube added - you should see a green wireframe cube');
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.handleResize);
  }
}

// Auto-initialize if imported
const bootstrap = new WebGLBootstrap();

// Export for manual control
export { bootstrap, WebGLBootstrap };

// Initialize on DOM ready if not already initialized
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.renderer) {
        bootstrap.init();
      }
    });
  } else {
    // DOM already loaded
    setTimeout(() => {
      if (!window.renderer) {
        bootstrap.init();
      }
    }, 100);
  }
}
