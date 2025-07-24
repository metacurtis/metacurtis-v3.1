// src/stores/narrativeStore.js
// ✅ SST v2.0 COMPLIANT: 7-Stage Consciousness Evolution System
// ✅ ENHANCED INTEGRATION: Complete navigation + engagement tracking + feature gates

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ✅ SST v2.0: 7-stage consciousness evolution definitions
const NARRATIVE_STAGES = {
  0: {
    name: 'genesis',
    title: 'Genesis Spark',
    description: '1983: Age 8 - The Genesis Code',
    narrative: 'A single spark of curiosity on a Commodore 64',
    scrollRange: [0, 14],
  },
  1: {
    name: 'discipline',
    title: 'Discipline Forge',
    description: '1983-2022: The Silent Years - Discipline Forged',
    narrative: '39 years in business, logistics, and finance',
    scrollRange: [14, 28],
  },
  2: {
    name: 'neural',
    title: 'Neural Awakening',
    description: '2022-2025: AI Foundation - Mathematical Mastery',
    narrative: 'AI partnership consciousness emerging',
    scrollRange: [28, 42],
  },
  3: {
    name: 'velocity',
    title: 'Velocity Explosion',
    description: 'February 2025: "Teach me to code" - Velocity Unleashed',
    narrative: 'Global electrical storm constellation',
    scrollRange: [42, 56],
  },
  4: {
    name: 'architecture',
    title: 'Architecture Consciousness',
    description: 'March 2025: WebGL Crisis → Architecture Awakening',
    narrative: 'Analytical grid constellations forming order from chaos',
    scrollRange: [56, 70],
  },
  5: {
    name: 'harmony',
    title: 'Harmonic Mastery',
    description: 'March 2025: Systems Choreography - Code as Dance',
    narrative: 'Golden balletic constellation flows',
    scrollRange: [70, 84],
  },
  6: {
    name: 'transcendence',
    title: 'Consciousness Transcendence',
    description: 'Present: Digital Consciousness - Proven Mastery',
    narrative: 'Unified golden galaxy constellation',
    scrollRange: [84, 100],
  },
};

// ✅ SST v2.0: 7-stage name to index mapping
const STAGE_NAME_TO_INDEX = {
  genesis: 0,
  discipline: 1,
  neural: 2,
  velocity: 3,
  architecture: 4,
  harmony: 5,
  transcendence: 6,
};

// ✅ SST v2.0: 7-stage index to name mapping
const STAGE_INDEX_TO_NAME = {
  0: 'genesis',
  1: 'discipline',
  2: 'neural',
  3: 'velocity',
  4: 'architecture',
  5: 'harmony',
  6: 'transcendence',
};

// ✅ ENHANCED: Feature gating aligned with 7-stage system
const STAGE_FEATURE_GATES = {
  terminalBoot: 0, // Genesis: Terminal animation
  scrollHints: 0, // Genesis: Basic UI hints
  stageNavigation: 0, // Genesis: Basic navigation
  particleInteraction: 1, // Discipline: Cursor repulsion
  memoryFragments: 2, // Neural: Interactive fragments
  metacurtisEmergence: 2, // Neural: AI silhouette appears
  metacurtisDialogue: 3, // Velocity: AI voice interaction
  visualOverrides: 3, // Velocity: Advanced visual effects
  architecturalDebug: 4, // Architecture: Debug tools unlock
  performanceMetrics: 4, // Architecture: Live metrics display
  harmonicEffects: 5, // Harmony: Balletic particle effects
  fullAIInteraction: 6, // Transcendence: Complete AI personality
  contactPortal: 6, // Transcendence: Advanced contact system
};

