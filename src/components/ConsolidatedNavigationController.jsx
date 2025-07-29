// src/components/ConsolidatedNavigationController.jsx
// 🎯 SINGLE NAVIGATION SYSTEM - SST v2.0 COMPLIANT
// ✅ FIXED: Cleaned up all ESLint warnings

import { useEffect, useRef, useCallback } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';

// ✅ SST v2.0: Canonical 7-stage order
const MC3V_STAGE_ORDER = [
  'genesis', // Stage 0: Hippocampus activation
  'discipline', // Stage 1: Brainstem activation
  'neural', // Stage 2: Left temporal
  'velocity', // Stage 3: Right temporal
  'architecture', // Stage 4: Frontal lobe
  'harmony', // Stage 5: Left prefrontal
  'transcendence', // Stage 6: Consciousness core
];

// ✅ SST v2.0: Stage metadata
const STAGE_METADATA = {
  totalStages: MC3V_STAGE_ORDER.length,
  firstStage: MC3V_STAGE_ORDER[0],
  lastStage: MC3V_STAGE_ORDER[MC3V_STAGE_ORDER.length - 1],

  stageLabels: {
    genesis: '1983',
    discipline: '1983-2022',
    neural: '2022',
    velocity: 'Feb 2025',
    architecture: 'Mar 2025',
    harmony: 'Mar 2025',
    transcendence: 'Present',
  },

  autoAdvanceTiming: {
    genesis: 8000,
    discipline: 6000,
    neural: 10000,
    velocity: 8000,
    architecture: 8000,
    harmony: 8000,
    transcendence: 12000,
  },
};

// ✅ SST v2.0: Stage utilities
const stageUtils = {
  stageToIndex: stageName => {
    const index = MC3V_STAGE_ORDER.indexOf(stageName);
    if (index === -1) {
      console.warn(`[MC3V] Unknown stage name: "${stageName}". Defaulting to 0.`);
      return 0;
    }
    return index;
  },

  indexToStage: index => {
    if (index < 0 || index >= MC3V_STAGE_ORDER.length) {
      console.warn(`[MC3V] Invalid stage index: ${index}. Defaulting to "${MC3V_STAGE_ORDER[0]}".`);
      return MC3V_STAGE_ORDER[0];
    }
    return MC3V_STAGE_ORDER[index];
  },

  getNextStage: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    const nextIndex = Math.min(currentIndex + 1, MC3V_STAGE_ORDER.length - 1);
    return MC3V_STAGE_ORDER[nextIndex];
  },

  getPrevStage: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    const prevIndex = Math.max(currentIndex - 1, 0);
    return MC3V_STAGE_ORDER[prevIndex];
  },

  isValidStage: stageName => {
    return MC3V_STAGE_ORDER.includes(stageName);
  },

  canAdvance: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    return currentIndex < MC3V_STAGE_ORDER.length - 1;
  },

  canGoBack: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    return currentIndex > 0;
  },

  getStageInfo: stageName => {
    const index = stageUtils.stageToIndex(stageName);
    return {
      name: stageName,
      index,
      label: STAGE_METADATA.stageLabels[stageName] || stageName,
      autoAdvanceTime: STAGE_METADATA.autoAdvanceTiming[stageName] || 5000,
      progress: index / (MC3V_STAGE_ORDER.length - 1),
      isFirst: index === 0,
      isLast: index === MC3V_STAGE_ORDER.length - 1,
      canAdvance: stageUtils.canAdvance(stageName),
      canGoBack: stageUtils.canGoBack(stageName),
    };
  },

  getAllStagesInfo: () => {
    return MC3V_STAGE_ORDER.map(stage => stageUtils.getStageInfo(stage));
  },
};

