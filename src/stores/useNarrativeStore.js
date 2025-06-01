// src/stores/useNarrativeStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  NARRATIVE_PRESETS,
  getPreset as getNarrativePresetConfig,
  interpolatePresets as interpolateNarrativePresets,
} from '@/config/narrativeParticleConfig.js'; // Ensure this path is correct

// DEBUG LOG ADDED: Log imported NARRATIVE_PRESETS and the function to check them
console.log(
  '[NarrativeStore] DIAGNOSTIC - Imported NARRATIVE_PRESETS keys:',
  Object.keys(NARRATIVE_PRESETS)
);
console.log(
  '[NarrativeStore] DIAGNOSTIC - Result of getNarrativePresetConfig("heroIntro"):',
  getNarrativePresetConfig('heroIntro')
);

const DEFAULT_TRANSITION_DURATION = 2000;

const initialHeroPreset = getNarrativePresetConfig('heroIntro');

// DEBUG LOG ADDED: Log the preset that's about to be used for initial state
console.log(
  '[NarrativeStore] Initial heroPreset determined for initialState:',
  initialHeroPreset
    ? { name: initialHeroPreset.name, baseSize: initialHeroPreset.baseSize }
    : 'UNDEFINED'
);
if (!initialHeroPreset) {
  console.error(
    '[NarrativeStore] CRITICAL FAILURE: initialHeroPreset is UNDEFINED. Check NARRATIVE_PRESETS export and "heroIntro" key in narrativeParticleConfig.js'
  );
}

const initialState = {
  currentMood: 'heroIntro',
  currentDisplayPreset: initialHeroPreset, // This should now correctly hold the heroIntro object

  isTransitioning: false,
  transitionProgress: 0,

  moodTransitionInternal: {
    fromPreset: initialHeroPreset,
    toPreset: initialHeroPreset,
    startTime: 0,
    duration: initialHeroPreset?.transitionDuration || DEFAULT_TRANSITION_DURATION,
  },

  currentSection: '',
  eventHistory: [],
  lastTransitionTime: 0,
};

