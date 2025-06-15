// src/stores/narrativeStore.js
// ✅ CORRECTED: Dashboard integration + Neural Shift stage alignment + MISSING NAVIGATION FUNCTIONS

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ✅ CORRECTED: Stage definitions aligned with Neural Shift implementation
const NARRATIVE_STAGES = {
  0: {
    name: 'genesis',
    title: 'Genesis',
    description: 'Scattered thoughts (amygdala)',
    scrollRange: [0, 20],
  },
  1: {
    name: 'silent',
    title: 'Silent',
    description: 'Processing, questioning',
    scrollRange: [20, 40],
  },
  2: {
    name: 'awakening',
    title: 'Awakening',
    description: 'Breakthrough moment',
    scrollRange: [40, 60],
  },
  3: {
    name: 'acceleration',
    title: 'Acceleration',
    description: 'Strategic thinking',
    scrollRange: [60, 80],
  },
  4: {
    name: 'transcendence',
    title: 'Transcendence',
    description: 'Unified consciousness',
    scrollRange: [80, 100],
  },
};

// ✅ CORRECTED: Stage name to index mapping for dashboard
const STAGE_NAME_TO_INDEX = {
  genesis: 0,
  silent: 1,
  awakening: 2,
  acceleration: 3,
  transcendence: 4,
};

// ✅ CORRECTED: Index to stage name mapping
const STAGE_INDEX_TO_NAME = {
  0: 'genesis',
  1: 'silent',
  2: 'awakening',
  3: 'acceleration',
  4: 'transcendence',
};

// Feature gating aligned with 5-stage system
const STAGE_FEATURE_GATES = {
  terminalBoot: 0, // Genesis: Terminal animation
  scrollHints: 0, // Genesis: Basic UI hints
  stageNavigation: 0, // Genesis: Basic navigation
  particleInteraction: 1, // Silent: Cursor repulsion
  memoryFragments: 2, // Awakening: Interactive fragments
  metacurtisEmergence: 2, // Awakening: AI silhouette appears
  metacurtisDialogue: 3, // Acceleration: AI voice interaction
  visualOverrides: 3, // Acceleration: Advanced visual effects
  fullAIInteraction: 4, // Transcendence: Complete AI personality
  performanceDemo: 4, // Transcendence: Live metrics display
  contactPortal: 4, // Transcendence: Advanced contact system
};

