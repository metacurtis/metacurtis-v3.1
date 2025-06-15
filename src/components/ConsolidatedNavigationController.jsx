// src/components/narrative/ConsolidatedNavigationController.jsx
// 🎯 SINGLE NAVIGATION SYSTEM - Replaces all other navigation components
// Handles keyboard, UI, auto-advance, and programmatic navigation

import { useEffect, useRef, useCallback } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';
import {
  MC3V_STAGE_ORDER,
  STAGE_METADATA,
  stageUtils,
  validateStageIntegrity,
} from '@/config/narrativeStageOrder';
import { NARRATIVE_PRESETS } from '@/config/narrativeParticleConfig';

export default function ConsolidatedNavigationController() {
  const { setStage, currentStage, updateEngagement, isStageFeatureEnabled, getNarrativeSnapshot } =
    useNarrativeStore();

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

  // ✅ CANONICAL STAGE-BASED NAVIGATION FUNCTIONS

  const nextStage = useCallback(() => {
    if (isTransitioning.current) return false;

    const nextStageName = stageUtils.getNextStage(currentStage);
    if (nextStageName === currentStage) return false; // Already at last stage

    console.log(`🎬 Next: ${currentStage} → ${nextStageName}`);

    // Trigger transition
    isTransitioning.current = true;
    narrativeTransition.setStage(nextStageName);
    setStage(nextStageName); // ✅ STRING stage name to store
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
  }, [currentStage, setStage]);

  const prevStage = useCallback(() => {
    if (isTransitioning.current) return false;

    const prevStageName = stageUtils.getPrevStage(currentStage);
    if (prevStageName === currentStage) return false; // Already at first stage

    console.log(`🎬 Previous: ${currentStage} → ${prevStageName}`);

    isTransitioning.current = true;
    narrativeTransition.setStage(prevStageName);
    setStage(prevStageName); // ✅ STRING stage name to store
    stageStartTime.current = Date.now();

    clearAutoAdvance();
    triggerStageEvents(prevStageName);

    setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
    return true;
  }, [currentStage, setStage]);

  const jumpToStage = useCallback(
    targetStage => {
      if (isTransitioning.current) return false;
      if (!stageUtils.isValidStage(targetStage)) {
        console.warn(`[Navigation] Invalid stage: ${targetStage}`);
        return false;
      }
      if (targetStage === currentStage) return false;

      console.log(`🎬 Jump: ${currentStage} → ${targetStage}`);

      isTransitioning.current = true;
      narrativeTransition.setStage(targetStage);
      setStage(targetStage); // ✅ STRING stage name to store
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
    [currentStage, setStage]
  );

  // ✅ AUTO-ADVANCE FUNCTIONALITY

  const scheduleAutoAdvance = useCallback(
    stageName => {
      clearAutoAdvance();

      const advanceTime = STAGE_METADATA.autoAdvanceTiming[stageName];
      if (advanceTime && stageUtils.canAdvance(stageName)) {
        transitionTimeoutRef.current = setTimeout(() => {
          nextStage();
        }, advanceTime);

        console.log(`⏰ Auto-advance scheduled for ${stageName}: ${advanceTime}ms`);
      }
    },
    [nextStage]
  );

  const clearAutoAdvance = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

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

  // ✅ STAGE EVENT SYSTEM

  const triggerStageEvents = useCallback(
    stageName => {
      // Trigger once-only events
      if (!stageReached.current[stageName]) {
        stageReached.current[stageName] = true;

        switch (stageName) {
          case 'silent':
            console.log('🎖️ Narrative Event: Marine discipline foundation');
            if (isStageFeatureEnabled('disciplineEffects')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'disciplineActivated', stage: 'silent' },
                })
              );
            }
            break;

          case 'awakening':
            console.log('🤖 Narrative Event: AI partnership begins');
            if (isStageFeatureEnabled('metacurtisEmergence')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'metacurtisAwakening', stage: 'awakening' },
                })
              );
            }
            break;

          case 'acceleration':
            console.log('🚀 Narrative Event: Development acceleration');
            if (isStageFeatureEnabled('accelerationEffects')) {
              window.dispatchEvent(
                new CustomEvent('narrativeEvent', {
                  detail: { type: 'accelerationActivated', stage: 'acceleration' },
                })
              );
            }
            break;

          case 'transcendence':
            console.log('⚡ Narrative Event: GLSL transcendence achieved');
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

  // ✅ UI HELPER FUNCTIONS (Replaces StageNavigation functionality)

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
      onClick: () => jumpToStage(stageName),
    }));
  }, [currentStage, jumpToStage]);

  // ✅ KEYBOARD NAVIGATION

  useEffect(() => {
    const handleKeyDown = event => {
      let handled = false;

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          handled = nextStage();
          break;

        case 'ArrowLeft':
          handled = prevStage();
          break;

        case 'Home':
          handled = jumpToStage(STAGE_METADATA.firstStage);
          break;

        case 'End':
          handled = jumpToStage(STAGE_METADATA.lastStage);
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
        if (event.ctrlKey && event.key >= '0' && event.key <= '4') {
          const targetIndex = parseInt(event.key);
          const targetStage = stageUtils.indexToStage(targetIndex);
          handled = jumpToStage(targetStage);
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
    nextStage,
    prevStage,
    jumpToStage,
    toggleAutoAdvance,
    getNavigationState,
    getNarrativeSnapshot,
  ]);

  // ✅ INITIALIZATION & INTEGRITY CHECK

  useEffect(() => {
    console.log('🎭 Consolidated Navigation Controller: Initializing...');

    // ✅ STAGE INTEGRITY CHECK
    const isValid = validateStageIntegrity(NARRATIVE_PRESETS);
    if (!isValid) {
      console.error('❌ Stage integrity check failed - navigation may not work correctly');
    }

    // Initialize with first stage if not already set
    if (!stageUtils.isValidStage(currentStage)) {
      console.log(`🔧 Invalid current stage "${currentStage}", initializing to genesis`);
      jumpToStage('genesis');
    } else {
      console.log(`✅ Navigation initialized at stage: ${currentStage}`);
      stageStartTime.current = Date.now();
      triggerStageEvents(currentStage);
    }

    return () => {
      clearAutoAdvance();
    };
  }, [currentStage, jumpToStage, triggerStageEvents, clearAutoAdvance]);

  // ✅ GLOBAL API EXPOSURE (For UI components and external systems)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.narrativeNavigation = {
        // Core navigation
        nextStage,
        prevStage,
        jumpToStage,

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
    nextStage,
    prevStage,
    jumpToStage,
    toggleAutoAdvance,
    getNavigationState,
    getStageButtonData,
  ]);

  // This component doesn't render anything - pure logic
  return null;
}

// ✅ EXPORT UTILITIES FOR EXTERNAL USE

export const navigationUtils = {
  // These will be overridden by the running controller
  nextStage: () => console.warn('NavigationController not initialized'),
  prevStage: () => console.warn('NavigationController not initialized'),
  jumpToStage: () => console.warn('NavigationController not initialized'),

  // Static utilities (always available)
  stageOrder: MC3V_STAGE_ORDER,
  stageLabels: STAGE_METADATA.stageLabels,
  isValidStage: stageUtils.isValidStage,
  getStageInfo: stageUtils.getStageInfo,
  getAllStagesInfo: stageUtils.getAllStagesInfo,
};