export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setMood: (newMoodName, transitionOptions = {}) => {
      const state = get();
      const now = performance.now();

      const transitionThrottleMs =
        state.currentDisplayPreset?.transitionDuration || DEFAULT_TRANSITION_DURATION;
      if (now - state.lastTransitionTime < transitionThrottleMs && state.isTransitioning) {
        console.warn(`[NarrativeStore] Mood change to "${newMoodName}" throttled.`);
        return;
      }

      if (newMoodName === state.currentMood && !state.isTransitioning) {
        console.log(`[NarrativeStore] Already in mood "${newMoodName}".`);
        return;
      }

      const targetPreset = getNarrativePresetConfig(newMoodName);
      if (!targetPreset) {
        console.error(
          `[NarrativeStore] Preset for "${newMoodName}" not found. Reverting to heroIntro.`
        );
        if (newMoodName !== 'heroIntro') get().setMood('heroIntro');
        return;
      }

      console.log(
        `[NarrativeStore] Initiating transition from "${state.currentMood}" to "${newMoodName}". Target baseSize: ${targetPreset.baseSize}`
      );

      const effectiveFromPreset = state.isTransitioning
        ? state.moodTransitionInternal.toPreset
        : state.currentDisplayPreset;

      set({
        currentMood: newMoodName,
        isTransitioning: true,
        transitionProgress: 0,
        lastTransitionTime: now,
        moodTransitionInternal: {
          fromPreset: effectiveFromPreset,
          toPreset: targetPreset,
          startTime: now,
          duration:
            transitionOptions.duration ||
            targetPreset.transitionDuration ||
            DEFAULT_TRANSITION_DURATION,
        },
        // ... (eventHistory update)
      });
    },

    updateTransition: currentTime => {
      const state = get();
      if (!state.isTransitioning) {
        const targetPreset = getNarrativePresetConfig(state.currentMood);
        // Ensure currentDisplayPreset is the static target if not transitioning
        if (targetPreset && state.currentDisplayPreset?.name !== targetPreset.name) {
          // DEBUG LOG ADDED: Clarify when static preset is applied
          console.log(
            `[NarrativeStore] updateTransition: Not transitioning. Ensuring currentDisplayPreset is static target: ${targetPreset.name}`
          );
          set({ currentDisplayPreset: targetPreset, transitionProgress: 0 }); // Ensure progress is 0 or 1 if not transitioning
        }
        return;
      }

      const elapsed = currentTime - state.moodTransitionInternal.startTime;
      let progress = Math.min(elapsed / state.moodTransitionInternal.duration, 1.0);

      const interpolatedPreset = interpolateNarrativePresets(
        state.moodTransitionInternal.fromPreset,
        state.moodTransitionInternal.toPreset,
        progress
      );

      // DEBUG LOG ADDED: Log interpolated preset details during transition
      // This log can be very verbose, enable if needed or make it conditional
      // console.log(`[NarrativeStore] updateTransition: Progress: ${progress.toFixed(3)}, Interpolated baseSize: ${interpolatedPreset.baseSize.toFixed(3)}`);

      set({
        currentDisplayPreset: interpolatedPreset,
        transitionProgress: progress,
      });

      if (progress >= 1.0) {
        console.log(
          `[NarrativeStore] Transition to "${state.currentMood}" complete. Final baseSize: ${state.moodTransitionInternal.toPreset.baseSize}`
        );
        set({
          isTransitioning: false,
          currentDisplayPreset: state.moodTransitionInternal.toPreset,
          transitionProgress: 1.0,
        });
      }
    },

    // ... (setCurrentSection, getAvailableMoods - kept as you provided) ...
    setCurrentSection: _section =>
      set(() => ({
        /* … */
      })),
    getAvailableMoods: () => Object.keys(NARRATIVE_PRESETS),

    reset: () => {
      const resetHeroPreset = getNarrativePresetConfig('heroIntro');
      console.log(
        '[NarrativeStore] Resetting store. Initial hero preset for reset:',
        resetHeroPreset
          ? { name: resetHeroPreset.name, baseSize: resetHeroPreset.baseSize }
          : 'UNDEFINED'
      );
      if (!resetHeroPreset) {
        console.error('[NarrativeStore] CRITICAL: heroIntro preset UNDEFINED during reset!');
      }
      const trulyInitialState = {
        currentMood: 'heroIntro',
        currentDisplayPreset: resetHeroPreset || NARRATIVE_PRESETS.heroIntro, // Fallback just in case
        isTransitioning: false,
        transitionProgress: 0,
        moodTransitionInternal: {
          fromPreset: resetHeroPreset || NARRATIVE_PRESETS.heroIntro,
          toPreset: resetHeroPreset || NARRATIVE_PRESETS.heroIntro,
          startTime: 0,
          duration:
            (resetHeroPreset || NARRATIVE_PRESETS.heroIntro)?.transitionDuration ||
            DEFAULT_TRANSITION_DURATION,
        },
        currentSection: '',
        eventHistory: [],
        lastTransitionTime: 0,
      };
      set(trulyInitialState);
    },

    getDebugInfo: () => {
      // ... (your enhanced getDebugInfo - kept as you provided) ...
      const state = get();
      return {
        currentMoodString: state.currentMood,
        isTransitioning: state.isTransitioning,
        transitionProgress: state.transitionProgress,
        currentDisplayPresetName: state.currentDisplayPreset?.name,
        currentDisplayPresetBaseSize: state.currentDisplayPreset?.baseSize,
        fromPresetName: state.moodTransitionInternal?.fromPreset?.name,
        toPresetName: state.moodTransitionInternal?.toPreset?.name,
        transitionDuration: state.moodTransitionInternal?.duration,
      };
    },
  }))
);

// DEBUG LOG ADDED: Log the store state immediately after its definition.
const finalInitialState = useNarrativeStore.getState();
console.log(
  '[NarrativeStore] STORE MODULE EXECUTED. Initial currentDisplayPreset from getState():',
  finalInitialState.currentDisplayPreset
    ? {
        name: finalInitialState.currentDisplayPreset.name,
        baseSize: finalInitialState.currentDisplayPreset.baseSize,
      }
    : 'UNDEFINED'
);
if (!finalInitialState.currentDisplayPreset) {
  console.error(
    '[NarrativeStore] CRITICAL FINAL CHECK: currentDisplayPreset is UNDEFINED after store module execution!'
  );
}
