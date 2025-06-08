// src/stores/narrativeStore.js
// ENHANCED NARRATIVE STATE MANAGEMENT - Critical optimizations added
// Added: Real-time scroll binding, computed metadata, fractal unlockable systems

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Stage definitions with feature gates
const NARRATIVE_STAGES = {
  0: { name: 'genesis', title: 'Genesis', description: 'Terminal boot', scrollRange: [0, 0] },
  1: { name: 'awakening', title: 'Awakening', description: 'Chaos → order', scrollRange: [0, 20] },
  2: {
    name: 'structure',
    title: 'Structure',
    description: 'Grid formation',
    scrollRange: [20, 40],
  },
  3: { name: 'learning', title: 'Learning', description: 'Neural patterns', scrollRange: [40, 60] },
  4: {
    name: 'building',
    title: 'Building',
    description: 'System construction',
    scrollRange: [60, 80],
  },
  5: {
    name: 'mastery',
    title: 'Mastery',
    description: 'Fractal consciousness',
    scrollRange: [80, 100],
  },
};

// ⚡ C. FRACTAL UNLOCKABLE SYSTEMS - Feature gating by stage
const STAGE_FEATURE_GATES = {
  terminalBoot: 0, // Genesis: Terminal animation
  scrollHints: 0, // Genesis: Basic UI hints
  particleInteraction: 1, // Awakening: Cursor repulsion
  memoryFragments: 2, // Structure: Interactive fragments
  metacurtisEmergence: 3, // Learning: AI silhouette appears
  metacurtisDialogue: 4, // Building: AI voice interaction
  visualOverrides: 4, // Building: Advanced visual effects
  fullAIInteraction: 5, // Mastery: Complete AI personality
  performanceDemo: 5, // Mastery: Live metrics display
  contactPortal: 5, // Mastery: Advanced contact system
};

