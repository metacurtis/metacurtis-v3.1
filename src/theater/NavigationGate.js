// src/theater/NavigationGate.js
// Central guard to prevent scroll-driven stage mapping from fighting programmatic navigation.

const NavigationGate = {
  _inFlight: false,
  _target: null,
  _startedAt: 0,
  _reason: '',
  _windowMs: 700,

  start(targetStage, reason = 'programmatic') {
    this._inFlight = true;
    this._target = targetStage || null;
    this._startedAt = typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();
    this._reason = reason;
    if (typeof window !== 'undefined') {
      window.__NAV_GATE = { inFlight: true, targetStage: this._target, reason };
      window.NavigationGate = this;
    }
  },

  end(reason = 'settled') {
    this._inFlight = false;
    this._target = null;
    this._reason = reason;
    if (typeof window !== 'undefined') {
      window.__NAV_GATE = { inFlight: false, reason };
      window.NavigationGate = this;
    }
  },

  isInFlight() {
    if (!this._inFlight) return false;
    const now = typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();
    if (now - this._startedAt > this._windowMs) {
      this.end('timeout');
      return false;
    }
    return true;
  },

  target() {
    return this._target;
  },

  reason() {
    return this._reason;
  },

  windowMs(ms) {
    if (Number.isFinite(ms) && ms >= 0) {
      this._windowMs = ms;
    }
  },
};

export default NavigationGate;

if (typeof window !== 'undefined' && !window.NavigationGate) {
  window.NavigationGate = NavigationGate;
}
