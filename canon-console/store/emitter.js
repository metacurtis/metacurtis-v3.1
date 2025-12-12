// Minimal browser-safe emitter (no Node deps)
export class Emitter {
  #map = new Map();
  
  on(type, fn) { 
    const set = this.#map.get(type) ?? this.#map.set(type, new Set()).get(type);
    set.add(fn); 
    return () => this.off(type, fn); 
  }
  
  off(type, fn) { 
    this.#map.get(type)?.delete(fn); 
  }
  
  emit(type, payload) { 
    this.#map.get(type)?.forEach(fn => { 
      try { 
        fn(payload); 
      } catch {} 
    }); 
  }
}

export default Emitter;
