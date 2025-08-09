// src/stores/atoms/narrativeAtom.js
// SST v3.0 - Complete narrative state management
import { createAtom } from './createAtom';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';

const initialState = {
  // Core narrative state
  currentStage: 'genesis',
  globalProgress: 0,
  morphProgress: 0,
  scrollProgress: 0,
  isTransitioning: false,

  // Stage progression
  stagesVisited: ['genesis'],
  stageStartTime: Date.now(),
  timeInStage: 0,

  // Memory fragments
  activeMemoryFragment: null,
  fragmentsExplored: [],
  fragmentStates: {},

  // User engagement metrics
  userEngagement: {
    hasScrolled: false,
    scrollVelocity: 0,
    timeOnPage: 0,
    stagesVisited: ['genesis'],
    fragmentsExplored: [],
    interactions: 0,
    completionRate: 0,
  },

  // Feature flags (stage-based unlocking)
  stageFeatures: {
    genesis: ['opening', 'terminalEffect'],
    discipline: ['memoryFragments', 'structureEffects'],
    neural: ['metacurtisEmergence', 'neuralEffects'],
    velocity: ['accelerationEffects', 'velocityParticles'],
    architecture: ['architectureVisualization', 'blueprintMode'],
    harmony: ['harmonyEffects', 'flowState'],
    transcendence: ['contactPortal', 'fullAIInteraction', 'galaxyEffect'],
  },

  // Narrative events (once-only triggers)
  narrativeEvents: {
    memoryFragmentsUnlocked: false,
    metacurtisAwakening: false,
    metacurtisVoiceActivated: false,
    fullConsciousness: false,
    contactPortalActivated: false,
    servicesTransition: false,
  },
};

// SST v3.0 stage order
const STAGE_ORDER = [
  'genesis',
  'discipline',
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence',
];

