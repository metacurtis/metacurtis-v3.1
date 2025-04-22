// src/utils/webgl/ResourceRegistry.js

/**
 * Singleton registry to track all created WebGL resources.
 * Categorizes by type and emits lifecycle events.
 */
class ResourceRegistry {
  constructor() {
    if (ResourceRegistry._instance) {
      return ResourceRegistry._instance;
    }
    this.resources = {
      texture: new Set(),
      material: new Set(),
      geometry: new Set(),
      buffer: new Set(),
      other: new Set(),
    };
    this.listeners = new Set();
    ResourceRegistry._instance = this;
  }

  /**
   * Register a resource under its type.
   * @param {string} type  – 'texture'|'material'|'geometry'|'buffer'|'other'
   * @param {*} resource
   */
  register(type, resource) {
    (this.resources[type] || this.resources.other).add(resource);
    this.emit('registered', { type, resource });
  }

  /**
   * Unregister a resource.
   * @param {string} type
   * @param {*} resource
   */
  unregister(type, resource) {
    (this.resources[type] || this.resources.other).delete(resource);
    this.emit('unregistered', { type, resource });
  }

  /**
   * Dispose and remove every tracked resource.
   */
  disposeAll() {
    for (const [type, set] of Object.entries(this.resources)) {
      for (const res of set) {
        if (typeof res.dispose === 'function') {
          res.dispose();
        }
        this.emit('disposed', { type, resource: res });
      }
      set.clear();
    }
  }

  /**
   * Subscribe to registry events.
   * @param {(event:string, payload:any)=>void} callback
   * @returns {() => void} unsubscribe
   */
  on(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(event, payload) {
    for (const cb of this.listeners) {
      try {
        cb(event, payload);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Get counts of each resource type.
   */
  getCounts() {
    const counts = {};
    for (const [type, set] of Object.entries(this.resources)) {
      counts[type] = set.size;
    }
    return counts;
  }
}

export default new ResourceRegistry();