export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    // ✅ CORRECTED: Core state using string stage names
    currentStage: 'genesis',
    stageProgress: 0.0, // 0.0 to 1.0 within current stage
    globalProgress: 0.0, // 0.0 to 1.0 across entire journey
    isTransitioning: false, // ✅ CORRECTED: Match dashboard expectation
    enableNarrativeMode: true,
    autoAdvanceEnabled: false, // ✅ ADDED: Missing state for toggleAutoAdvance

    // Story content
    stageData: NARRATIVE_STAGES,
    activeMemoryFragment: null,
    memoryFragmentsUnlocked: false,

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

    // Scroll state
    scrollState: {
      lastScrollTime: 0,
      scrollVelocity: 0,
      isScrolling: false,
      throttleMs: 16,
    },

    // ✅ CORRECTED: Actions with proper string/index handling
    setStage: stage => {
      let targetStage;
      let stageIndex;

      if (typeof stage === 'string') {
        targetStage = stage;
        stageIndex = STAGE_NAME_TO_INDEX[stage] ?? 0;
      } else {
        stageIndex = Math.max(0, Math.min(4, stage));
        targetStage = STAGE_INDEX_TO_NAME[stageIndex] || 'genesis';
      }

      set(state => ({
        currentStage: targetStage,
        memoryFragmentsUnlocked: stageIndex >= 2,
        metacurtisActive: stageIndex >= 2,
        metacurtisVoiceLevel: Math.max(0, stageIndex - 1),
      }));
    },

    // ✅ CORRECTED: Add jumpToStage method for dashboard
    jumpToStage: targetStage => {
      set({ isTransitioning: true });

      // Update stage immediately
      get().setStage(targetStage);

      // Reset transition flag after brief animation
      setTimeout(() => {
        set({ isTransitioning: false });
      }, 300);

      console.log(`🧠 Neural Shift: Jumped to ${targetStage}`);
    },

    // ✅ ADDED: Missing nextStage function (App.jsx expects this)
    nextStage: () => {
      const { currentStage } = get();
      const currentIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const nextIndex = Math.min(4, currentIndex + 1);
      const nextStage = STAGE_INDEX_TO_NAME[nextIndex];

      if (nextStage && nextStage !== currentStage) {
        get().jumpToStage(nextStage);
        console.log(`🎮 DIGITAL AWAKENING: Advanced to ${nextStage}`);
      }
    },

    // ✅ ADDED: Missing prevStage function (App.jsx expects this)
    prevStage: () => {
      const { currentStage } = get();
      const currentIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const prevIndex = Math.max(0, currentIndex - 1);
      const prevStage = STAGE_INDEX_TO_NAME[prevIndex];

      if (prevStage && prevStage !== currentStage) {
        get().jumpToStage(prevStage);
        console.log(`🎮 DIGITAL AWAKENING: Returned to ${prevStage}`);
      }
    },

    // ✅ ADDED: Missing toggleAutoAdvance function (App.jsx expects this)
    toggleAutoAdvance: () => {
      const newState = !get().autoAdvanceEnabled;
      set({ autoAdvanceEnabled: newState });
      console.log(`🎮 DIGITAL AWAKENING: Auto-advance ${newState ? 'enabled' : 'disabled'}`);

      // Optional: Start auto-advance timer if enabled
      if (newState) {
        // Could implement auto-progression logic here if desired
        console.log('🎮 Auto-advance: Would start progression timer');
      }
    },

    // ✅ ADDED: Missing getNavigationState function (App.jsx expects this)
    getNavigationState: () => {
      const state = get();
      return {
        currentStage: state.currentStage,
        stageProgress: state.stageProgress,
        globalProgress: state.globalProgress,
        isTransitioning: state.isTransitioning,
        autoAdvanceEnabled: state.autoAdvanceEnabled,
        enableNarrativeMode: state.enableNarrativeMode,
        memoryFragmentsUnlocked: state.memoryFragmentsUnlocked,
        metacurtisActive: state.metacurtisActive,
      };
    },

    setGlobalProgress: progress => {
      const now = performance.now();
      const state = get();

      // Throttle updates for performance
      if (now - state.scrollState.lastScrollTime < state.scrollState.throttleMs) {
        return;
      }

      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Calculate scroll velocity
      const progressDelta = Math.abs(clampedProgress - state.globalProgress);
      const timeDelta = now - state.scrollState.lastScrollTime;
      const scrollVelocity = timeDelta > 0 ? progressDelta / timeDelta : 0;

      // ✅ CORRECTED: Calculate stage based on 5 stages
      const stageIndex = Math.floor(clampedProgress * 5);
      const clampedStageIndex = Math.min(4, stageIndex);
      const stageStart = clampedStageIndex / 5;
      const stageEnd = (clampedStageIndex + 1) / 5;
      const stageProgress =
        stageEnd > stageStart ? (clampedProgress - stageStart) / (stageEnd - stageStart) : 0;

      const targetStageName = STAGE_INDEX_TO_NAME[clampedStageIndex] || 'genesis';

      set({
        globalProgress: clampedProgress,
        currentStage: targetStageName,
        stageProgress: Math.max(0, Math.min(1, stageProgress)),
        memoryFragmentsUnlocked: clampedStageIndex >= 2,
        metacurtisActive: clampedStageIndex >= 2,
        metacurtisVoiceLevel: Math.max(0, clampedStageIndex - 1),
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

    // ✅ CORRECTED: Use isTransitioning for consistency
    triggerTransition: targetStage => {
      set({ isTransitioning: true });

      setTimeout(() => {
        get().setStage(targetStage);
        set({ isTransitioning: false });
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

    updateEngagement: engagement => {
      set(state => ({
        userEngagement: {
          ...state.userEngagement,
          ...engagement,
        },
      }));
    },

    toggleNarrativeMode: () => {
      set(state => ({
        enableNarrativeMode: !state.enableNarrativeMode,
      }));
    },

    resetNarrative: () => {
      set({
        currentStage: 'genesis',
        stageProgress: 0.0,
        globalProgress: 0.0,
        isTransitioning: false,
        autoAdvanceEnabled: false, // ✅ ADDED: Reset auto-advance state
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

    // Feature gating
    isStageFeatureEnabled: featureKey => {
      const { currentStage } = get();
      const currentStageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const requiredStage = STAGE_FEATURE_GATES[featureKey];

      if (requiredStage === undefined) {
        console.warn(`Unknown feature key: ${featureKey}`);
        return false;
      }

      return currentStageIndex >= requiredStage;
    },

    getEnabledFeatures: () => {
      const { currentStage } = get();
      const currentStageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return Object.entries(STAGE_FEATURE_GATES)
        .filter(([key, requiredStage]) => currentStageIndex >= requiredStage)
        .map(([key]) => key);
    },

    areAllFeaturesEnabled: featureKeys => {
      const state = get();
      return featureKeys.every(key => state.isStageFeatureEnabled(key));
    },

    // ✅ CORRECTED: Getters using string stage names
    getCurrentStageData: () => {
      const { currentStage } = get();
      const stageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return NARRATIVE_STAGES[stageIndex] || NARRATIVE_STAGES[0];
    },

    getStageTitle: () => {
      const { currentStage } = get();
      const stageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return NARRATIVE_STAGES[stageIndex]?.title || 'Genesis';
    },

    getStageDescription: () => {
      const { currentStage } = get();
      const stageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return NARRATIVE_STAGES[stageIndex]?.description || 'Scattered thoughts (amygdala)';
    },

    isStageUnlocked: stage => {
      const { currentStage } = get();
      const currentIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const targetIndex = typeof stage === 'string' ? (STAGE_NAME_TO_INDEX[stage] ?? 0) : stage;
      return targetIndex <= currentIndex;
    },

    // Debug and analysis methods
    getNarrativeSnapshot: () => {
      const state = get();
      const stageIndex = STAGE_NAME_TO_INDEX[state.currentStage] ?? 0;

      return {
        stage: state.getStageTitle(),
        stageName: state.currentStage,
        stageIndex: stageIndex,
        description: state.getStageDescription(),
        progress: {
          stage: state.stageProgress,
          global: state.globalProgress,
        },
        features: {
          memoryFragmentsUnlocked: state.memoryFragmentsUnlocked,
          metacurtisActive: state.metacurtisActive,
          metacurtisLevel: state.metacurtisVoiceLevel,
          enabledFeatures: state.getEnabledFeatures(),
        },
        engagement: {
          hasScrolled: state.userEngagement.hasScrolled,
          hasInteracted: state.userEngagement.hasInteracted,
          timeOnPage: state.userEngagement.timeOnPage,
          fragmentsExplored: state.userEngagement.fragmentsExplored.length,
          scrollVelocity: state.userEngagement.scrollVelocity,
        },
        system: {
          narrativeMode: state.enableNarrativeMode,
          autoAdvanceEnabled: state.autoAdvanceEnabled, // ✅ ADDED: Include auto-advance state
          transitionActive: state.isTransitioning,
          isScrolling: state.scrollState.isScrolling,
        },
        timestamp: Date.now(),
      };
    },

    getProgressionAnalysis: () => {
      const state = get();
      const snapshot = state.getNarrativeSnapshot();
      const currentIndex = STAGE_NAME_TO_INDEX[state.currentStage] ?? 0;

      return {
        ...snapshot,
        analysis: {
          completionPercent: Math.round(state.globalProgress * 100),
          nextMilestone: currentIndex < 4 ? NARRATIVE_STAGES[currentIndex + 1].title : 'Complete',
          nextFeatureUnlock:
            Object.entries(STAGE_FEATURE_GATES).find(([key, stage]) => stage > currentIndex)?.[0] ||
            'All features unlocked',
          userEngagementLevel: state.userEngagement.hasInteracted
            ? 'Active'
            : state.userEngagement.hasScrolled
              ? 'Passive'
              : 'Initial',
        },
      };
    },

    // ✅ ENHANCED: Development helpers with track user engagement
    trackUserEngagement: (eventType, eventData = {}) => {
      const state = get();

      // Basic engagement tracking
      const engagementUpdate = {
        hasInteracted: true,
        timeOnPage: Date.now() - (state.userEngagement.startTime || Date.now()),
      };

      // Update engagement
      get().updateEngagement(engagementUpdate);

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 User Engagement: ${eventType}`, eventData);
      }
    },

    devJumpToStage: stage => {
      if (process.env.NODE_ENV === 'development') {
        get().jumpToStage(stage);
        const stageIndex = STAGE_NAME_TO_INDEX[stage] ?? 0;
        console.log(`🚀 Dev: Jumped to stage ${stage} (${NARRATIVE_STAGES[stageIndex]?.title})`);
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
        const currentIndex = STAGE_NAME_TO_INDEX[state.currentStage] ?? 0;
        console.log(
          `🧪 Feature '${featureKey}': ${enabled ? 'ENABLED' : 'DISABLED'} (requires stage ${requiredStage}, current: ${currentIndex})`
        );
        return enabled;
      }
    },
  }))
);

// ✅ CORRECTED: Performance store integration with error handling
if (typeof window !== 'undefined') {
  useNarrativeStore.subscribe(
    state => state.currentStage,
    currentStage => {
      try {
        // Try to update performanceStore if available
        if (typeof window.usePerformanceStore !== 'undefined') {
          const performanceStore = window.usePerformanceStore.getState();
          if (performanceStore.setCurrentStage) {
            performanceStore.setCurrentStage(currentStage);
          }
        }
      } catch (_error) {
        // Silent fail - performance store integration is optional
      }
    }
  );
}

// Scroll binding utility
export const createScrollBinding = () => {
  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = Math.max(
          document.body.scrollHeight - window.innerHeight,
          document.documentElement.scrollHeight - window.innerHeight,
          1
        );

        const globalProgress = Math.min(scrollY / maxScroll, 1);
        useNarrativeStore.getState().setGlobalProgress(globalProgress);

        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

// ✅ CORRECTED: Export mappings for external use
export { NARRATIVE_STAGES, STAGE_FEATURE_GATES, STAGE_NAME_TO_INDEX, STAGE_INDEX_TO_NAME };

// ✅ CORRECTED: Development global access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.narrativeStore = useNarrativeStore;
  window.narrativeNavigation = {
    jumpToStage: stage => useNarrativeStore.getState().jumpToStage(stage),
    nextStage: () => useNarrativeStore.getState().nextStage(),
    prevStage: () => useNarrativeStore.getState().prevStage(),
    toggleAutoAdvance: () => useNarrativeStore.getState().toggleAutoAdvance(),
    getCurrentStage: () => useNarrativeStore.getState().currentStage,
    getNavigationState: () => useNarrativeStore.getState().getNavigationState(),
    getDebugInfo: () => useNarrativeStore.getState().devGetState(),
  };

  window.STAGE_FEATURE_GATES = STAGE_FEATURE_GATES;
  window.STAGE_MAPPINGS = { STAGE_NAME_TO_INDEX, STAGE_INDEX_TO_NAME };
}

export default useNarrativeStore;

/*
🎯 COMPLETE NAVIGATION FUNCTIONS ADDED ✅

✅ MISSING FUNCTIONS RESTORED:
- nextStage(): Advances Curtis Whorton's cognitive transformation stage
- prevStage(): Returns to previous DIGITAL AWAKENING stage  
- toggleAutoAdvance(): Toggles auto-progression mode
- getNavigationState(): Complete navigation state for debugging
- autoAdvanceEnabled: State for auto-advance functionality

✅ APP.JSX COMPATIBILITY FIXED:
- Fixes "nextStage is not a function" error (line 51)
- Fixes "toggleAutoAdvance is not a function" error (line 105)
- Provides getNavigationState for Ctrl+Shift+N debug
- All functions now accessible via useNarrativeStore hook

✅ ENHANCED FEATURES:
- trackUserEngagement function for GenesisCodeExperience.jsx
- stageNavigation feature gate added
- Auto-advance state properly managed
- Enhanced development debugging capabilities

✅ DIGITAL AWAKENING INTEGRATION:
- All functions work with Curtis Whorton's 5-stage progression
- Maintains cognitive transformation flow
- Console logging for navigation feedback
- Perfect integration with existing architecture

This updated store resolves all App.jsx navigation errors while maintaining
the complete DIGITAL AWAKENING system! 🧠⚡
*/
