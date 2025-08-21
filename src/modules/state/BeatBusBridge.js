// src/modules/state/BeatBusBridge.js
/**
 * BeatBusBridge — StormShield edition (HMR-safe)
 * - Idempotent initialize()
 * - pause()/resume()
 * - throttled handlers to avoid re-render storms
 * - storm detector auto-pauses if rate too high
 */

import StateCore from './StateCore'; // @doctor:4b-disposers
const __doctorDisposers = [];let BeatBus;

// @doctor:phase4b-hmr-dbdff18d - Bridge HMR cleanup
const __hmrDisposers = [];

// Original dispose method if exists
const originalDispose = typeof this?.dispose === 'function' ? this.dispose.bind(this) : null;

// Enhanced dispose that cleans up all listeners
this.dispose = () => {
  // Call original dispose if it existed
  if (originalDispose) originalDispose();

  // Clean up tracked listeners
  __hmrDisposers.forEach((disposer) => {
    if (typeof disposer === 'function') {
      try {disposer();} catch (e) {console.warn('Dispose error:', e);}
    }
  });
  __hmrDisposers.length = 0;
};

// Wrap listener registration to capture unsubs
const __wrapListener = (target, method, originalMethod) => {
  return function (...args) {
    const result = originalMethod.apply(this, args);
    if (typeof result === 'function') {
      __hmrDisposers.push(result);
    }
    return result;
  };
};

// Apply wrapper if BeatBus is available
if (typeof BeatBus !== 'undefined' && BeatBus) {
  const originalOn = BeatBus.on;
  const originalOnce = BeatBus.once;
  if (originalOn) BeatBus.on = __wrapListener(BeatBus, 'on', originalOn);
  if (originalOnce) BeatBus.once = __wrapListener(BeatBus, 'once', originalOnce);
}
try {
  const mod = await import('@/modules/orchestration/core/BeatBus');
  BeatBus = mod.default || mod.BeatBus || mod;
} catch {
  BeatBus = window.BeatBus;
}

function throttle(fn, ms = 16) {
  let t = 0,
    lastArgs,
    pending = false;
  return (...args) => {
    lastArgs = args;
    const now = performance.now();
    if (now - t >= ms) {
      t = now;
      return fn(...lastArgs);
    }
    if (!pending) {
      pending = true;
      setTimeout(() => {
        pending = false;
        t = performance.now();
        fn(...lastArgs);
      }, ms);
    }
  };
}

