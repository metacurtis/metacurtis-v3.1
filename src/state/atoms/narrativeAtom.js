// src/state/atoms/narrativeAtom.js
// SST v3.0 - Complete narrative state management
import { createAtom } from './createAtom';
import stageAtom from './stageAtom.js';

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

const warnedDeprecations = new Set();
const warnDeprecated = (method, replacement) => {
  if (!import.meta?.env?.DEV) return;
  const key = `${method}:${replacement}`;
  if (warnedDeprecations.has(key)) return;
  warnedDeprecations.add(key);
  console.warn(
    `[narrativeAtom] Deprecated ${method}() call. Use ${replacement}() as canonical stage/progress authority.`
  );
};

const blockDeprecatedWriter = (method, replacement) => {
  const message =
    `[narrativeAtom] Forbidden ${method}() call. Use ${replacement}() as canonical authority.`;
  if (import.meta?.env?.DEV) {
    const error = new Error(message);
    console.error(message, { replacement, stack: error.stack });
    throw error;
  }
  const key = `blocked:${method}:${replacement}`;
  if (!warnedDeprecations.has(key)) {
    warnedDeprecations.add(key);
    console.warn(`${message} No-op in production.`);
  }
  return undefined;
};

export const narrativeAtom = createAtom(initialState, (get, set) => ({
  // ===== STAGE NAVIGATION =====
  jumpToStage: _stage => {
    return blockDeprecatedWriter('jumpToStage', 'stateCommands.setStage');
  },

  nextStage: () => {
    warnDeprecated('nextStage', 'stageAtom.nextStage');
    stageAtom.nextStage?.();
  },

  prevStage: () => {
    warnDeprecated('prevStage', 'stageAtom.prevStage');
    stageAtom.prevStage?.();
  },

  setStage: _stageIndex => {
    return blockDeprecatedWriter('setStage', 'stateCommands.setStage');
  },

  // ===== PROGRESS MANAGEMENT =====
  setGlobalProgress: _progress => {
    return blockDeprecatedWriter('setGlobalProgress', 'stateCommands.setScrollProgress');
  },

  setScrollProgress: _progress => {
    return blockDeprecatedWriter('setScrollProgress', 'stateCommands.setScrollProgress');
  },

  setMorphProgress: progress => {
    set(state => ({
      ...state,
      morphProgress: Math.max(0, Math.min(1, progress)),
    }));
  },

  setNarrativeProgress: _progress => {
    return blockDeprecatedWriter('setNarrativeProgress', 'stateCommands.setScrollProgress');
  },

  // Mirror-only sync methods from canonical stage authority.
  syncStageFromAuthority: stage => {
    if (!STAGE_ORDER.includes(stage)) return;
    set(state => ({
      ...state,
      currentStage: stage,
      isTransitioning: false,
      stageStartTime: Date.now(),
      timeInStage: 0,
      stagesVisited: [...new Set([...state.stagesVisited, stage])],
      userEngagement: {
        ...state.userEngagement,
        stagesVisited: [...new Set([...state.userEngagement.stagesVisited, stage])],
      },
    }));
  },

  syncProgressFromAuthority: ({ globalProgress, scrollProgress, morphProgress } = {}) => {
    set(state => ({
      ...state,
      ...(Number.isFinite(globalProgress)
        ? { globalProgress: Math.max(0, Math.min(1, globalProgress)) }
        : {}),
      ...(Number.isFinite(scrollProgress)
        ? { scrollProgress: Math.max(0, Math.min(1, scrollProgress)) }
        : {}),
      ...(Number.isFinite(morphProgress)
        ? { morphProgress: Math.max(0, Math.min(1, morphProgress)) }
        : {}),
    }));
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
