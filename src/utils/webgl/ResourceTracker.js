// src/utils/webgl/ResourceTracker.js
import Registry from './ResourceRegistry.js';

export default class ResourceTracker {
  constructor() {
    this._registered = new Set();
  }

  /**
   * Recursively register all Three.js resources under an Object3D.
   * @param {THREE.Object3D} obj
   * @returns {THREE.Object3D}
   */
  track(obj) {
    obj.traverse(child => {
      // Geometry
      if (child.geometry && !this._registered.has(child.geometry)) {
        Registry.register('geometry', child.geometry);
        this._registered.add(child.geometry);
      }
      // Material(s)
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (!this._registered.has(mat)) {
            Registry.register('material', mat);
            this._registered.add(mat);
            // Textures on material
            for (const value of Object.values(mat)) {
              if (value && value.isTexture && !this._registered.has(value)) {
                Registry.register('texture', value);
                this._registered.add(value);
              }
            }
          }
        }
      }
    });
    return obj;
  }

  /**
   * Dispose all resources tracked by this instance.
   */
  dispose() {
    for (const res of this._registered) {
      if (typeof res.dispose === 'function') {
        res.dispose();
      }
      let type = null;
      if (res.isTexture) type = 'texture';
      else if (res.isMaterial) type = 'material';
      else if (res.isBufferGeometry || res.isGeometry) type = 'geometry';
      if (type) {
        Registry.unregister(type, res);
      }
    }
    this._registered.clear();
  }
}
