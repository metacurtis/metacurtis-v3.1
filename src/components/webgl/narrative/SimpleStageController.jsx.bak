// src/components/webgl/narrative/SimpleStageController.jsx
// OPTIMIZED STAGE CONTROLLER - Canonical stages + shallow selectors + dev-only controllers
// Works with your existing performanceStore + performance optimizations

import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import usePerformanceStore from '@/stores/performanceStore';
import {
  mapStageToNumeric,
  getStageParticleConfig,
  getAllStageNames,
  getKeyboardShortcuts,
  getNextStage,
  getPrevStage,
} from '@/utils/narrative/stageMappingUtils';

export default function SimpleStageController() {
  // ✅ FIX: Separate data (shallow) from actions (stable)
  const narrative = usePerformanceStore(
    s => s.narrative,
    shallow // Only compare narrative data
  );

  // ✅ FIX: Get actions separately (these should be stable references)
  const setCurrentStage = usePerformanceStore(s => s.setCurrentStage);
  const setNarrativeProgress = usePerformanceStore(s => s.setNarrativeProgress);
  const setTransitionActive = usePerformanceStore(s => s.setTransitionActive);

  const lastStageRef = useRef(narrative.currentStage);

  // Track stage changes for debugging
  useEffect(() => {
    if (narrative.currentStage !== lastStageRef.current) {
      const numericStage = mapStageToNumeric(narrative.currentStage);
      const stageConfig = getStageParticleConfig(narrative.currentStage, narrative.progress);

      console.log(
        `🎬 MILESTONE 1.1.1 Stage Change: ${lastStageRef.current} → ${narrative.currentStage} (${numericStage})`,
        `${stageConfig.particles} particles, Progress: ${Math.round(narrative.progress * 100)}%`
      );

      lastStageRef.current = narrative.currentStage;
    }
  }, [narrative.currentStage, narrative.progress]);

  // ✅ OPTIMIZATION 3: Dev-only controllers (tree-shaken in production)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // ✅ OPTIMIZATION 1: Use canonical stages array
    const keyboardShortcuts = getKeyboardShortcuts();
    const stageNames = getAllStageNames();

    const handleKeyDown = event => {
      // Ctrl+0-5: Jump to specific stages (derived from canonical array)
      if (event.ctrlKey && keyboardShortcuts[event.key]) {
        const stageName = keyboardShortcuts[event.key];
        const stageIndex = mapStageToNumeric(stageName);

        console.log(
          `🎮 MILESTONE 1.1.1 Dev shortcut: Jumping to stage ${stageIndex} (${stageName})`
        );

        setCurrentStage(stageName);
        setNarrativeProgress(stageIndex / (stageNames.length - 1)); // Normalize to 0-1
        setTransitionActive(true);

        // Clear transition after 2 seconds
        setTimeout(() => setTransitionActive(false), 2000);

        event.preventDefault();
      }

      // Ctrl+Shift+S: Show current state
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        const numericStage = mapStageToNumeric(narrative.currentStage);
        console.log('📊 MILESTONE 1.1.1 Current Narrative State:', {
          stage: `${narrative.currentStage} (${numericStage})`,
          progress: `${Math.round(narrative.progress * 100)}%`,
          transitioning: narrative.transitionActive,
        });
        event.preventDefault();
      }

      // Ctrl+Shift+N: Cycle to next stage (using canonical array)
      if (event.ctrlKey && event.shiftKey && event.key === 'N') {
        const nextStage = getNextStage(narrative.currentStage);
        const nextIndex = mapStageToNumeric(nextStage);

        console.log(`🎮 MILESTONE 1.1.1 Next stage: ${narrative.currentStage} → ${nextStage}`);

        setCurrentStage(nextStage);
        setNarrativeProgress(nextIndex / (stageNames.length - 1));
        setTransitionActive(true);

        setTimeout(() => setTransitionActive(false), 2000);

        event.preventDefault();
      }

      // Ctrl+Shift+P: Cycle to previous stage (using canonical array)
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        const prevStage = getPrevStage(narrative.currentStage);
        const prevIndex = mapStageToNumeric(prevStage);

        console.log(`🎮 MILESTONE 1.1.1 Previous stage: ${narrative.currentStage} → ${prevStage}`);

        setCurrentStage(prevStage);
        setNarrativeProgress(prevIndex / (stageNames.length - 1));
        setTransitionActive(true);

        setTimeout(() => setTransitionActive(false), 2000);

        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [narrative, setCurrentStage, setNarrativeProgress, setTransitionActive]);

  // ✅ OPTIMIZATION 3: Auto-progression demo (dev-only, tree-shaken in production)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // ✅ OPTIMIZATION 1: Use canonical stages array
    const stageNames = getAllStageNames();
    let autoProgressInterval;

    const handleKeyDown = event => {
      // Ctrl+Shift+A: Auto-progression demo
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        console.log('🚀 MILESTONE 1.1.1 Starting auto-progression demo...');

        let currentIndex = 0;

        autoProgressInterval = setInterval(() => {
          const stage = stageNames[currentIndex];
          console.log(`🎬 Auto-demo: Stage ${currentIndex} (${stage})`);

          setCurrentStage(stage);
          setNarrativeProgress(currentIndex / (stageNames.length - 1));
          setTransitionActive(true);

          setTimeout(() => setTransitionActive(false), 1000);

          currentIndex = (currentIndex + 1) % stageNames.length;

          if (currentIndex === 0) {
            console.log('🎬 Auto-demo complete, cycling...');
          }
        }, 3000);

        event.preventDefault();
      }

      // Ctrl+Shift+X: Stop auto-progression
      if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        if (autoProgressInterval) {
          clearInterval(autoProgressInterval);
          autoProgressInterval = null;
          console.log('🛑 MILESTONE 1.1.1 Auto-progression stopped');
        }
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoProgressInterval) {
        clearInterval(autoProgressInterval);
      }
    };
  }, [setCurrentStage, setNarrativeProgress, setTransitionActive]);

  // This component doesn't render anything - it's just for logic
  return null;
}

