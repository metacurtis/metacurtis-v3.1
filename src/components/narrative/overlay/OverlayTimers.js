/**
 * Unified timer management for NarrationOverlay.
 * Prevents race conditions and timer leaks by naming timers.
 */

export class OverlayTimers {
  constructor() {
    this.registry = {
      grace: null,
      typewriter: null,
      transition: null,
    };
  }

  /**
   * Set a named timer (clearing any existing timer first).
   */
  set(name, callback, delay) {
    this.clear(name);
    // eslint-disable-next-line no-console
    console.log(`⏱️ [OverlayTimers] set ${name} (${delay}ms)`);
    this.registry[name] = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`⏰ [OverlayTimers] ${name} fired`);
      this.registry[name] = null;
      callback();
    }, delay);
  }

  /**
   * Clear a named timer.
   */
  clear(name) {
    if (this.registry[name]) {
      // eslint-disable-next-line no-console
      console.log(`🚫 [OverlayTimers] clear ${name}`);
      clearTimeout(this.registry[name]);
      this.registry[name] = null;
    }
  }

  /**
   * Clear all timers.
   */
  clearAll() {
    // eslint-disable-next-line no-console
    console.log('🧹 [OverlayTimers] clearAll');
    Object.keys(this.registry).forEach((name) => this.clear(name));
  }

  /**
   * Is a timer active?
   */
  isActive(name) {
    return this.registry[name] !== null;
  }

  /**
   * Return array of active timer names.
   */
  getActive() {
    return Object.keys(this.registry).filter((name) => this.registry[name] !== null);
  }

  /**
   * Snapshot of the timer registry (for diagnostics).
   */
  getSnapshot() {
    return Object.fromEntries(
      Object.entries(this.registry).map(([name, value]) => [name, value !== null]),
    );
  }
}
