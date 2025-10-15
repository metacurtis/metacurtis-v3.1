import * as THREE from 'three';

/**
 * Particle raycasting utility
 * Converts screen clicks to 3D particle hits
 */
export class ParticleRaycaster {
  constructor() {
    this.raycaster = new THREE.Raycaster();

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    this.raycaster.params.Points.threshold = isMobile ? 0.25 : 1.0; // Testing: increased for desktop
    console.log('🧪 Testing with threshold 1.0');

    this.mouse = new THREE.Vector2();

    console.log(
      `🎯 ParticleRaycaster initialized (threshold: ${this.raycaster.params.Points.threshold})`
    );
  }

  /**
   * Find particles intersected by click
   * @param {{x:number, y:number}} mouseNDC - Normalized device coords (-1..1)
   * @param {THREE.Camera} camera - Three.js camera
   * @param {THREE.Points} particleMesh - Particle system mesh
   * @returns {Array} Intersections with {index, distance, point}
   */
  checkIntersections(mouseNDC, camera, particleMesh) {
    if (!camera) {
      console.warn('[Raycaster] Missing camera');
      return [];
    }

    if (!particleMesh || !particleMesh.geometry) {
      console.warn('[Raycaster] Missing particle mesh or geometry');
      return [];
    }

    this.mouse.set(mouseNDC.x, mouseNDC.y);
    this.raycaster.setFromCamera(this.mouse, camera);

    const intersects = this.raycaster.intersectObject(particleMesh, false);

    if (intersects.length > 0) {
      console.log(`🎯 Hit ${intersects.length} particle(s)`);
      console.log(
        `   Closest: index ${intersects[0].index}, distance ${intersects[0].distance.toFixed(2)}`
      );
    }

    return intersects;
  }

  /**
   * Get closest particle from click
   * @param {{x:number, y:number}} mouseNDC
   * @param {THREE.Camera} camera
   * @param {THREE.Points} particleMesh
   * @returns {{index:number, distance:number, point:THREE.Vector3}|null}
   */
  getClosestParticle(mouseNDC, camera, particleMesh) {
    const intersects = this.checkIntersections(mouseNDC, camera, particleMesh);

    if (intersects.length === 0) {
      console.log('❌ No particle hit');
      return null;
    }

    return {
      index: intersects[0].index,
      distance: intersects[0].distance,
      point: intersects[0].point,
    };
  }

  /**
   * Adjust hit threshold (for testing or mobile)
   * @param {number} value
   */
  setThreshold(value) {
    this.raycaster.params.Points.threshold = value;
    console.log(`[Raycaster] Threshold set to ${value}`);
  }
}

export const particleRaycaster = new ParticleRaycaster();

if (typeof window !== 'undefined') {
  window.particleRaycaster = particleRaycaster;
}
