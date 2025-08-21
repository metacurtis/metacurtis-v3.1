// @doctor:4b-disposers
const __doctorDisposers = []; // src/utils/featureFlags.atomic.js
// ✅ FEATURE FLAGS: Atomic store migration with instant rollback capability
// Revolutionary Implementation Session 2 - Phase 1
/**
 * ✅ ATOMIC STORE FEATURE FLAGS
 * Allows safe rollback to monolithic stores if needed
 * Control via environment variables or runtime flags
 */

// ✅ ENVIRONMENT-BASED FLAGS
const ATOMIC_STORE_ENABLED =
process.env.VITE_ATOMIC_STORE === 'true' ||
process.env.NODE_ENV === 'development' ||
typeof window !== 'undefined' && window.location.search.includes('atomic=true');

const CONCURRENT_FEATURES_ENABLED =
process.env.VITE_CONCURRENT_FEATURES === 'true' ||
process.env.NODE_ENV === 'development' ||
typeof window !== 'undefined' && window.location.search.includes('concurrent=true');

const SHOWCASE_MODE_ENABLED =
process.env.VITE_SHOWCASE === 'true' ||
typeof window !== 'undefined' && window.location.search.includes('showcase=true');

const TIME_TRAVEL_DEBUG_ENABLED =
process.env.NODE_ENV === 'development' ||
typeof window !== 'undefined' && window.location.search.includes('timetravel=true');

// ✅ RUNTIME FLAGS: Can be toggled via console
const runtimeFlags = {
  atomicStores: ATOMIC_STORE_ENABLED,
  concurrentFeatures: CONCURRENT_FEATURES_ENABLED,
  showcaseMode: SHOWCASE_MODE_ENABLED,
  timeTravelDebug: TIME_TRAVEL_DEBUG_ENABLED,

  // Phase progression flags
  phase1Complete: false,
  phase2Complete: false,
  phase3Complete: false,
  phase4Complete: false
};

/**
 * ✅ FEATURE FLAG API
 */
