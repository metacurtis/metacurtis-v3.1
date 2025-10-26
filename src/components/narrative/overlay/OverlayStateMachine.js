/**
 * Explicit state machine for NarrationOverlay
 * Prevents invalid transitions and provides clear state semantics.
 */

export const STATES = {
  IDLE: 'idle',
  STARTING: 'starting',
  TYPING: 'typing',
  COMPLETE: 'complete',
  GRACE_PERIOD: 'grace',
  HIDING: 'hiding',
};

// Valid state transitions (more permissive for React lifecycle)
const STATE_TRANSITIONS = {
  [STATES.IDLE]: [
    STATES.STARTING,
    STATES.TYPING, // Direct typing if text arrives immediately
    STATES.GRACE_PERIOD, // Grace period if stopped before started
    STATES.HIDING, // Direct hiding during cleanup
    STATES.IDLE, // Allow idle → idle for reset operations
  ],
  [STATES.STARTING]: [
    STATES.TYPING,
    STATES.IDLE,
    STATES.GRACE_PERIOD, // Can stop before typing starts
    STATES.HIDING, // Can hide if cancelled immediately
  ],
  [STATES.TYPING]: [
    STATES.COMPLETE,
    STATES.IDLE, // Can reset during typing
    STATES.TYPING, // New text arrives (restart typing)
    STATES.GRACE_PERIOD, // Can stop mid-typing
    STATES.HIDING, // Can hide mid-typing (unmount)
  ],
  [STATES.COMPLETE]: [
    STATES.GRACE_PERIOD,
    STATES.TYPING, // New text immediately after complete
    STATES.IDLE, // Direct reset
    STATES.HIDING, // Direct hiding
  ],
  [STATES.GRACE_PERIOD]: [
    STATES.HIDING,
    STATES.TYPING, // New text during grace period
    STATES.IDLE, // Reset during grace
    STATES.STARTING, // Restart during grace
  ],
  [STATES.HIDING]: [
    STATES.IDLE,
    STATES.STARTING, // New text can arrive during fade-out
  ],
};

export class OverlayStateMachine {
  constructor(initialState = STATES.IDLE) {
    this.currentState = initialState;
    this.history = [];
    this.listeners = new Set();
  }

  /**
   * Get the current state.
   */
  getState() {
    return this.currentState;
  }

  /**
   * Does a transition from the current state to the new state exist?
   */
  canTransitionTo(newState) {
    const allowedStates = STATE_TRANSITIONS[this.currentState] || [];
    return allowedStates.includes(newState);
  }

  /**
   * Attempt to transition to a new state.
   * @returns {boolean} true if the transition succeeded.
   */
  transitionTo(newState, context = {}) {
    if (!this.canTransitionTo(newState)) {
      console.warn(`❌ [OverlayStateMachine] Invalid transition: ${this.currentState} → ${newState}`, context);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;

    const transition = {
      from: oldState,
      to: newState,
      context,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };

    this.history.push(transition);
    if (this.history.length > 100) {
      this.history.shift();
    }

    console.log(`✅ [OverlayStateMachine] ${oldState} → ${newState}`, context);

    this.listeners.forEach((listener) => {
      try {
        listener(transition);
      } catch (error) {
        console.error('[OverlayStateMachine] Listener error:', error);
      }
    });

    return true;
  }

  /**
   * Force state (used for initialization/reset).
   */
  forceState(newState, reason = 'force') {
    console.log(`⚡ [OverlayStateMachine] Force: ${this.currentState} → ${newState}`, { reason });
    this.currentState = newState;
  }

  /**
   * Subscribe to state transitions.
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Return the most recent transitions.
   */
  getHistory(count = 10) {
    return this.history.slice(-count);
  }

  /**
   * Reset state machine to IDLE and clear history.
   */
  reset() {
    this.forceState(STATES.IDLE, 'reset');
    this.history = [];
  }
}
