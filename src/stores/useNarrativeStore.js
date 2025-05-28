// src/stores/useNarrativeStore.js
// COMPLETE VERSION - Full narrative system with all features
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const MAX_EVENT_HISTORY = 20;
const TRANSITION_THROTTLE_MS = 2000;

const initialState = {
  // Current narrative state
  currentMood: 'heroIntro',
  currentSection: '',
  previousMood: 'heroIntro',

  // Transition state
  isTransitioning: false,
  transitionProgress: 0,
  lastTransitionTime: 0,

  // Event tracking
  eventHistory: [],

  // Mood interpolation
  moodTransition: {
    from: null,
    to: null,
    startTime: 0,
    duration: 1000,
  },
};

// Mood configurations
const MOOD_CONFIGS = {
  heroIntro: {
    baseColor: [0.3, 0.6, 1.0], // Blue
    accentColor: [1.0, 0.4, 0.8], // Pink
    speed: 1.0,
    turbulence: 0.8,
    flowDirection: [0.0, 0.0],
  },
  narrativeCalm: {
    baseColor: [0.2, 0.8, 0.4], // Green
    accentColor: [0.6, 1.0, 0.8], // Light green
    speed: 0.7,
    turbulence: 0.5,
    flowDirection: [0.1, -0.05],
  },
  narrativeExcited: {
    baseColor: [1.0, 0.3, 0.2], // Red
    accentColor: [1.0, 0.7, 0.3], // Orange
    speed: 1.5,
    turbulence: 1.2,
    flowDirection: [0.3, 0.2],
  },
  narrativeMystery: {
    baseColor: [0.5, 0.2, 0.8], // Purple
    accentColor: [0.8, 0.4, 1.0], // Light purple
    speed: 0.8,
    turbulence: 0.9,
    flowDirection: [-0.1, 0.15],
  },
  narrativeTriumph: {
    baseColor: [1.0, 0.8, 0.2], // Gold
    accentColor: [1.0, 1.0, 0.6], // Light gold
    speed: 1.3,
    turbulence: 1.0,
    flowDirection: [0.2, 0.3],
  },
};

export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Mood management
    setMood: newMood => {
      const state = get();
      const now = performance.now();

      // Throttle rapid mood changes
      if (now - state.lastTransitionTime < TRANSITION_THROTTLE_MS) {
        console.log('NarrativeStore: Mood change throttled');
        return;
      }

      if (newMood === state.currentMood) return;

      console.log(`NarrativeStore: Transitioning mood from ${state.currentMood} to ${newMood}`);

      set({
        previousMood: state.currentMood,
        currentMood: newMood,
        isTransitioning: true,
        lastTransitionTime: now,
        moodTransition: {
          from: MOOD_CONFIGS[state.currentMood],
          to: MOOD_CONFIGS[newMood],
          startTime: now,
          duration: 1000,
        },
        eventHistory: [
          ...state.eventHistory.slice(-MAX_EVENT_HISTORY + 1),
          {
            type: 'moodChange',
            from: state.currentMood,
            to: newMood,
            timestamp: now,
          },
        ],
      });

      // Auto-complete transition after duration
      setTimeout(() => {
        const currentState = get();
        if (currentState.isTransitioning) {
          set({ isTransitioning: false, transitionProgress: 1 });
        }
      }, 1000);
    },

    // Section management
    setCurrentSection: section => {
      const state = get();
      console.log(`NarrativeStore: Setting current section to: ${section}`);

      set({
        currentSection: section,
        eventHistory: [
          ...state.eventHistory.slice(-MAX_EVENT_HISTORY + 1),
          {
            type: 'sectionChange',
            section: section,
            timestamp: performance.now(),
          },
        ],
      });
    },

    // Get current mood configuration
    getCurrentMoodConfig: () => {
      const state = get();
      return MOOD_CONFIGS[state.currentMood] || MOOD_CONFIGS.heroIntro;
    },

    // Get interpolated mood config during transitions
    getInterpolatedMoodConfig: () => {
      const state = get();

      if (!state.isTransitioning || !state.moodTransition.from || !state.moodTransition.to) {
        return state.getCurrentMoodConfig();
      }

      const elapsed = performance.now() - state.moodTransition.startTime;
      const progress = Math.min(elapsed / state.moodTransition.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      const from = state.moodTransition.from;
      const to = state.moodTransition.to;

      // Interpolate all properties
      return {
        baseColor: [
          from.baseColor[0] + (to.baseColor[0] - from.baseColor[0]) * eased,
          from.baseColor[1] + (to.baseColor[1] - from.baseColor[1]) * eased,
          from.baseColor[2] + (to.baseColor[2] - from.baseColor[2]) * eased,
        ],
        accentColor: [
          from.accentColor[0] + (to.accentColor[0] - from.accentColor[0]) * eased,
          from.accentColor[1] + (to.accentColor[1] - from.accentColor[1]) * eased,
          from.accentColor[2] + (to.accentColor[2] - from.accentColor[2]) * eased,
        ],
        speed: from.speed + (to.speed - from.speed) * eased,
        turbulence: from.turbulence + (to.turbulence - from.turbulence) * eased,
        flowDirection: [
          from.flowDirection[0] + (to.flowDirection[0] - from.flowDirection[0]) * eased,
          from.flowDirection[1] + (to.flowDirection[1] - from.flowDirection[1]) * eased,
        ],
      };
    },

    // Update transition progress
    updateTransition: () => {
      const state = get();
      if (!state.isTransitioning) return;

      const elapsed = performance.now() - state.moodTransition.startTime;
      const progress = Math.min(elapsed / state.moodTransition.duration, 1);

      set({ transitionProgress: progress });

      if (progress >= 1) {
        set({ isTransitioning: false });
      }
    },

    // Get available moods
    getAvailableModds: () => Object.keys(MOOD_CONFIGS),

    // Reset state
    reset: () => set(initialState),

    // Debug helpers
    getDebugInfo: () => {
      const state = get();
      return {
        currentMood: state.currentMood,
        currentSection: state.currentSection,
        isTransitioning: state.isTransitioning,
        transitionProgress: state.transitionProgress,
        eventHistoryCount: state.eventHistory.length,
        lastEvents: state.eventHistory.slice(-5),
      };
    },
  }))
);
