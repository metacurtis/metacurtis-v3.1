// src/utils/webgl/ResourceTracker.js
// This file defines the ResourceTracker CLASS.
// It should be default exported.

export default class ResourceTracker {
  constructor() {
    this.resources = new Set();
    console.log('ResourceTracker Class: Instance created');
  }

  track(resource) {
    if (!resource || this.resources.has(resource)) {
      return resource;
    }
    this.resources.add(resource);
    // console.log('ResourceTracker: Tracking', resource.constructor.name, resource.uuid);

    if (resource.isObject3D && typeof resource.traverse === 'function') {
      resource.traverse(child => {
        if (child.isMesh || child.isPoints || child.isLine) {
          if (child.geometry && !this.resources.has(child.geometry)) {
            this.resources.add(child.geometry);
          }
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
              if (material && !this.resources.has(material)) {
                this.resources.add(material);
                this._trackMaterialTextures(material);
              }
            });
          }
        }
      });
    } else if (resource.isMaterial) {
      this._trackMaterialTextures(resource);
    }
    return resource;
  }

  _trackMaterialTextures(material) {
    if (!material) return;
    for (const key in material) {
      if (material[key] && material[key].isTexture && !this.resources.has(material[key])) {
        this.resources.add(material[key]);
      }
    }
  }

  untrack(resource) {
    this.resources.delete(resource);
  }

  dispose() {
    let disposedCount = 0;
    console.log(`ResourceTracker Class: Disposing ${this.resources.size} tracked resources...`);
    for (const resource of this.resources) {
      if (resource.dispose && typeof resource.dispose === 'function') {
        resource.dispose();
        disposedCount++;
      } else if (resource.isWebGLRenderTarget) {
        resource.dispose();
        disposedCount++;
      }
    }
    this.resources.clear();
    console.log(`ResourceTracker Class: Successfully disposed of ${disposedCount} resources.`);
  }
}
