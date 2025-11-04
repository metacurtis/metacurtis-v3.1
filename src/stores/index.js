// src/stores/index.js
// ✅ DYNAMIC STORE LOADER: Feature flag-driven implementation selection
// Revolutionary Implementation Session 2 - Phase 1

import { featureFlags, getStoreImplementation } from '@/utils/featureFlags.atomic.js';

/**
 * ✅ IMPLEMENTATION SELECTOR
 * Dynamically loads atomic or monolithic store based on feature flags
 * Allows instant rollback capability
 */

// Cache loaded implementations to prevent multiple imports
let cachedAtomicStore = null;
let cachedMonolithicStore = null;
let cachedAtomicIntegration = null;

/**
 * ✅ LOAD NARRATIVE STORE: Dynamic implementation loading
 */
export const loadNarrativeStore = async () => {
  const implementation = getStoreImplementation();
  
  if (implementation === 'atomic') {
    if (!cachedAtomicStore) {
      // Load atomic implementation
      const atomicModule = await import('./narrativeStore.atomic.js');
      cachedAtomicStore = atomicModule.useNarrativeStore;
      
      // Load and integrate atomic clock integration
      if (!cachedAtomicIntegration) {
        const integrationModule = await import('@/core/CentralEventClock.atomic.js');
        cachedAtomicIntegration = integrationModule.default;
      }
      
      console.log('⚛️ Loaded atomic narrative store with Central Clock integration');
    }
    return cachedAtomicStore;
  } else {
    if (!cachedMonolithicStore) {
      // Load monolithic implementation
      const monolithicModule = await import('./narrativeStore.js');
      cachedMonolithicStore = monolithicModule.useNarrativeStore;
      
      console.log('📦 Loaded monolithic narrative store');
    }
    return cachedMonolithicStore;
  }
};

/**
 * ✅ SYNCHRONOUS STORE ACCESS: For components that need immediate access
 * Note: This requires the store to already be loaded
 */
export const getNarrativeStore = () => {
  const implementation = getStoreImplementation();
  
  if (implementation === 'atomic') {
    if (!cachedAtomicStore) {
      throw new Error('Atomic store not loaded yet. Use loadNarrativeStore() first.');
    }
    return cachedAtomicStore;
  } else {
    if (!cachedMonolithicStore) {
      throw new Error('Monolithic store not loaded yet. Use loadNarrativeStore() first.');
    }
    return cachedMonolithicStore;
  }
};

/**
 * ✅ REACT HOOK: Async store loader with suspense support
 */
export const useAsyncNarrativeStore = () => {
  const [store, setStore] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    loadNarrativeStore()
      .then((storeImpl) => {
        setStore(() => storeImpl);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);
  
  return { store, loading, error };
};

/**
 * ✅ INITIALIZATION HELPER: Preload store implementation
 */
export const initializeStores = async () => {
  try {
    const startTime = performance.now();
    
    // Load the appropriate implementation
    await loadNarrativeStore();
    
    // If atomic stores are enabled, also initialize atomic integration
    if (featureFlags.isAtomicStoreEnabled()) {
      // Import and initialize atomic stores
      const { clockAtom } = await import('./atoms/clockAtom.js');
      const { stageAtom } = await import('./atoms/stageAtom.js');
      const { qualityAtom } = await import('./atoms/qualityAtom.js');
      
      // Initialize device-aware quality settings
      if (typeof window !== 'undefined') {
        try {
          const DeviceCapabilities = await import('@/utils/performance/DeviceCapabilities.js');
          const deviceInfo = DeviceCapabilities.default.getInfo();
          qualityAtom.getState().initializeForDevice(deviceInfo);
          
          console.log('⚛️ Atomic stores initialized with device capabilities');
        } catch (err) {
          console.warn('⚠️ Could not initialize device capabilities:', err);
        }
      }
      
      // Mark Phase 1 as complete
      featureFlags.markPhase1Complete();
    }
    
    const loadTime = performance.now() - startTime;
    console.log(`🚀 Store initialization complete in ${loadTime.toFixed(2)}ms`);
    
    return true;
  } catch (error) {
    console.error('❌ Store initialization failed:', error);
    throw error;
  }
};

/**
 * ✅ HOT RELOAD SUPPORT: Development-only store switching
 */
export const switchStoreImplementation = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Store switching only available in development');
    return;
  }
  
  // Clear caches
  cachedAtomicStore = null;
  cachedMonolithicStore = null;
  cachedAtomicIntegration = null;
  
  // Toggle feature flag
  if (featureFlags.isAtomicStoreEnabled()) {
    featureFlags.disableAtomicStores();
  } else {
    featureFlags.enableAtomicStores();
  }
  
  // Reinitialize
  await initializeStores();
  
  // Suggest page refresh for full effect
  console.log('🔄 Store implementation switched. Refresh page for complete effect.');
};

/**
 * ✅ VALIDATION: Ensure store integrity
 */
export const validateStoreIntegrity = async () => {
  const implementation = getStoreImplementation();
  const validation = { valid: true, issues: [] };
  
  try {
    const store = await loadNarrativeStore();
    
    // Basic store validation
    if (typeof store !== 'function') {
      validation.valid = false;
      validation.issues.push('Store is not a valid React hook function');
    }
    
    // Implementation-specific validation
    if (implementation === 'atomic') {
      // Check atomic stores are available
      try {
        const { clockAtom } = await import('./atoms/clockAtom.js');
        const { stageAtom } = await import('./atoms/stageAtom.js');
        const { qualityAtom } = await import('./atoms/qualityAtom.js');
        
        // Basic state checks
        const clockState = clockAtom.getState();
        const stageState = stageAtom.getState();
        const qualityState = qualityAtom.getState();
        
        if (!clockState || !stageState || !qualityState) {
          validation.valid = false;
          validation.issues.push('Atomic stores not properly initialized');
        }
        
      } catch (err) {
        validation.valid = false;
        validation.issues.push(`Atomic store import failed: ${err.message}`);
      }
    }
    
    console.log(`✅ Store validation (${implementation}):`, validation);
    
  } catch (error) {
    validation.valid = false;
    validation.issues.push(`Store loading failed: ${error.message}`);
  }
  
  return validation;
};

// ✅ DEVELOPMENT: Global access and utilities
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.storeLoader = {
    loadNarrativeStore,
    initializeStores,
    switchStoreImplementation,
    validateStoreIntegrity,
    getImplementation: getStoreImplementation,
    getStatus: () => ({
      implementation: getStoreImplementation(),
      atomicCached: !!cachedAtomicStore,
      monolithicCached: !!cachedMonolithicStore,
      integrationCached: !!cachedAtomicIntegration,
    }),
  };
  
  // Quick commands
  window.switchStores = switchStoreImplementation;
  window.validateStores = validateStoreIntegrity;
  
  console.log('🔧 Store loader available: window.storeLoader');
  console.log('🔄 Quick switch: window.switchStores()');
  console.log('✅ Quick validate: window.validateStores()');
}

// Default export for convenience
export default {
  loadNarrativeStore,
  initializeStores,
  validateStoreIntegrity,
  getStoreImplementation,
};