export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    // Core state
    currentStage: 0,
    stageProgress: 0.0, // 0.0 to 1.0 within current stage
    globalProgress: 0.0, // 0.0 to 1.0 across entire journey
    transitionActive: false,
    enableNarrativeMode: true,

    // Story content
    stageData: NARRATIVE_STAGES,
    activeMemoryFragment: null,
    memoryFragmentsUnlocked: false, // Unlocks at stage 2+

    // AI personality
    metacurtisActive: false,
    metacurtisVoiceLevel: 0, // 0=silent, 1=whisper, 2=clear, 3=full

    // User interaction
    userEngagement: {
      hasScrolled: false,
      hasInteracted: false,
      timeOnPage: 0,
      fragmentsExplored: [],
      scrollVelocity: 0,
    },

    // ⚡ A. ENHANCED SCROLL BINDING - Performance optimized
    scrollState: {
      lastScrollTime: 0,
      scrollVelocity: 0,
      isScrolling: false,
      throttleMs: 16, // 60fps throttling
    },

    // Actions
    setStage: stage => {
      const clampedStage = Math.max(0, Math.min(5, stage));
      set(state => ({
        currentStage: clampedStage,
        memoryFragmentsUnlocked: clampedStage >= 2,
        metacurtisActive: clampedStage >= 3,
        metacurtisVoiceLevel: Math.max(0, clampedStage - 2),
      }));
    },

    // ⚡ A. ENHANCED setGlobalProgress with scroll optimization
    setGlobalProgress: progress => {
      const now = performance.now();
      const state = get();

      // Throttle updates for performance
      if (now - state.scrollState.lastScrollTime < state.scrollState.throttleMs) {
        return; // Skip this update
      }

      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Calculate scroll velocity
      const progressDelta = Math.abs(clampedProgress - state.globalProgress);
      const timeDelta = now - state.scrollState.lastScrollTime;
      const scrollVelocity = timeDelta > 0 ? progressDelta / timeDelta : 0;

      // Calculate which stage we should be in
      const stageIndex = Math.floor(clampedProgress * 6);
      const stageStart = stageIndex / 6;
      const stageEnd = (stageIndex + 1) / 6;
      const stageProgress =
        stageEnd > stageStart ? (clampedProgress - stageStart) / (stageEnd - stageStart) : 0;

      set({
        globalProgress: clampedProgress,
        currentStage: Math.min(5, stageIndex),
        stageProgress: Math.max(0, Math.min(1, stageProgress)),
        memoryFragmentsUnlocked: stageIndex >= 2,
        metacurtisActive: stageIndex >= 3,
        metacurtisVoiceLevel: Math.max(0, stageIndex - 2),
        scrollState: {
          ...state.scrollState,
          lastScrollTime: now,
          scrollVelocity,
          isScrolling: true,
        },
        userEngagement: {
          ...state.userEngagement,
          hasScrolled: clampedProgress > 0.01,
          scrollVelocity,
        },
      });

      // Clear scrolling flag after delay
      setTimeout(() => {
        set(state => ({
          scrollState: { ...state.scrollState, isScrolling: false },
        }));
      }, 150);
    },

    setStageProgress: progress => {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      set({ stageProgress: clampedProgress });
    },

    triggerTransition: targetStage => {
      set({ transitionActive: true });

      // Simulate transition delay
      setTimeout(() => {
        get().setStage(targetStage);
        set({ transitionActive: false });
      }, 500);
    },

    // Memory fragment system
    activateMemoryFragment: fragmentId => {
      const { fragmentsExplored } = get().userEngagement;

      set(state => ({
        activeMemoryFragment: fragmentId,
        userEngagement: {
          ...state.userEngagement,
          fragmentsExplored: fragmentsExplored.includes(fragmentId)
            ? fragmentsExplored
            : [...fragmentsExplored, fragmentId],
          hasInteracted: true,
        },
      }));
    },

    deactivateMemoryFragment: () => {
      set({ activeMemoryFragment: null });
    },

    // User engagement tracking
    updateEngagement: engagement => {
      set(state => ({
        userEngagement: {
          ...state.userEngagement,
          ...engagement,
        },
      }));
    },

    // Performance integration
    toggleNarrativeMode: () => {
      set(state => ({
        enableNarrativeMode: !state.enableNarrativeMode,
      }));
    },

    // Reset system
    resetNarrative: () => {
      set({
        currentStage: 0,
        stageProgress: 0.0,
        globalProgress: 0.0,
        transitionActive: false,
        activeMemoryFragment: null,
        memoryFragmentsUnlocked: false,
        metacurtisActive: false,
        metacurtisVoiceLevel: 0,
        userEngagement: {
          hasScrolled: false,
          hasInteracted: false,
          timeOnPage: 0,
          fragmentsExplored: [],
          scrollVelocity: 0,
        },
        scrollState: {
          lastScrollTime: 0,
          scrollVelocity: 0,
          isScrolling: false,
          throttleMs: 16,
        },
      });
    },

    // ⚡ C. FRACTAL UNLOCKABLE SYSTEMS - Feature gating
    isStageFeatureEnabled: featureKey => {
      const { currentStage } = get();
      const requiredStage = STAGE_FEATURE_GATES[featureKey];

      if (requiredStage === undefined) {
        console.warn(`Unknown feature key: ${featureKey}`);
        return false;
      }

      return currentStage >= requiredStage;
    },

    // Get enabled features for current stage
    getEnabledFeatures: () => {
      const { currentStage } = get();
      return Object.entries(STAGE_FEATURE_GATES)
        .filter(([key, requiredStage]) => currentStage >= requiredStage)
        .map(([key]) => key);
    },

    // Check multiple features at once
    areAllFeaturesEnabled: featureKeys => {
      const state = get();
      return featureKeys.every(key => state.isStageFeatureEnabled(key));
    },

    // Getters
    getCurrentStageData: () => {
      const { currentStage } = get();
      return NARRATIVE_STAGES[currentStage] || NARRATIVE_STAGES[0];
    },

    getStageTitle: () => {
      const { currentStage } = get();
      return NARRATIVE_STAGES[currentStage]?.title || 'Genesis';
    },

    getStageDescription: () => {
      const { currentStage } = get();
      return NARRATIVE_STAGES[currentStage]?.description || 'Terminal boot';
    },

    isStageUnlocked: stage => {
      const { currentStage } = get();
      return stage <= currentStage;
    },

    // ⚡ B. COMPUTED STAGE METADATA FOR DEBUG/AI
    getNarrativeSnapshot: () => {
      const state = get();
      return {
        // Core state
        stage: state.getStageTitle(),
        stageIndex: state.currentStage,
        description: state.getStageDescription(),
        progress: {
          stage: state.stageProgress,
          global: state.globalProgress,
        },

        // Feature states
        features: {
          memoryFragmentsUnlocked: state.memoryFragmentsUnlocked,
          metacurtisActive: state.metacurtisActive,
          metacurtisLevel: state.metacurtisVoiceLevel,
          enabledFeatures: state.getEnabledFeatures(),
        },

        // User interaction
        engagement: {
          hasScrolled: state.userEngagement.hasScrolled,
          hasInteracted: state.userEngagement.hasInteracted,
          timeOnPage: state.userEngagement.timeOnPage,
          fragmentsExplored: state.userEngagement.fragmentsExplored.length,
          scrollVelocity: state.userEngagement.scrollVelocity,
        },

        // System state
        system: {
          narrativeMode: state.enableNarrativeMode,
          transitionActive: state.transitionActive,
          isScrolling: state.scrollState.isScrolling,
        },

        // Timestamp
        timestamp: Date.now(),
      };
    },

    // Get progression analysis for AI/debug
    getProgressionAnalysis: () => {
      const state = get();
      const snapshot = state.getNarrativeSnapshot();

      return {
        ...snapshot,
        analysis: {
          completionPercent: Math.round(state.globalProgress * 100),
          nextMilestone:
            state.currentStage < 5 ? NARRATIVE_STAGES[state.currentStage + 1].title : 'Complete',
          nextFeatureUnlock:
            Object.entries(STAGE_FEATURE_GATES).find(
              ([key, stage]) => stage > state.currentStage
            )?.[0] || 'All features unlocked',
          userEngagementLevel: state.userEngagement.hasInteracted
            ? 'Active'
            : state.userEngagement.hasScrolled
              ? 'Passive'
              : 'Initial',
        },
      };
    },

    // Development helpers
    devJumpToStage: stage => {
      if (process.env.NODE_ENV === 'development') {
        get().setStage(stage);
        console.log(`🚀 Dev: Jumped to stage ${stage} (${NARRATIVE_STAGES[stage]?.title})`);
      }
    },

    devGetState: () => {
      if (process.env.NODE_ENV === 'development') {
        return get().getNarrativeSnapshot();
      }
    },

    devTestFeature: featureKey => {
      if (process.env.NODE_ENV === 'development') {
        const state = get();
        const enabled = state.isStageFeatureEnabled(featureKey);
        const requiredStage = STAGE_FEATURE_GATES[featureKey];
        console.log(
          `🧪 Feature '${featureKey}': ${enabled ? 'ENABLED' : 'DISABLED'} (requires stage ${requiredStage}, current: ${state.currentStage})`
        );
        return enabled;
      }
    },
  }))
);

