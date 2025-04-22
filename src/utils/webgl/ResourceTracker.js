// src/utils/webgl/ResourceTracker.js
import Registry from './ResourceRegistry.js';

/**
 * Tracks resources created/used by a single component or scene.
 */
export default class ResourceTracker {
  constructor() {
    this._registered = new Set();
  }

  track(obj) {
    obj.traverse(child => {
      if (child.geometry && !this._registered.has(child.geometry)) {
        Registry.register('geometry', child.geometry);
        this._registered.add(child.geometry);
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (!this._registered.has(mat)) {
            Registry.register('material', mat);
            this._registered.add(mat);
            for (const key in mat) {
              const val = mat[key];
              if (val && val.isTexture && !this._registered.has(val)) {
                Registry.register('texture', val);
                this._registered.add(val);
              }
            }
          }
        }
      }
    });
    return obj;
  }

  dispose() {
    for (const res of this._registered) {
      if (typeof res.dispose === 'function') res.dispose();
      const type = res.isTexture
        ? 'texture'
        : res.isMaterial
          ? 'material'
          : res.isGeometry
            ? 'geometry'
            : 'other';
      Registry.unregister(type, res);
    }
    this._registered.clear();
  }
}
