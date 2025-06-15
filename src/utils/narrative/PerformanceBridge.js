// src/utils/stores/narrativePerformanceBridge.js
// REACTIVE BRIDGE - One-way sync narrativeStore → performanceStore
// Maintains separation while enabling performance system narrative awareness

import { useNarrativeStore } from '@/stores/narrativeStore';
import usePerformanceStore from '@/stores/performanceStore';
import { mapStageToNumeric, getStageParticleConfig } from '@/utils/narrative/stageMappingUtils';

let bridgeActive = false;
let unsubscribe = null;

/**
 * Creates one-way reactive bridge from narrativeStore → performanceStore
 * This allows performance system to react to narrative changes while keeping stores separate
 */
export const subscribeBridge = () => {
  if (bridgeActive) {
    console.warn('[NarrativePerformanceBridge] Bridge already active');
    return unsubscribe;
  }

  console.log('🌉 [NarrativePerformanceBridge] Initializing reactive bridge');

  // Subscribe to narrative state changes
  unsubscribe = useNarrativeStore.subscribe(
    // Selector: Watch for narrative state changes
    state => ({
      currentStage: state.currentStage,
      currentMood: state.currentMood,
      scrollProgress: state.scrollProgress,
      isTransitioning: state.isTransitioning,
      transitionProgress: state.transitionProgress,
      currentDisplayPreset: state.currentDisplayPreset,
    }),

    // Callback: Update performance store when narrative changes
    (narrativeState, previousState) => {
      try {
        // Get numeric stage for performance system
        const numericStage = mapStageToNumeric(narrativeState.currentStage);
        const stageConfig = getStageParticleConfig(
          narrativeState.currentStage,
          narrativeState.scrollProgress
        );

        // Update performance store with narrative data
        const performanceState = usePerformanceStore.getState();

        // Only update if values actually changed (prevent unnecessary renders)
        const shouldUpdate =
          !previousState ||
          previousState.currentStage !== narrativeState.currentStage ||
          Math.abs(previousState.scrollProgress - narrativeState.scrollProgress) > 0.001 ||
          previousState.isTransitioning !== narrativeState.isTransitioning;

        if (shouldUpdate) {
          // Update performance store narrative section
          performanceState.updateNarrativeState?.({
            currentStage: numericStage,
            stageName: narrativeState.currentStage,
            progress: narrativeState.scrollProgress,
            stageProgress: stageConfig.stageProgress,
            isTransitioning: narrativeState.isTransitioning,
            transitionProgress: narrativeState.transitionProgress,
            targetParticleCount: stageConfig.particles,
            stageMood: stageConfig.mood,
            stageColors: stageConfig.colors,
            stageDescription: stageConfig.description,
          });

          // Log bridge activity in development
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `🌉 Bridge sync: ${narrativeState.currentStage} → Stage ${numericStage}`,
              `(${stageConfig.particles} particles, ${Math.round(narrativeState.scrollProgress * 100)}% scroll)`
            );
          }
        }
      } catch (error) {
        console.error('[NarrativePerformanceBridge] Bridge sync error:', error);
      }
    },

    // Options: Immediate execution + equality check
    {
      equalityFn: (a, b) =>
        a.currentStage === b.currentStage &&
        Math.abs(a.scrollProgress - b.scrollProgress) < 0.001 &&
        a.isTransitioning === b.isTransitioning,
      fireImmediately: true,
    }
  );

  bridgeActive = true;

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    bridgeActive = false;
    console.log('🌉 [NarrativePerformanceBridge] Bridge disconnected');
  };
};

/**
 * Manually trigger bridge sync (for testing/debug)
 */
export const forceBridgeSync = () => {
  if (!bridgeActive) {
    console.warn('[NarrativePerformanceBridge] Bridge not active, cannot force sync');
    return;
  }

  const narrativeState = useNarrativeStore.getState();
  const numericStage = mapStageToNumeric(narrativeState.currentStage);
  const stageConfig = getStageParticleConfig(
    narrativeState.currentStage,
    narrativeState.scrollProgress
  );

  console.log('🔄 [NarrativePerformanceBridge] Force sync:', {
    stage: `${narrativeState.currentStage} → ${numericStage}`,
    progress: `${Math.round(narrativeState.scrollProgress * 100)}%`,
    particles: stageConfig.particles,
    mood: stageConfig.mood,
  });

  // Update performance store
  const performanceState = usePerformanceStore.getState();
  performanceState.updateNarrativeState?.({
    currentStage: numericStage,
    stageName: narrativeState.currentStage,
    progress: narrativeState.scrollProgress,
    stageProgress: stageConfig.stageProgress,
    isTransitioning: narrativeState.isTransitioning,
    transitionProgress: narrativeState.transitionProgress,
    targetParticleCount: stageConfig.particles,
    stageMood: stageConfig.mood,
    stageColors: stageConfig.colors,
    stageDescription: stageConfig.description,
  });
};

/**
 * Get bridge status for debugging
 */
export const getBridgeStatus = () => {
  const narrativeState = useNarrativeStore.getState();
  const performanceState = usePerformanceStore.getState();

  return {
    bridgeActive,
    narrativeStage: narrativeState.currentStage,
    numericStage: mapStageToNumeric(narrativeState.currentStage),
    scrollProgress: narrativeState.scrollProgress,
    performanceNarrative: performanceState.narrative || 'No narrative data',
    lastUpdate: new Date().toISOString(),
  };
};

/**
 * Initialize bridge with error handling
 * Call this once during app startup
 */
export const initializeBridge = () => {
  try {
    const cleanup = subscribeBridge();

    // Verify performance store has updateNarrativeState method
    const performanceState = usePerformanceStore.getState();
    if (!performanceState.updateNarrativeState) {
      console.warn(
        '[NarrativePerformanceBridge] Performance store missing updateNarrativeState method'
      );
      console.log('Available performance store methods:', Object.keys(performanceState));
    }

    // Force initial sync
    forceBridgeSync();

    console.log('✅ [NarrativePerformanceBridge] Bridge initialized successfully');

    return cleanup;
  } catch (error) {
    console.error('[NarrativePerformanceBridge] Bridge initialization failed:', error);
    return null;
  }
};

// Export for convenience
export default {
  subscribeBridge,
  forceBridgeSync,
  getBridgeStatus,
  initializeBridge,
};
