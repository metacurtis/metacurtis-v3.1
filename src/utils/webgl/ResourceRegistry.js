// src/utils/webgl/ResourceRegistry.js

class ResourceRegistry {
  constructor() {
    this._resources = {
      geometry: new Set(),
      material: new Set(),
      texture: new Set(),
    };
    this._listeners = new Set();
  }

  /**
   * Register a resource of a given type.
   * @param {'geometry'|'material'|'texture'} type
   * @param {object} item
   */
  register(type, item) {
    if (!this._resources[type].has(item)) {
      this._resources[type].add(item);
      this._emit();
    }
  }

  /**
   * Unregister (dispose) a resource.
   * @param {'geometry'|'material'|'texture'} type
   * @param {object} item
   */
  unregister(type, item) {
    if (this._resources[type].delete(item)) {
      this._emit();
    }
  }

  /** Synchronous snapshot of counts */
  getStats() {
    return {
      geometry: this._resources.geometry.size,
      material: this._resources.material.size,
      texture: this._resources.texture.size,
    };
  }

  /**
   * Subscribe to changes. Immediately calls your callback with the
   * current stats, then on every register/unregister.
   * @param {function(Object)} callback
   * @returns {() => void} unsubscribe
   */
  subscribe(callback) {
    this._listeners.add(callback);
    // immediate notify
    callback(this.getStats());
    return () => {
      this._listeners.delete(callback);
    };
  }

  /** @private */
  _emit() {
    const stats = this.getStats();
    for (const fn of this._listeners) fn(stats);
  }
}

// Export a singleton instance:
export default new ResourceRegistry();