// ✅ OPTIMIZATION 1: Export utility functions using canonical stages array
export const stageControls = {
  // Jump to a specific stage
  jumpToStage: stageName => {
    const stageNames = getAllStageNames();
    const index = stageNames.indexOf(stageName);

    if (index === -1) {
      console.warn(`[StageControls] Unknown stage: ${stageName}`);
      return false;
    }

    const store = usePerformanceStore.getState();
    store.setCurrentStage(stageName);
    store.setNarrativeProgress(index / (stageNames.length - 1));
    store.setTransitionActive(true);

    setTimeout(() => store.setTransitionActive(false), 2000);

    console.log(`🎬 StageControls: Jumped to ${stageName} (${index})`);
    return true;
  },

  // Animate to next stage
  nextStage: () => {
    const store = usePerformanceStore.getState();
    const nextStage = getNextStage(store.narrative.currentStage);
    return stageControls.jumpToStage(nextStage);
  },

  // Animate to previous stage
  prevStage: () => {
    const store = usePerformanceStore.getState();
    const prevStage = getPrevStage(store.narrative.currentStage);
    return stageControls.jumpToStage(prevStage);
  },

  // Get current stage info
  getCurrentStageInfo: () => {
    const store = usePerformanceStore.getState();
    const numericStage = mapStageToNumeric(store.narrative.currentStage);
    const stageConfig = getStageParticleConfig(
      store.narrative.currentStage,
      store.narrative.progress
    );

    return {
      stageName: store.narrative.currentStage,
      numericStage,
      progress: store.narrative.progress,
      transitioning: store.narrative.transitionActive,
      config: stageConfig,
    };
  },
};