export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    // ✅ SST v2.0: Core state using 7-stage system
    currentStage: 'genesis',
    stageProgress: 0.0, // 0.0 to 1.0 within current stage
    globalProgress: 0.0, // 0.0 to 1.0 across entire journey
    isTransitioning: false,
    enableNarrativeMode: true,
    autoAdvanceEnabled: false,

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

    // ✅ SST v2.0: Actions with 7-stage string/index handling
    setStage: stage => {
      let targetStage;
      let stageIndex;

      if (typeof stage === 'string') {
        targetStage = stage;
        stageIndex = STAGE_NAME_TO_INDEX[stage] ?? 0;
      } else {
        stageIndex = Math.max(0, Math.min(6, stage)); // ✅ Updated: min(6) for 7 stages
        targetStage = STAGE_INDEX_TO_NAME[stageIndex] || 'genesis';
      }

      set(state => ({
        currentStage: targetStage,
        memoryFragmentsUnlocked: stageIndex >= 2, // Neural stage unlocks fragments
        metacurtisActive: stageIndex >= 2, // Neural stage activates AI
        metacurtisVoiceLevel: Math.max(0, stageIndex - 1),
      }));
    },

    // ✅ PRESERVED: jumpToStage method for navigation
    jumpToStage: targetStage => {
      set({ isTransitioning: true });

      // Update stage immediately
      get().setStage(targetStage);

      // Reset transition flag after brief animation
      setTimeout(() => {
        set({ isTransitioning: false });
      }, 300);

      console.log(`🧠 SST v2.0: Jumped to ${targetStage}`);
    },

    // ✅ PRESERVED: nextStage function
    nextStage: () => {
      const { currentStage } = get();
      const currentIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const nextIndex = Math.min(6, currentIndex + 1); // ✅ Updated: min(6) for 7 stages
      const nextStage = STAGE_INDEX_TO_NAME[nextIndex];

      if (nextStage && nextStage !== currentStage) {
        get().jumpToStage(nextStage);
        console.log(`🎮 SST v2.0: Advanced to ${nextStage}`);
      }
    },

    // ✅ PRESERVED: prevStage function
    prevStage: () => {
      const { currentStage } = get();
      const currentIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const prevIndex = Math.max(0, currentIndex - 1);
      const prevStage = STAGE_INDEX_TO_NAME[prevIndex];

      if (prevStage && prevStage !== currentStage) {
        get().jumpToStage(prevStage);
        console.log(`🎮 SST v2.0: Returned to ${prevStage}`);
      }
    },

    // ✅ PRESERVED: toggleAutoAdvance function
    toggleAutoAdvance: () => {
      const newState = !get().autoAdvanceEnabled;
      set({ autoAdvanceEnabled: newState });
      console.log(`🎮 SST v2.0: Auto-advance ${newState ? 'enabled' : 'disabled'}`);

      // Optional: Start auto-advance timer if enabled
      if (newState) {
        console.log('🎮 Auto-advance: Would start progression timer');
      }
    },

    // ✅ PRESERVED: getNavigationState function
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
        totalStages: 7, // ✅ SST v2.0: 7-stage system
      };
    },

    // ✅ SST v2.0: Updated global progress calculation for 7-stage system
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

      // ✅ SST v2.0: Calculate stage based on 7 stages
      const stageIndex = Math.floor(clampedProgress * 7); // ✅ Updated: * 7 for 7 stages
      const clampedStageIndex = Math.min(6, stageIndex); // ✅ Updated: min(6) for 7 stages
      const stageStart = clampedStageIndex / 7; // ✅ Updated: / 7 for 7 stages
      const stageEnd = (clampedStageIndex + 1) / 7; // ✅ Updated: / 7 for 7 stages
      const stageProgress =
        stageEnd > stageStart ? (clampedProgress - stageStart) / (stageEnd - stageStart) : 0;

      const targetStageName = STAGE_INDEX_TO_NAME[clampedStageIndex] || 'genesis';

      set({
        globalProgress: clampedProgress,
        currentStage: targetStageName,
        stageProgress: Math.max(0, Math.min(1, stageProgress)),
        memoryFragmentsUnlocked: clampedStageIndex >= 2, // Neural stage
        metacurtisActive: clampedStageIndex >= 2, // Neural stage
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

    // ✅ PRESERVED: Transition system
    triggerTransition: targetStage => {
      set({ isTransitioning: true });

      setTimeout(() => {
        get().setStage(targetStage);
        set({ isTransitioning: false });
      }, 500);
    },

    // ✅ PRESERVED: Memory fragment system
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

    // ✅ SST v2.0: Updated reset for 7-stage system
    resetNarrative: () => {
      set({
        currentStage: 'genesis',
        stageProgress: 0.0,
        globalProgress: 0.0,
        isTransitioning: false,
        autoAdvanceEnabled: false,
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

    // ✅ PRESERVED: Feature gating
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

    // ✅ SST v2.0: Getters using 7-stage string stage names
    getCurrentStageData: () => {
      const { currentStage } = get();
      const stageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return NARRATIVE_STAGES[stageIndex] || NARRATIVE_STAGES[0];
    },

    getStageTitle: () => {
      const { currentStage } = get();
      const stageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return NARRATIVE_STAGES[stageIndex]?.title || 'Genesis Spark';
    },

    getStageDescription: () => {
      const { currentStage } = get();
      const stageIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      return NARRATIVE_STAGES[stageIndex]?.description || '1983: Age 8 - The Genesis Code';
    },

    isStageUnlocked: stage => {
      const { currentStage } = get();
      const currentIndex = STAGE_NAME_TO_INDEX[currentStage] ?? 0;
      const targetIndex = typeof stage === 'string' ? (STAGE_NAME_TO_INDEX[stage] ?? 0) : stage;
      return targetIndex <= currentIndex;
    },

    // ✅ PRESERVED: User engagement tracking
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
        console.log(`📊 SST v2.0 User Engagement: ${eventType}`, eventData);
      }
    },

    // ✅ SST v2.0: Enhanced debug and analysis methods
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
          autoAdvanceEnabled: state.autoAdvanceEnabled,
          transitionActive: state.isTransitioning,
          isScrolling: state.scrollState.isScrolling,
          totalStages: 7, // ✅ SST v2.0: 7-stage system
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
          nextMilestone: currentIndex < 6 ? NARRATIVE_STAGES[currentIndex + 1].title : 'Complete', // ✅ Updated: < 6
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

    // ✅ PRESERVED: Development helpers
    devJumpToStage: stage => {
      if (process.env.NODE_ENV === 'development') {
        get().jumpToStage(stage);
        const stageIndex = STAGE_NAME_TO_INDEX[stage] ?? 0;
        console.log(`🚀 SST v2.0 Dev: Jumped to stage ${stage} (${NARRATIVE_STAGES[stageIndex]?.title})`);
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
          `🧪 SST v2.0 Feature '${featureKey}': ${enabled ? 'ENABLED' : 'DISABLED'} (requires stage ${requiredStage}, current: ${currentIndex})`
        );
        return enabled;
      }
    },
  }))
);