export const featureFlags = {
  // Core flags
  isAtomicStoreEnabled: () => runtimeFlags.atomicStores,
  isConcurrentFeaturesEnabled: () => runtimeFlags.concurrentFeatures,
  isShowcaseModeEnabled: () => runtimeFlags.showcaseMode,
  isTimeTravelDebugEnabled: () => runtimeFlags.timeTravelDebug,

  // Phase progression
  isPhase1Complete: () => runtimeFlags.phase1Complete,
  isPhase2Complete: () => runtimeFlags.phase2Complete,
  isPhase3Complete: () => runtimeFlags.phase3Complete,
  isPhase4Complete: () => runtimeFlags.phase4Complete,

  // Runtime controls
  enableAtomicStores: () => {
    runtimeFlags.atomicStores = true;
    console.log('⚛️ Atomic stores enabled - refresh to take effect');
  },

  disableAtomicStores: () => {
    runtimeFlags.atomicStores = false;
    console.log('📦 Atomic stores disabled - refresh to revert to monolithic');
  },

  enableConcurrentFeatures: () => {
    runtimeFlags.concurrentFeatures = true;
    console.log('🔄 Concurrent features enabled');
  },

  disableConcurrentFeatures: () => {
    runtimeFlags.concurrentFeatures = false;
    console.log('⏸️ Concurrent features disabled');
  },

  enableShowcaseMode: () => {
    runtimeFlags.showcaseMode = true;
    console.log('🎭 Showcase mode enabled - 17K particles available');
  },

  disableShowcaseMode: () => {
    runtimeFlags.showcaseMode = false;
    console.log('📺 Showcase mode disabled - standard particle limits');
  },

  // Phase completion tracking
  markPhase1Complete: () => {
    runtimeFlags.phase1Complete = true;
    console.log('✅ Phase 1 Complete: Atomic State Refactor');
  },

  markPhase2Complete: () => {
    runtimeFlags.phase2Complete = true;
    console.log('✅ Phase 2 Complete: React 19 Concurrent Features');
  },

  markPhase3Complete: () => {
    runtimeFlags.phase3Complete = true;
    console.log('✅ Phase 3 Complete: 17K Particle Scaling');
  },

  markPhase4Complete: () => {
    runtimeFlags.phase4Complete = true;
    console.log('✅ Phase 4 Complete: Time-Travel Debugging');
  },

  // Status reporting
  getStatus: () => ({
    atomicStores: runtimeFlags.atomicStores,
    concurrentFeatures: runtimeFlags.concurrentFeatures,
    showcaseMode: runtimeFlags.showcaseMode,
    timeTravelDebug: runtimeFlags.timeTravelDebug,
    phases: {
      phase1: runtimeFlags.phase1Complete,
      phase2: runtimeFlags.phase2Complete,
      phase3: runtimeFlags.phase3Complete,
      phase4: runtimeFlags.phase4Complete
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VITE_ATOMIC_STORE: process.env.VITE_ATOMIC_STORE,
      VITE_CONCURRENT_FEATURES: process.env.VITE_CONCURRENT_FEATURES,
      VITE_SHOWCASE: process.env.VITE_SHOWCASE
    },
    urlParams: typeof window !== 'undefined' ? window.location.search : 'N/A'
  }),

  // Validation helpers
  validateFeatureCombination: () => {
    const warnings = [];

    if (runtimeFlags.showcaseMode && !runtimeFlags.atomicStores) {
      warnings.push('Showcase mode requires atomic stores for optimal performance');
    }

    if (runtimeFlags.concurrentFeatures && !runtimeFlags.atomicStores) {
      warnings.push('Concurrent features work best with atomic stores');
    }

    if (runtimeFlags.timeTravelDebug && process.env.NODE_ENV === 'production') {
      warnings.push('Time travel debug should not be enabled in production');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }
};

/**
 * ✅ STORE SELECTOR: Choose between atomic and monolithic stores
 */
export const getStoreImplementation = () => {
  if (featureFlags.isAtomicStoreEnabled()) {
    return 'atomic';
  }
  return 'monolithic';
};

/**
 * ✅ CONDITIONAL IMPORTS: Load appropriate store implementation
 */
export const loadNarrativeStore = async () => {
  const implementation = getStoreImplementation();

  if (implementation === 'atomic') {
    const { useNarrativeStore } = await import('@/stores/narrativeStore.atomic.js');
    console.log('⚛️ Loaded atomic narrative store implementation');
    return useNarrativeStore;
  } else {
    const { useNarrativeStore } = await import('@/stores/narrativeStore.js');
    console.log('📦 Loaded monolithic narrative store implementation');
    return useNarrativeStore;
  }
};

// ✅ INITIALIZATION: Setup flags and logging
const initializeFeatureFlags = () => {
  const status = featureFlags.getStatus();
  const validation = featureFlags.validateFeatureCombination();

  console.group('🚩 Feature Flags Initialized');
  console.log('Implementation:', getStoreImplementation());
  console.log('Atomic Stores:', status.atomicStores);
  console.log('Concurrent Features:', status.concurrentFeatures);
  console.log('Showcase Mode:', status.showcaseMode);
  console.log('Time Travel Debug:', status.timeTravelDebug);

  if (!validation.valid) {
    console.warn('⚠️ Feature combination warnings:', validation.warnings);
  }

  console.groupEnd();
};

// ✅ DEVELOPMENT: Global access and controls
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.featureFlags = featureFlags;

  // Quick toggle functions
  window.toggleAtomic = () => {
    if (featureFlags.isAtomicStoreEnabled()) {
      featureFlags.disableAtomicStores();
    } else {
      featureFlags.enableAtomicStores();
    }
  };

  window.toggleShowcase = () => {
    if (featureFlags.isShowcaseModeEnabled()) {
      featureFlags.disableShowcaseMode();
    } else {
      featureFlags.enableShowcaseMode();
    }
  };

  console.log('🚩 Feature flags available: window.featureFlags');
  console.log('🔄 Quick toggles: window.toggleAtomic(), window.toggleShowcase()');
}

// Auto-initialize
initializeFeatureFlags();

export default featureFlags; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}