// Subscribe to performance store integration
if (typeof window !== 'undefined') {
  useNarrativeStore.subscribe(
    state => state.currentStage,
    currentStage => {
      // Update performance store with narrative state
      try {
        const performanceStore = require('./performanceStore').default;
        if (performanceStore.getState) {
          performanceStore.getState().updateNarrativeState?.({
            currentStage,
            progress: useNarrativeStore.getState().stageProgress,
          });
        }
      } catch (error) {
        console.log('Performance store integration pending...');
      }
    }
  );
}

// ⚡ A. REAL-TIME SCROLL BINDING UTILITY
export const createScrollBinding = () => {
  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = Math.max(
          document.body.scrollHeight - window.innerHeight,
          document.documentElement.scrollHeight - window.innerHeight,
          1 // Prevent division by zero
        );

        const globalProgress = Math.min(scrollY / maxScroll, 1);
        useNarrativeStore.getState().setGlobalProgress(globalProgress);

        ticking = false;
      });
      ticking = true;
    }
  };

  // Add scroll listener with passive flag for performance
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

// Export feature gates for external use
export { NARRATIVE_STAGES, STAGE_FEATURE_GATES };

// Development global access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.narrativeStore = useNarrativeStore;
  window.STAGE_FEATURE_GATES = STAGE_FEATURE_GATES;
}

export default useNarrativeStore;
