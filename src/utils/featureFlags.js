// src/utils/featureFlags.js
// ✅ Slim Feature Flags & DEV_LOG helper with zero dynamic store imports

// -----------------------------------------------------------------------------
// 1. ENV & DEV DETECTION
// -----------------------------------------------------------------------------
const ENV = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const isDev = Boolean(ENV.DEV);

// Query-string helper
function hasQueryFlag(flag) {
  if (typeof window === 'undefined') return false;
  return window.location.search.includes(`${flag}=true`);
}

function envFlag(envKey, queryKey, defaultVal = false) {
  const envVal = ENV[envKey];
  if (typeof envVal !== 'undefined') return envVal === 'true' || envVal === true;
  return hasQueryFlag(queryKey) || defaultVal;
}

// -----------------------------------------------------------------------------
// 2. RUNTIME FLAGS
// -----------------------------------------------------------------------------
const runtimeFlags = {
  atomicStores: envFlag('VITE_ATOMIC_STORE', 'atomic', isDev),
  concurrentFeatures: envFlag('VITE_CONCURRENT_FEATURES', 'concurrent', isDev),
  showcaseMode: envFlag('VITE_SHOWCASE', 'showcase', false),
  timeTravelDebug: envFlag('VITE_TIME_TRAVEL_DEBUG', 'timetravel', isDev),

  phase1Complete: false,
  phase2Complete: false,
  phase3Complete: false,
  phase4Complete: false,
};

// Exported to use everywhere instead of noisy if(isDev) console.log...
export const DEV_LOG =
  isDev && (typeof window !== 'undefined' ? (window.SST_DEV_LOG ?? true) : true);

// -----------------------------------------------------------------------------
// 3. PUBLIC API
// -----------------------------------------------------------------------------
export const featureFlags = {
  // Getters
  isAtomicStoreEnabled: () => runtimeFlags.atomicStores,
  isConcurrentFeaturesEnabled: () => runtimeFlags.concurrentFeatures,
  isShowcaseModeEnabled: () => runtimeFlags.showcaseMode,
  isTimeTravelDebugEnabled: () => runtimeFlags.timeTravelDebug,

  isPhase1Complete: () => runtimeFlags.phase1Complete,
  isPhase2Complete: () => runtimeFlags.phase2Complete,
  isPhase3Complete: () => runtimeFlags.phase3Complete,
  isPhase4Complete: () => runtimeFlags.phase4Complete,

  // Setters
  enableAtomicStores: () => setFlagAndLog('atomicStores', true, '⚛️ Atomic stores enabled'),
  disableAtomicStores: () => setFlagAndLog('atomicStores', false, '📦 Atomic stores disabled'),
  enableConcurrentFeatures: () =>
    setFlagAndLog('concurrentFeatures', true, '🔄 Concurrent features enabled'),
  disableConcurrentFeatures: () =>
    setFlagAndLog('concurrentFeatures', false, '⏸️ Concurrent features disabled'),
  enableShowcaseMode: () => setFlagAndLog('showcaseMode', true, '🎭 Showcase mode enabled'),
  disableShowcaseMode: () => setFlagAndLog('showcaseMode', false, '📺 Showcase mode disabled'),

  markPhase1Complete: () => markPhase(1),
  markPhase2Complete: () => markPhase(2),
  markPhase3Complete: () => markPhase(3),
  markPhase4Complete: () => markPhase(4),

  getStatus: () => ({
    ...runtimeFlags,
    environment: {
      MODE: ENV.MODE,
      VITE_ATOMIC_STORE: ENV.VITE_ATOMIC_STORE,
      VITE_CONCURRENT_FEATURES: ENV.VITE_CONCURRENT_FEATURES,
      VITE_SHOWCASE: ENV.VITE_SHOWCASE,
    },
    urlParams: typeof window !== 'undefined' ? window.location.search : 'N/A',
  }),

  validateFeatureCombination: () => {
    const warnings = [];
    if (runtimeFlags.showcaseMode && !runtimeFlags.atomicStores) {
      warnings.push('Showcase mode requires atomic stores for optimal performance.');
    }
    if (runtimeFlags.concurrentFeatures && !runtimeFlags.atomicStores) {
      warnings.push('Concurrent features are best with atomic stores.');
    }
    if (runtimeFlags.timeTravelDebug && ENV.MODE === 'production') {
      warnings.push('Time-travel debug should not be enabled in production.');
    }
    return { valid: warnings.length === 0, warnings };
  },
};

// Stub for anything expecting loadNarrativeStore
export async function loadNarrativeStore() {
  DEV_LOG && console.warn('🧪 loadNarrativeStore() stub: returns a no-op store.');
  return {
    getState: () => ({}),
    subscribe: () => () => {},
    setState: () => {},
  };
}

// Helpers
function setFlagAndLog(key, val, msg) {
  runtimeFlags[key] = val;
  DEV_LOG && console.log(msg);
  if (key === 'atomicStores') {
    console.log('🔁 Refresh if you expect store code paths to change.');
  }
}

function markPhase(n) {
  runtimeFlags[`phase${n}Complete`] = true;
  DEV_LOG && console.log(`✅ Phase ${n} Complete`);
}

// Initialization
function initializeFeatureFlagsOnce() {
  if (globalThis.__FF_INIT__) return;
  globalThis.__FF_INIT__ = true;

  if (DEV_LOG) {
    const status = featureFlags.getStatus();
    const validation = featureFlags.validateFeatureCombination();
    console.group('🚩 Feature Flags Initialized');
    console.log('DEV_LOG:', DEV_LOG);
    console.table(status);
    if (!validation.valid) console.warn('⚠️ Feature combination warnings:', validation.warnings);
    console.groupEnd();
  }

  if (typeof window !== 'undefined' && isDev) {
    window.featureFlags = featureFlags;
    window.toggleAtomic = () =>
      runtimeFlags.atomicStores
        ? featureFlags.disableAtomicStores()
        : featureFlags.enableAtomicStores();
    window.toggleShowcase = () =>
      runtimeFlags.showcaseMode
        ? featureFlags.disableShowcaseMode()
        : featureFlags.enableShowcaseMode();
  }
}

initializeFeatureFlagsOnce();

export default featureFlags;