export default function ConsolidatedNavigationController() {
  const {
    jumpToStage,
    currentStage,
    updateEngagement,
    isStageFeatureEnabled,
    getNarrativeSnapshot,
  } = useNarrativeStore();

  // Navigation state
  const transitionTimeoutRef = useRef(null);
  const stageStartTime = useRef(Date.now());
  const autoAdvanceEnabled = useRef(false);
  const isTransitioning = useRef(false);

  // Once-only narrative events tracking
  const stageReached = useRef(
    MC3V_STAGE_ORDER.reduce((acc, stage) => {
      acc[stage] = false;
      return acc;
    }, {})
  );

  // ✅ STAGE EVENT SYSTEM - Defined early to avoid dependency issues
  const triggerStageEvents = useCallback(
    stageName => {
      // Trigger once-only events
      if (!stageReached.current[stageName]) {
        stageReached.current[stageName] = true;

        switch (stageName) {
          case 'discipline':
            console.log('🎖️ Narrative Event: Marine discipline foundation');
            if (isStageFeatureEnabled('disciplineEffects')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'disciplineActivated', stage: 'discipline' },
                })
              );
            }
            break;

          case 'neural':
            console.log('🤖 Narrative Event: AI partnership begins');
            if (isStageFeatureEnabled('metacurtisEmergence')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'metacurtisAwakening', stage: 'neural' },
                })
              );
            }
            break;

          case 'velocity':
            console.log('�� Narrative Event: Development acceleration');
            if (isStageFeatureEnabled('accelerationEffects')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'accelerationActivated', stage: 'velocity' },
                })
              );
            }
            break;

          case 'transcendence':
            console.log('⚡ Narrative Event: Consciousness transcendence achieved');
            if (isStageFeatureEnabled('transcendenceEffects')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'transcendenceAchieved', stage: 'transcendence' },
                })
              );
            }

            if (isStageFeatureEnabled('contactPortal')) {
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('narrativeEvent', {
                    detail: { type: 'contactPortalActivated', stage: 'transcendence' },
                  })
                );
              }, 3000);
            }
            break;
        }
      }

      // Update engagement metrics
      updateEngagement({
        currentStage: stageName,
        stageIndex: stageUtils.stageToIndex(stageName),
        timeInStage: Date.now() - stageStartTime.current,
      });
    },
    [isStageFeatureEnabled, updateEngagement]
  );

  // ✅ AUTO-ADVANCE FUNCTIONALITY - Clear defined before use
  const clearAutoAdvance = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  // Forward declaration for circular dependency
  const nextStageHandler = useCallback(() => {
    // Implementation below after scheduleAutoAdvance is defined
  }, []);

  const scheduleAutoAdvance = useCallback(
    stageName => {
      clearAutoAdvance();

      const advanceTime = STAGE_METADATA.autoAdvanceTiming[stageName];
      if (advanceTime && stageUtils.canAdvance(stageName)) {
        transitionTimeoutRef.current = setTimeout(() => {
          nextStageHandler();
        }, advanceTime);

        console.log(`⏰ Auto-advance scheduled for ${stageName}: ${advanceTime}ms`);
      }
    },
    [nextStageHandler, clearAutoAdvance]
  );

  // ✅ CANONICAL STAGE-BASED NAVIGATION FUNCTIONS

  // Update nextStageHandler implementation
  const nextStageHandlerImpl = useCallback(() => {
    if (isTransitioning.current) return false;

    const nextStageName = stageUtils.getNextStage(currentStage);
    if (nextStageName === currentStage) return false; // Already at last stage

    console.log(`🎬 Next: ${currentStage} → ${nextStageName}`);

    // Trigger transition
    isTransitioning.current = true;
    jumpToStage(nextStageName); // Use narrativeStore function
    stageStartTime.current = Date.now();

    // Trigger events and setup auto-advance
    triggerStageEvents(nextStageName);
    if (autoAdvanceEnabled.current) {
      scheduleAutoAdvance(nextStageName);
    }

    setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
    return true;
  }, [currentStage, jumpToStage, triggerStageEvents, scheduleAutoAdvance]);

  // Update the reference
  nextStageHandler.current = nextStageHandlerImpl;

  const prevStageHandler = useCallback(() => {
    if (isTransitioning.current) return false;

    const prevStageName = stageUtils.getPrevStage(currentStage);
    if (prevStageName === currentStage) return false; // Already at first stage

    console.log(`🎬 Previous: ${currentStage} → ${prevStageName}`);

    isTransitioning.current = true;
    jumpToStage(prevStageName); // Use narrativeStore function
    stageStartTime.current = Date.now();

    clearAutoAdvance();
    triggerStageEvents(prevStageName);

    setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
    return true;
  }, [currentStage, jumpToStage, clearAutoAdvance, triggerStageEvents]);

  const jumpToStageHandler = useCallback(
    targetStage => {
      if (isTransitioning.current) return false;
      if (!stageUtils.isValidStage(targetStage)) {
        console.warn(`[Navigation] Invalid stage: ${targetStage}`);
        return false;
      }
      if (targetStage === currentStage) return false;

      console.log(`🎬 Jump: ${currentStage} → ${targetStage}`);

      isTransitioning.current = true;
      jumpToStage(targetStage); // Use narrativeStore function
      stageStartTime.current = Date.now();

      clearAutoAdvance();
      triggerStageEvents(targetStage);
      if (autoAdvanceEnabled.current) {
        scheduleAutoAdvance(targetStage);
      }

      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
      return true;
    },
    [currentStage, jumpToStage, clearAutoAdvance, scheduleAutoAdvance, triggerStageEvents]
  );

  const toggleAutoAdvance = useCallback(
    enabled => {
      autoAdvanceEnabled.current = enabled;

      if (enabled) {
        scheduleAutoAdvance(currentStage);
        console.log('▶️ Auto-advance enabled');
      } else {
        clearAutoAdvance();
        console.log('⏸️ Auto-advance disabled');
      }

      return enabled;
    },
    [currentStage, scheduleAutoAdvance, clearAutoAdvance]
  );

  // ✅ UI HELPER FUNCTIONS

  const getNavigationState = useCallback(() => {
    const stageInfo = stageUtils.getStageInfo(currentStage);
    return {
      currentStage,
      currentIndex: stageInfo.index,
      canGoNext: stageInfo.canAdvance,
      canGoPrev: stageInfo.canGoBack,
      isFirstStage: stageInfo.isFirst,
      isLastStage: stageInfo.isLast,
      autoAdvanceEnabled: autoAdvanceEnabled.current,
      isTransitioning: isTransitioning.current,
      allStages: stageUtils.getAllStagesInfo(),
    };
  }, [currentStage]);

  const getStageButtonData = useCallback(() => {
    return MC3V_STAGE_ORDER.map(stageName => ({
      id: stageName,
      label: STAGE_METADATA.stageLabels[stageName],
      isActive: stageName === currentStage,
      isReached: stageReached.current[stageName],
      onClick: () => jumpToStageHandler(stageName),
    }));
  }, [currentStage, jumpToStageHandler]);

  // ✅ KEYBOARD NAVIGATION

  useEffect(() => {
    const handleKeyDown = event => {
      let handled = false;

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          handled = nextStageHandlerImpl();
          break;

        case 'ArrowLeft':
          handled = prevStageHandler();
          break;

        case 'Home':
          handled = jumpToStageHandler(STAGE_METADATA.firstStage);
          break;

        case 'End':
          handled = jumpToStageHandler(STAGE_METADATA.lastStage);
          break;

        case 'p':
        case 'P':
          if (event.ctrlKey || event.metaKey) {
            toggleAutoAdvance(!autoAdvanceEnabled.current);
            handled = true;
          }
          break;
      }

      // Development shortcuts
      if (process.env.NODE_ENV === 'development') {
        if (event.ctrlKey && event.key >= '0' && event.key <= '6') {
          const targetIndex = parseInt(event.key);
          const targetStage = stageUtils.indexToStage(targetIndex);
          handled = jumpToStageHandler(targetStage);
          console.log(`🎮 Dev shortcut: Stage ${targetIndex} (${targetStage})`);
        }

        if (event.ctrlKey && event.key === 't') {
          const snapshot = getNarrativeSnapshot();
          console.log('📊 Navigation state:', getNavigationState());
          console.log('📊 Narrative state:', snapshot);
          handled = true;
        }
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nextStageHandlerImpl,
    prevStageHandler,
    jumpToStageHandler,
    toggleAutoAdvance,
    getNavigationState,
    getNarrativeSnapshot,
  ]);

  // ✅ INITIALIZATION

  useEffect(() => {
    console.log('🎭 Consolidated Navigation Controller: SST v2.0 Initialized...');

    // Initialize with first stage if not already set
    if (!stageUtils.isValidStage(currentStage)) {
      console.log(`�� Invalid current stage "${currentStage}", initializing to genesis`);
      jumpToStageHandler('genesis');
    } else {
      console.log(`✅ Navigation initialized at stage: ${currentStage}`);
      stageStartTime.current = Date.now();
      triggerStageEvents(currentStage);
    }

    return () => {
      clearAutoAdvance();
    };
  }, []); // Empty deps - only run once on mount

  // ✅ GLOBAL API EXPOSURE

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.narrativeNavigation = {
        // Core navigation
        nextStage: nextStageHandlerImpl,
        prevStage: prevStageHandler,
        jumpToStage: jumpToStageHandler,

        // Auto-advance
        toggleAutoAdvance,
        isAutoAdvanceEnabled: () => autoAdvanceEnabled.current,

        // State queries
        getCurrentStage: () => currentStage,
        getNavigationState,
        getStageButtonData,

        // Utilities
        canAdvance: () => stageUtils.canAdvance(currentStage),
        canGoBack: () => stageUtils.canGoBack(currentStage),
        getAllStages: () => MC3V_STAGE_ORDER,
        getStageInfo: stage => stageUtils.getStageInfo(stage || currentStage),

        // Debug
        getDebugInfo: () => ({
          currentStage,
          stageIndex: stageUtils.stageToIndex(currentStage),
          autoAdvance: autoAdvanceEnabled.current,
          isTransitioning: isTransitioning.current,
          stageReached: { ...stageReached.current },
        }),
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.narrativeNavigation;
      }
    };
  }, [
    currentStage,
    nextStageHandlerImpl,
    prevStageHandler,
    jumpToStageHandler,
    toggleAutoAdvance,
    getNavigationState,
    getStageButtonData,
  ]);

  // This component doesn't render anything - pure logic
  return null;
}
