// src/stores/narrativeStore.js
//
// ➤  Combines the tiny “stage / fragment” API we added yesterday
//    with your advanced mood-preset transition logic.
// ➤  Exposes *both* paradigms so existing UI or future modules can
//    use whichever they prefer without refactor.
//

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import {
  NARRATIVE_PRESETS,
  getPreset as getNarrativePresetConfig,
  interpolatePresets as interpolateNarrativePresets,
} from '@/config/narrativeParticleConfig';

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────
const DEFAULT_TRANSITION_DURATION = 2000; // ms
const FALLBACK_PRESET_KEY = 'heroIntro'; // always exists

const fallbackPreset = getNarrativePresetConfig(FALLBACK_PRESET_KEY);
if (!fallbackPreset) {
  // Hard crash now: if this fails the rest of the app can’t run sensibly.
  throw new Error(
    `[NarrativeStore] FATAL: Preset “${FALLBACK_PRESET_KEY}” not found in narrativeParticleConfig.`
  );
}

// ────────────────────────────────────────────────────────────
// INITIAL STATE
// ────────────────────────────────────────────────────────────
const initialState = {
  /* — legacy mood / preset engine — */
  currentMood: FALLBACK_PRESET_KEY,
  currentDisplayPreset: fallbackPreset,
  isTransitioning: false,
  transitionProgress: 0,
  moodTransitionInternal: {
    fromPreset: fallbackPreset,
    toPreset: fallbackPreset,
    startTime: 0,
    duration: fallbackPreset.transitionDuration || DEFAULT_TRANSITION_DURATION,
  },
  lastTransitionTime: 0,

  /* — lightweight “stage-only” API for new UI — */
  currentStage: FALLBACK_PRESET_KEY, // alias of currentMood
  scrollProgress: 0,
  memoryFragmentId: null,

  /* — misc — */
  currentSection: '',
  eventHistory: [],
};

// ────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────
export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ────────   HIGH-LEVEL “STAGE” API   ────────
    setStage: stageName => get().setMood(stageName),
    setScrollProgress: p => set({ scrollProgress: Math.max(0, Math.min(1, p)) }),
    revealFragment: id => set({ memoryFragmentId: id }),
    clearFragment: () => set({ memoryFragmentId: null }),

    // ────────   ORIGINAL MOOD / PRESET ENGINE   ────────
    setMood: (newMoodName, transitionOpts = {}) => {
      const state = get();
      const now = performance.now();

      // throttle consecutive transitions
      const throttle =
        state.currentDisplayPreset?.transitionDuration || DEFAULT_TRANSITION_DURATION;
      if (state.isTransitioning && now - state.lastTransitionTime < throttle) return;

      // same mood? do nothing
      if (newMoodName === state.currentMood && !state.isTransitioning) return;

      const targetPreset = getNarrativePresetConfig(newMoodName);
      if (!targetPreset) {
        console.error(`[NarrativeStore] Unknown mood “${newMoodName}”. Reverting to fallback.`);
        return get().setMood(FALLBACK_PRESET_KEY);
      }

      const fromPreset = state.isTransitioning
        ? state.moodTransitionInternal.toPreset
        : state.currentDisplayPreset;

      set({
        currentMood: newMoodName,
        currentStage: newMoodName, // keep alias in-sync
        isTransitioning: true,
        transitionProgress: 0,
        lastTransitionTime: now,
        moodTransitionInternal: {
          fromPreset,
          toPreset: targetPreset,
          startTime: now,
          duration:
            transitionOpts.duration ??
            targetPreset.transitionDuration ??
            DEFAULT_TRANSITION_DURATION,
        },
      });
    },

    updateTransition: currentTimeMs => {
      const state = get();
      if (!state.isTransitioning) {
        // make sure displayPreset is correct when idle
        const staticPreset = getNarrativePresetConfig(state.currentMood);
        if (staticPreset && staticPreset !== state.currentDisplayPreset) {
          set({ currentDisplayPreset: staticPreset, transitionProgress: 0 });
        }
        return;
      }

      const elapsed = currentTimeMs - state.moodTransitionInternal.startTime;
      const progress = Math.min(elapsed / state.moodTransitionInternal.duration, 1);

      const interpolated = interpolateNarrativePresets(
        state.moodTransitionInternal.fromPreset,
        state.moodTransitionInternal.toPreset,
        progress
      );

      set({
        currentDisplayPreset: interpolated,
        transitionProgress: progress,
      });

      if (progress >= 1) {
        set({
          isTransitioning: false,
          currentDisplayPreset: state.moodTransitionInternal.toPreset,
          transitionProgress: 1,
        });
      }
    },

    /* optional helpers / debug */
    reset: () => set(initialState),
    getDebugInfo: () => {
      const s = get();
      return {
        mood: s.currentMood,
        stage: s.currentStage,
        transitioning: s.isTransitioning,
        progress: +s.transitionProgress.toFixed(3),
        preset: s.currentDisplayPreset?.name,
      };
    },
  }))
);

// quick console confirmation in dev
if (import.meta.env.DEV) {
  console.log('[NarrativeStore] initialised →', useNarrativeStore.getState().getDebugInfo());
}
