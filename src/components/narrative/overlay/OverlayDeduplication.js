/**
 * Event deduplication for NarrationOverlay.
 * Prevents duplicate events within a threshold window.
 */

export class OverlayDeduplicator {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.thresholdMs = config.thresholdMs ?? 100;
    this.lastEvent = {
      id: null,
      timestamp: 0,
    };
  }

  /**
   * Generate a deterministic event ID.
   */
  generateId(eventName, payload = {}) {
    if (eventName === 'NARRATIVE_LINE') {
      return `LINE:${payload.text ?? ''}:${payload.stage ?? ''}`;
    }

    if (eventName === 'START_NARRATIVE') {
      return `START:${payload.stage ?? ''}:${payload.source ?? ''}`;
    }

    return eventName;
  }

  /**
   * Check if event is duplicate.
   */
  check(eventName, payload) {
    if (!this.enabled) {
      return { isDuplicate: false };
    }

    const eventId = this.generateId(eventName, payload);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const timeSinceLast = now - this.lastEvent.timestamp;

    if (this.lastEvent.id === eventId && timeSinceLast < this.thresholdMs) {
      const reason = `Same event within ${this.thresholdMs}ms (${timeSinceLast.toFixed(2)}ms ago)`;
      console.warn(`🔄 [OverlayDeduplicator] Duplicate ${eventName} ignored`, {
        eventId,
        timeSinceLastMs: timeSinceLast.toFixed(2),
        threshold: this.thresholdMs,
      });
      return { isDuplicate: true, reason };
    }

    this.lastEvent = { id: eventId, timestamp: now };
    return { isDuplicate: false };
  }

  /**
   * Reset deduplication state.
   */
  reset() {
    this.lastEvent = { id: null, timestamp: 0 };
  }

  /**
   * Return stats.
   */
  getStats() {
    return {
      enabled: this.enabled,
      thresholdMs: this.thresholdMs,
      lastEvent: { ...this.lastEvent },
    };
  }
}
