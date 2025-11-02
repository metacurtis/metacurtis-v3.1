// src/state/atoms/narrativeAtom.js
/**
 * PHASE 2 MIGRATION NOTICE:
 *
 * Navigation methods removed from narrativeAtom:
 * - jumpToStage() → Use window.unifiedNav.navigateToStage()
 * - nextStage()   → Use window.unifiedNav.nextStage()
 * - prevStage()   → Use window.unifiedNav.prevStage()
 *
 * Reason: Single-writer pattern enforcement (SST v3.5)
 *
 * narrativeAtom now only manages narrative state (progress, fragments, etc.)
 * Navigation state is managed by stageAtom through UnifiedNavigationAPI.
 */
// SST v3.0 - Complete narrative state management
import { createAtom } from './createAtom';

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
  // PHASE 2: Removed - use UnifiedNavigationAPI instead
  jumpToStage: () => {
    throw new Error(
      '❌ narrativeAtom.jumpToStage removed in Phase 2\n' +
        '   Use: window.unifiedNav.navigateToStage(stage) instead\n' +
        '   Reason: Single-writer pattern enforcement\n' +
        '   Authority: SST v3.5 navigation.singleWriter'
    );
  },

  // PHASE 2: Removed - use UnifiedNavigationAPI instead
  nextStage: () => {
    throw new Error(
      '❌ narrativeAtom.nextStage removed in Phase 2\n' +
        '   Use: window.unifiedNav.nextStage() instead\n' +
        '   Reason: Single-writer pattern enforcement\n' +
        '   Authority: SST v3.5 navigation.singleWriter'
    );
  },

  // PHASE 2: Removed - use UnifiedNavigationAPI instead
  prevStage: () => {
    throw new Error(
      '❌ narrativeAtom.prevStage removed in Phase 2\n' +
        '   Use: window.unifiedNav.prevStage() instead\n' +
        '   Reason: Single-writer pattern enforcement\n' +
        '   Authority: SST v3.5 navigation.singleWriter'
    );
  },

  // PHASE 2: Only updates local state, does not navigate
  setStage: stageIndex => {
    const stage = STAGE_ORDER[stageIndex] || STAGE_ORDER[0];

    set(state => ({ ...state, currentStage: stage }));

    console.log('📝 [narrativeAtom] Stage state updated (no navigation)', {
      stage,
      note: 'Use UnifiedNavigationAPI for actual navigation',
    });
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