class _BeatBusBridge {
  constructor() {
    this.eventMappings = new Map();
    this.subs = new Map();
    this.initialized = false;
    this.paused = false;
    this.eventCount = 0;
    this._stormWindow = [];
    if (import.meta.env.DEV) {this._devExpose();import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});}
  }

  initialize() {
    if (this.initialized) return;
    if (!BeatBus) {
      console.warn('[Bridge] BeatBus not ready');
      return;
    }
    if (!StateCore.initialized) StateCore.initialize();

    this._setupCoreMappings();
    this._connect();
    this._watchStorms();
    this._wireReverseFlow();

    this.initialized = true;
    console.log('✅ BeatBusBridge initialized (mappings:', this.eventMappings.size, ')');
  }

  pause() {
    this.paused = true;
    console.warn('⏸️ Bridge paused');
  }
  resume() {
    this.paused = false;
    console.warn('▶️ Bridge resumed');
  }

  _setupCoreMappings() {
    // STAGE_CHANGE -> narrative/stage
    this.map(
      'STAGE_CHANGE',
      throttle((d) => {
        if (!d) return;
        StateCore.set('narrative', (s) => ({
          ...s,
          currentStage: d.stage || d.to,
          isTransitioning: false,
          stageStartTime: Date.now()
        }));
        if (StateCore.atoms.stage) {
          const index = [
          'genesis',
          'discipline',
          'neural',
          'velocity',
          'architecture',
          'harmony',
          'transcendence'].
          indexOf(d.stage || d.to);
          StateCore.set('stage', (s) => ({ ...s, current: d.stage || d.to, index }));
        }
      }, 16)
    );

    // QUALITY_CHANGE -> quality
    this.map(
      'QUALITY_CHANGE',
      throttle((d) => {
        if (!d) return;
        const tier = d.tier || d.quality;
        StateCore.set('quality', (s) => ({
          ...s,
          currentTier: tier,
          dpr: d.dpr ?? s.dpr,
          particleMultiplier: d.multiplier ?? s.particleMultiplier
        }));
      }, 16)
    );

    // PERFORMANCE_UPDATE -> performance
    this.map(
      'PERFORMANCE_UPDATE',
      throttle((d) => {
        if (!d) return;
        StateCore.set('performance', (s) => ({
          ...s,
          fps: d.fps ?? s.fps,
          frameTime: d.frameTime ?? s.frameTime,
          particleCount: d.particleCount ?? s.particleCount
        }));
      }, 16)
    );

    // FRAME_TICK -> clock
    this.map(
      'FRAME_TICK',
      throttle((d) => {
        if (!d || !StateCore.atoms.clock) return;
        const cur = StateCore.get('clock') || {};
        StateCore.atoms.clock.setState({
          ...cur,
          fps: d.fps ?? cur.fps,
          deltaMs: d.deltaMs ?? cur.deltaMs,
          averageFrameTime: d.averageFrameTime ?? cur.averageFrameTime
        });
      }, 32)
    );
  }

  _connect() {
    for (const [evt, handler] of this.eventMappings) {
      const fn = (data) => {
        if (this.paused) return;
        try {
          handler(data);
          this._tick();
          if (import.meta.env.DEV) {console.debug('🌉 BeatBus → StateCore', evt, data);import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});}
        } catch (e) {
          console.error('Bridge handler error', evt, e);
        }
      }; // @doctor:4b-capture
      const __doctor_unsub_1 = BeatBus.on(evt, fn);__doctorDisposers.push(__doctor_unsub_1);
      this.subs.set(evt, fn);
    }
  }

  _wireReverseFlow() {
    // narrative -> STATE_STAGE_UPDATED
    this._unN = StateCore.subscribe('narrative', (s) => {
      if (!s?.currentStage || this.paused) return;
      BeatBus.emit?.('STATE_STAGE_UPDATED', {
        stage: s.currentStage,
        progress: s.globalProgress,
        source: 'state-core'
      });
    });
    // quality -> STATE_QUALITY_UPDATED
    this._unQ = StateCore.subscribe('quality', (s) => {
      if (!s?.currentTier || this.paused) return;
      BeatBus.emit?.('STATE_QUALITY_UPDATED', {
        tier: s.currentTier,
        dpr: s.dpr,
        source: 'state-core'
      });
    });
  }

  map(evt, handler) {
    this.eventMappings.set(evt, handler);
  }

  emit(evt, data) {
    BeatBus.emit?.(evt, { ...data, source: 'state-core', t: Date.now() });
  }

  _tick() {
    const now = Date.now();
    this._stormWindow.push(now);
    // keep 2s window
    while (this._stormWindow.length && now - this._stormWindow[0] > 2000) this._stormWindow.shift();
    this.eventCount++;
  }

  _watchStorms() {
    this._stormTimer = setInterval(() => {
      const rate = this._stormWindow.length / 2; // events/sec over last 2s
      if (rate > 200) {
        console.warn(
          '🌪️ Event storm detected (~',
          Math.round(rate),
          '/sec ). Auto-pausing bridge. window.BeatBusBridge.resume() to continue.'
        );
        this.pause();
      }
    }, 500);
  }

  dispose() {
    if (!BeatBus) return;
    for (const [evt, fn] of this.subs) BeatBus.off?.(evt, fn);
    this.subs.clear();
    if (this._unN) this._unN();
    if (this._unQ) this._unQ();
    clearInterval(this._stormTimer);
    this.initialized = false;
    console.log('🧹 Bridge disposed');
  }

  _devExpose() {
    if (typeof window === 'undefined') return;
    window.BeatBusBridge = this;
    window.BB = {
      pause: () => this.pause(),
      resume: () => this.resume(),
      mappings: () => [...this.eventMappings.keys()],
      status: () => ({
        initialized: this.initialized,
        paused: this.paused,
        eventCount: this.eventCount
      })
    };
  }
}

const bridge = globalThis.__BEATBUS_BRIDGE__ || new _BeatBusBridge();
globalThis.__BEATBUS_BRIDGE__ = bridge;

// Auto init once DOM is ready
if (typeof window !== 'undefined') {
  const start = () => bridge.initialize();
  if (!bridge.initialized)
  document.readyState === 'loading' ?
  document.addEventListener('DOMContentLoaded', () => setTimeout(start, 50)) :
  setTimeout(start, 50);
}

// HMR safety
if (import.meta.hot) {
  import.meta.hot.accept?.();
  import.meta.hot.dispose?.(() => bridge.dispose());import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});
}

export default bridge;