/**
 * Diagnostic surface for NarrationOverlay.
 * Provides observability into state, events, errors, and metrics.
 */

export class OverlayDiagnostics {
  constructor() {
    this.instanceId = ++OverlayDiagnostics.instanceCounter;
    this.eventLog = [];
    this.errorLog = [];
    this.metrics = {
      totalDisplays: 0,
      totalCharactersTyped: 0,
      totalDuplicatesIgnored: 0,
      totalInvalidEvents: 0,
      totalStateTransitions: 0,
    };
  }

  recordEvent(eventName, payload, accepted = true) {
    const entry = {
      instanceId: this.instanceId,
      event: eventName,
      payload,
      accepted,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };

    this.eventLog.push(entry);
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }

    if (!accepted) {
      this.metrics.totalInvalidEvents += 1;
    }
  }

  recordError(type, details) {
    const entry = {
      instanceId: this.instanceId,
      type,
      details,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };

    this.errorLog.push(entry);
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }
  }

  recordDisplay(characterCount) {
    this.metrics.totalDisplays += 1;
    this.metrics.totalCharactersTyped += characterCount;
  }

  recordDuplicateIgnored() {
    this.metrics.totalDuplicatesIgnored += 1;
  }

  recordStateTransition() {
    this.metrics.totalStateTransitions += 1;
  }

  getReport() {
    return {
      instanceId: this.instanceId,
      recentEvents: this.eventLog.slice(-10),
      recentErrors: this.errorLog.slice(-10),
      metrics: { ...this.metrics },
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };
  }

  clear() {
    this.eventLog = [];
    this.errorLog = [];
    this.metrics = {
      totalDisplays: 0,
      totalCharactersTyped: 0,
      totalDuplicatesIgnored: 0,
      totalInvalidEvents: 0,
      totalStateTransitions: 0,
    };
  }
}

OverlayDiagnostics.instanceCounter = 0;