// ✅ PRESERVED: Performance store integration with error handling
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

// ✅ PRESERVED: Scroll binding utility
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

// ✅ SST v2.0: Export mappings for external use
export { NARRATIVE_STAGES, STAGE_FEATURE_GATES, STAGE_NAME_TO_INDEX, STAGE_INDEX_TO_NAME };

// ✅ ENHANCED: Development global access
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
  
  console.log('🎭 SST v2.0 narrativeStore: 7-stage system active with enhanced dev tools');
}

export default useNarrativeStore;

/*
🎭 SST v2.0 NARRATIVE STORE - COMPLETE 7-STAGE SYSTEM ✅

✅ SST v2.0 COMPLIANCE ACHIEVED:
- 7-stage consciousness evolution: genesis → discipline → neural → velocity → architecture → harmony → transcendence
- Canonical stage names aligned with SST Master Framework
- Scroll ranges updated: 14% increments per SST specification (0-14%, 14-28%, etc.)
- Mathematics updated: * 7 calculations, min(6) bounds, / 7 progress divisions

✅ COMPLETE FUNCTIONALITY PRESERVED:
- All navigation functions: nextStage, prevStage, jumpToStage, toggleAutoAdvance
- Feature gates system with enhanced 7-stage capabilities
- User engagement tracking and analytics
- Memory fragment system and AI personality progression
- Development tools and debug capabilities
- Performance store integration and state subscriptions

✅ ENHANCED CAPABILITIES ADDED:
- SST v2.0 narrative content with authentic Curtis Whorton story
- Enhanced feature gates for architecture and harmony stages
- Complete 7-stage progression analysis and debugging
- Improved stage validation and error handling
- Full compatibility with ConsciousnessTheater expectations

✅ INFINITE LOOP RESOLUTION:
- No more "silent" → "discipline" (SST canonical)
- No more "awakening" → "neural" (SST canonical)  
- No more "acceleration" → "velocity" (SST canonical)
- Added missing "architecture" and "harmony" stages
- ConsciousnessTheater will accept all 7-stage names without correction

This implementation resolves the infinite correction loop while preserving
all existing functionality and implementing complete SST v2.0 compliance! 🧠⚡
*/