export const narrativeAtom = createAtom(initialState, (get, set) => ({
  // ===== STAGE NAVIGATION =====
  jumpToStage: stage => {
    if (!STAGE_ORDER.includes(stage)) {
      console.warn(`Invalid stage: ${stage}`);
      return;
    }

    const currentState = get();
    if (stage === currentState.currentStage) return;

    set(state => ({
      ...state,
      currentStage: stage,
      isTransitioning: true,
      stageStartTime: Date.now(),
      timeInStage: 0,
      stagesVisited: [...new Set([...state.stagesVisited, stage])],
      userEngagement: {
        ...state.userEngagement,
        stagesVisited: [...new Set([...state.userEngagement.stagesVisited, stage])],
      },
    }));

    // Clear transition flag after animation
    setTimeout(() => {
      set(state => ({ ...state, isTransitioning: false }));
    }, 500);

    // Dispatch stage change event
    window.dispatchEvent(
      new CustomEvent('sst:stageChange', {
        detail: { stage, previousStage: currentState.currentStage },
      })
    );
  },

  nextStage: () => {
    const current = get().currentStage;
    const currentIndex = STAGE_ORDER.indexOf(current);
    if (currentIndex < STAGE_ORDER.length - 1) {
      narrativeAtom.jumpToStage(STAGE_ORDER[currentIndex + 1]);
    }
  },

  prevStage: () => {
    const current = get().currentStage;
    const currentIndex = STAGE_ORDER.indexOf(current);
    if (currentIndex > 0) {
      narrativeAtom.jumpToStage(STAGE_ORDER[currentIndex - 1]);
    }
  },

  setStage: stageIndex => {
    const stage = STAGE_ORDER[stageIndex] || STAGE_ORDER[0];
    narrativeAtom.jumpToStage(stage);
  },

  // ===== PROGRESS MANAGEMENT =====
  setGlobalProgress: progress => {
    set(state => ({
      ...state,
      globalProgress: Math.max(0, Math.min(1, progress)),
    }));
  },

  setScrollProgress: progress => {
    set(state => ({
      ...state,
      scrollProgress: Math.max(0, Math.min(1, progress)),
    }));
  },

  setMorphProgress: progress => {
    set(state => ({
      ...state,
      morphProgress: Math.max(0, Math.min(1, progress)),
    }));
  },

  setNarrativeProgress: progress => {
    // Convenience method that sets all progress values
    narrativeAtom.setGlobalProgress(progress);
    narrativeAtom.setScrollProgress(progress);
  },

  // ===== MEMORY FRAGMENTS =====
  activateMemoryFragment: fragmentId => {
    set(state => ({
      ...state,
      activeMemoryFragment: fragmentId,
      fragmentStates: {
        ...state.fragmentStates,
        [fragmentId]: { state: 'active', timestamp: Date.now() },
      },
      userEngagement: {
        ...state.userEngagement,
        fragmentsExplored: [...new Set([...state.userEngagement.fragmentsExplored, fragmentId])],
      },
    }));

    // Dispatch fragment event
    window.dispatchEvent(
      new CustomEvent('sst:fragmentActivated', {
        detail: { fragmentId },
      })
    );
  },

  dismissMemoryFragment: () => {
    const activeId = get().activeMemoryFragment;
    if (activeId) {
      set(state => ({
        ...state,
        activeMemoryFragment: null,
        fragmentStates: {
          ...state.fragmentStates,
          [activeId]: { ...state.fragmentStates[activeId], state: 'dismissed' },
        },
      }));
    }
  },

  // ===== FEATURE FLAGS =====
  isStageFeatureEnabled: feature => {
    const state = get();
    const currentFeatures = state.stageFeatures[state.currentStage] || [];
    return currentFeatures.includes(feature);
  },

  getAllEnabledFeatures: () => {
    const state = get();
    return state.stageFeatures[state.currentStage] || [];
  },

  // ===== NARRATIVE EVENTS =====
  triggerNarrativeEvent: eventName => {
    const state = get();
    if (state.narrativeEvents[eventName] !== undefined && !state.narrativeEvents[eventName]) {
      set(state => ({
        ...state,
        narrativeEvents: {
          ...state.narrativeEvents,
          [eventName]: true,
        },
      }));

      // Dispatch custom event
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: { type: eventName, stage: state.currentStage },
        })
      );

      return true;
    }
    return false;
  },

  hasNarrativeEventFired: eventName => {
    return get().narrativeEvents[eventName] || false;
  },

  // ===== USER ENGAGEMENT =====
  updateEngagement: updates => {
    set(state => ({
      ...state,
      userEngagement: { ...state.userEngagement, ...updates },
    }));
  },

  trackUserEngagement: (action, data) => {
    set(state => ({
      ...state,
      userEngagement: {
        ...state.userEngagement,
        interactions: state.userEngagement.interactions + 1,
      },
    }));

    // Could dispatch to analytics here
    console.log(`📊 Engagement: ${action}`, data);
  },

  // ===== TIME TRACKING =====
  updateTimeInStage: () => {
    const state = get();
    const timeInStage = Date.now() - state.stageStartTime;
    set(state => ({ ...state, timeInStage }));
  },

  // ===== UTILITIES =====
  getNarrativeSnapshot: () => {
    const state = get();
    return {
      currentStage: state.currentStage,
      progress: {
        global: state.globalProgress,
        scroll: state.scrollProgress,
        morph: state.morphProgress,
      },
      engagement: state.userEngagement,
      features: state.stageFeatures[state.currentStage] || [],
      events: state.narrativeEvents,
    };
  },

  getCurrentStageIndex: () => {
    return STAGE_ORDER.indexOf(get().currentStage);
  },

  getStageOrder: () => STAGE_ORDER,

  reset: () => {
    set(initialState);
  },
}));

// Development helpers
if (import.meta.env.DEV) {
  window.narrativeAtom = narrativeAtom;
  console.log('🎭 narrativeAtom available at window.narrativeAtom');
}
