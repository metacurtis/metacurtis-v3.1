/**
 * Canon Suite Initialization
 * Integrates Guard + Console with BeatBus
 */
import CanonGuardL2 from '../canon-guard/L2.js';
import CanonConsoleL2 from '../canon-console/L2.js';


// @doctor:phase4b-hmr-dbdff18d - Component listener cleanup
// @doctor:4b-disposers
const __doctorDisposers = [];const __componentDisposers = [];
// Store original methods if component uses them directly
const __captureUnsub = (unsub) => {
  if (typeof unsub === 'function') {
    __componentDisposers.push(unsub);
  }
  return unsub;
};
export function initCanon() {
  if (window.__CANON_INITIALIZED) return;
  window.__CANON_INITIALIZED = Date.now();

  console.log('🚀 Canon Suite: Initializing...');

  // Initialize components
  const guard = new CanonGuardL2();
  const consoleTool = new CanonConsoleL2();

  // Get BeatBus if available
  const BeatBus = window.BeatBus;

  if (BeatBus) {
    // Add debug method if missing
    if (!BeatBus.getDebugInfo) {
      BeatBus.getDebugInfo = function () {
        const listeners = {};
        if (this.listeners) {
          this.listeners.forEach((set, key) => {
            listeners[key] = set.size;
          });
        }
        return {
          listeners,
          eventLog: this.eventLog || [],
          lastEmit: this.lastEmit || null
        };
      };
    }

    // Add event logging
    if (!BeatBus.__canonPatched) {
      const originalEmit = BeatBus.emit.bind(BeatBus);
      BeatBus.emit = function (event, data) {
        // Log event
        this.lastEmit = { event, data, timestamp: Date.now() };
        if (!this.eventLog) this.eventLog = [];
        this.eventLog.push(this.lastEmit);
        if (this.eventLog.length > 100) this.eventLog.shift();

        // Validate
        guard.validate(event, data);

        // Call original
        return originalEmit(event, data);
      };
      BeatBus.__canonPatched = true;
    }

    // Auto-protect events
    guard.autoProtect(BeatBus);

    // Add global tap helper
    if (!window.busTap) {"@doctor:4b-todo-capture: capture unsubscribe for on()"; // @doctor:4b-capture
      const __doctor_unsub_1 = window.busTap = (event, fn) => BeatBus.on(event, fn);__doctorDisposers.push(__doctor_unsub_1);
    }

    console.log('✅ Canon Suite: BeatBus integration complete');
  } else {
    console.warn('⚠️ Canon Suite: BeatBus not found, running standalone');
  }

  // Expose Canon API
  window.canon = {
    guard,
    console: consoleTool,

    // Quick access methods
    validate: (type, data) => guard.validate(type, data),
    violations: () => guard.getViolations(),
    patterns: () => guard.getPatterns(),
    analyze: () => ({
      guard: guard.analyze(),
      console: consoleTool.analyze()
    }),

    // Console control
    setVerbosity: (level) => consoleTool.setVerbosity(level),
    setContext: (ctx) => consoleTool.setContext(ctx),

    // Status
    status: () => ({
      initialized: window.__CANON_INITIALIZED,
      guard: {
        active: true,
        stats: guard.getStats()
      },
      console: {
        active: true,
        stats: consoleTool.getStats()
      },
      beatbus: BeatBus ? BeatBus.getDebugInfo() : null
    })
  };

  // Set flags
  window.__CANON_GUARD_ACTIVE = true;
  window.__CANON_CONSOLE_ACTIVE = true;

  // Show status
  console.log('✅ Canon Suite L1/L2: FULLY ACTIVE');
  console.log('📊 Status:', window.canon.status());
  console.log('🎮 Commands:');
  console.log('  canon.status()         - System status');
  console.log('  canon.violations()     - Contract violations');
  console.log('  canon.analyze()        - Full analysis');
  console.log('  canon.setContext(ctx)  - Filter by context');
  console.log('  canon.setVerbosity(v)  - Set log level');

  return { guard, console: consoleTool };
}

// Auto-initialize in DEV
if (import.meta.env.DEV) {
  initCanon();import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});
}

export default initCanon;


// @doctor:phase4b-hmr-dbdff18d - HMR dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    __componentDisposers.forEach((d) => {
      try {d();} catch (e) {console.warn('Dispose error:', e);}
    });
    __componentDisposers.length = 0;"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});
  });
}

/* TODO: Wrap listener calls with __captureUnsub:
   const unsub = __captureUnsub(bus.on('EVENT', handler));
   Lines with uncaptured listeners: 63
*/