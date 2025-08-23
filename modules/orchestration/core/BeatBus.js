// src/modules/orchestration/core/BeatBus.js
// Central event system for the consciousness theater

class BeatBus {
  constructor() {
    this.listeners = new Map();
    this.eventLog = [];
    this.maxLogSize = 100;
    this.debug = import.meta.env.DEV;
  }

  // Subscribe to an event
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(callback);

    if (this.debug) {
      console.log(`🚌 BeatBus: Subscribed to ${eventName}`);
    }

    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  // Subscribe to an event once
  once(eventName, callback) {
    const wrappedCallback = data => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };

    return this.on(eventName, wrappedCallback);
  }

  // Unsubscribe from an event
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;

    this.listeners.get(eventName).delete(callback);

    // Clean up empty listener sets
    if (this.listeners.get(eventName).size === 0) {
      this.listeners.delete(eventName);
    }

    if (this.debug) {
      console.log(`🚌 BeatBus: Unsubscribed from ${eventName}`);
    }
  }

  // Emit an event
  emit(eventName, data = {}) {
    // Log the event
    this.logEvent(eventName, data);

    if (this.debug) {
      console.log(`🚌 BeatBus: Emitting ${eventName}`, data);
    }

    // Get listeners for this event
    const listeners = this.listeners.get(eventName);
    if (!listeners || listeners.size === 0) {
      if (this.debug) {
        console.warn(`🚌 BeatBus: No listeners for ${eventName}`);
      }
      return;
    }

    // Call all listeners
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`🚌 BeatBus: Error in ${eventName} listener:`, error);
      }
    });
  }

  // Clear all listeners for an event
  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  // Get listener count for an event
  getListenerCount(eventName) {
    const listeners = this.listeners.get(eventName);
    return listeners ? listeners.size : 0;
  }

  // Get all registered events
  getRegisteredEvents() {
    return Array.from(this.listeners.keys());
  }

  // Log events for debugging
  logEvent(eventName, data) {
    const timestamp = Date.now();
    this.eventLog.push({ eventName, data, timestamp });

    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }

  // Get event log
  getEventLog() {
    return [...this.eventLog];
  }

  // Clear event log
  clearEventLog() {
    this.eventLog = [];
  }

  // Get debug info
  getDebugInfo() {
    const info = {
      registeredEvents: this.getRegisteredEvents(),
      listenerCounts: {},
      recentEvents: this.eventLog.slice(-10),
    };

    this.listeners.forEach((listeners, eventName) => {
      info.listenerCounts[eventName] = listeners.size;
    });

    return info;
  }
}

// Create singleton instance
const beatBus = new BeatBus();

// Global debug access
if (import.meta.env.DEV) {
  window.BeatBus = beatBus;
  window.beatBusDebug = {
    getListeners: () => beatBus.listeners,
    getEventLog: () => beatBus.getEventLog(),
    clearEventLog: () => beatBus.clearEventLog(),
    getDebugInfo: () => beatBus.getDebugInfo(),
    getListenerMap: () => {
      const map = {};
      beatBus.listeners.forEach((listeners, event) => {
        map[event] = listeners.size;
      });
      return map;
    },
    testEmit: (eventName, data) => beatBus.emit(eventName, data),
  };

  console.log('🚌 BeatBus Debug Tools:');
  console.log('  window.beatBusDebug.getEventLog()');
  console.log('  window.beatBusDebug.getListenerMap()');
  console.log('  window.beatBusDebug.getDebugInfo()');
  console.log('  window.beatBusDebug.testEmit(eventName, data)');
}

// Export the singleton
export default beatBus;

// Also export the class for testing if needed
export { BeatBus };
