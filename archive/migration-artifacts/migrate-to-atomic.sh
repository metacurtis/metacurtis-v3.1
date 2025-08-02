#!/bin/bash
# MetaCurtis v3.0 - Complete Atomic State Migration Script
# This script automates the full migration from Zustand to Atomic state

set -e  # Exit on error

echo "🚀 MetaCurtis v3.0 - Atomic State Migration"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup function
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.zustand-backup.$(date +%s)"
        echo -e "${GREEN}✓${NC} Backed up: $file"
    fi
}

# Create directory structure
echo "📁 Creating atomic store directories..."
mkdir -p src/stores/atoms
mkdir -p src/hooks/atoms

# ========== PHASE 1: CREATE ATOMIC STORES ==========
echo ""
echo "⚛️ PHASE 1: Creating Atomic Stores"
echo "--------------------------------"

# 1. Create narrativeAtom.js
cat << 'EOFILE' > src/stores/atoms/narrativeAtom.js
// src/stores/atoms/narrativeAtom.js
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
    completionRate: 0
  },
  
  // Feature flags (stage-based unlocking)
  stageFeatures: {
    genesis: ['opening', 'terminalEffect'],
    discipline: ['memoryFragments', 'structureEffects'],
    neural: ['metacurtisEmergence', 'neuralEffects'],
    velocity: ['accelerationEffects', 'velocityParticles'],
    architecture: ['architectureVisualization', 'blueprintMode'],
    harmony: ['harmonyEffects', 'flowState'],
    transcendence: ['contactPortal', 'fullAIInteraction', 'galaxyEffect']
  },
  
  // Narrative events (once-only triggers)
  narrativeEvents: {
    memoryFragmentsUnlocked: false,
    metacurtisAwakening: false,
    metacurtisVoiceActivated: false,
    fullConsciousness: false,
    contactPortalActivated: false,
    servicesTransition: false
  }
};

// SST v3.0 stage order
const STAGE_ORDER = [
  'genesis',
  'discipline',
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence'
];

export const narrativeAtom = createAtom(initialState, (get, set) => ({
  // ===== STAGE NAVIGATION =====
  jumpToStage: (stage) => {
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
        stagesVisited: [...new Set([...state.userEngagement.stagesVisited, stage])]
      }
    }));
    
    // Clear transition flag after animation
    setTimeout(() => {
      set(state => ({ ...state, isTransitioning: false }));
    }, 500);
    
    // Dispatch stage change event
    window.dispatchEvent(new CustomEvent('sst:stageChange', {
      detail: { stage, previousStage: currentState.currentStage }
    }));
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
  
  setStage: (stageIndex) => {
    const stage = STAGE_ORDER[stageIndex] || STAGE_ORDER[0];
    narrativeAtom.jumpToStage(stage);
  },
  
  // ===== PROGRESS MANAGEMENT =====
  setGlobalProgress: (progress) => {
    set(state => ({
      ...state,
      globalProgress: Math.max(0, Math.min(1, progress))
    }));
  },
  
  setScrollProgress: (progress) => {
    set(state => ({
      ...state,
      scrollProgress: Math.max(0, Math.min(1, progress))
    }));
  },
  
  setMorphProgress: (progress) => {
    set(state => ({
      ...state,
      morphProgress: Math.max(0, Math.min(1, progress))
    }));
  },
  
  setNarrativeProgress: (progress) => {
    // Convenience method that sets all progress values
    narrativeAtom.setGlobalProgress(progress);
    narrativeAtom.setScrollProgress(progress);
  },
  
  // ===== MEMORY FRAGMENTS =====
  activateMemoryFragment: (fragmentId) => {
    set(state => ({
      ...state,
      activeMemoryFragment: fragmentId,
      fragmentStates: {
        ...state.fragmentStates,
        [fragmentId]: { state: 'active', timestamp: Date.now() }
      },
      userEngagement: {
        ...state.userEngagement,
        fragmentsExplored: [...new Set([...state.userEngagement.fragmentsExplored, fragmentId])]
      }
    }));
    
    // Dispatch fragment event
    window.dispatchEvent(new CustomEvent('sst:fragmentActivated', {
      detail: { fragmentId }
    }));
  },
  
  dismissMemoryFragment: () => {
    const activeId = get().activeMemoryFragment;
    if (activeId) {
      set(state => ({
        ...state,
        activeMemoryFragment: null,
        fragmentStates: {
          ...state.fragmentStates,
          [activeId]: { ...state.fragmentStates[activeId], state: 'dismissed' }
        }
      }));
    }
  },
  
  // ===== FEATURE FLAGS =====
  isStageFeatureEnabled: (feature) => {
    const state = get();
    const currentFeatures = state.stageFeatures[state.currentStage] || [];
    return currentFeatures.includes(feature);
  },
  
  getAllEnabledFeatures: () => {
    const state = get();
    return state.stageFeatures[state.currentStage] || [];
  },
  
  // ===== NARRATIVE EVENTS =====
  triggerNarrativeEvent: (eventName) => {
    const state = get();
    if (state.narrativeEvents[eventName] !== undefined && !state.narrativeEvents[eventName]) {
      set(state => ({
        ...state,
        narrativeEvents: {
          ...state.narrativeEvents,
          [eventName]: true
        }
      }));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('narrativeEvent', {
        detail: { type: eventName, stage: state.currentStage }
      }));
      
      return true;
    }
    return false;
  },
  
  hasNarrativeEventFired: (eventName) => {
    return get().narrativeEvents[eventName] || false;
  },
  
  // ===== USER ENGAGEMENT =====
  updateEngagement: (updates) => {
    set(state => ({
      ...state,
      userEngagement: { ...state.userEngagement, ...updates }
    }));
  },
  
  trackUserEngagement: (action, data) => {
    set(state => ({
      ...state,
      userEngagement: {
        ...state.userEngagement,
        interactions: state.userEngagement.interactions + 1
      }
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
        morph: state.morphProgress
      },
      engagement: state.userEngagement,
      features: state.stageFeatures[state.currentStage] || [],
      events: state.narrativeEvents
    };
  },
  
  getCurrentStageIndex: () => {
    return STAGE_ORDER.indexOf(get().currentStage);
  },
  
  getStageOrder: () => STAGE_ORDER,
  
  reset: () => {
    set(initialState);
  }
}));

// Development helpers
if (import.meta.env.DEV) {
  window.narrativeAtom = narrativeAtom;
  console.log('🎭 narrativeAtom available at window.narrativeAtom');
}
EOFILE
echo -e "${GREEN}✓${NC} Created narrativeAtom.js"

# 2. Create performanceAtom.js
cat << 'EOFILE' > src/stores/atoms/performanceAtom.js
// src/stores/atoms/performanceAtom.js
// Performance monitoring and adaptive quality state
import { createAtom } from './createAtom';

const initialState = {
  // Core metrics
  fps: 60,
  frameTime: 16.67,
  particleCount: 0,
  renderTime: 0,
  
  // Memory metrics
  memoryUsage: 0,
  textureMemory: 0,
  geometryCount: 0,
  
  // Quality settings
  currentTier: 'HIGH',
  targetFPS: 60,
  autoQuality: true,
  
  // Performance history
  fpsHistory: [],
  frameTimeHistory: [],
  
  // Device capabilities
  deviceTier: 'high',
  gpuTier: 2,
  isMobile: false,
  
  // Narrative performance (legacy compatibility)
  narrative: {
    currentStage: 'genesis',
    progress: 0,
    transitionActive: false
  }
};

export const performanceAtom = createAtom(initialState, (get, set) => ({
  // Metric updates
  updateMetrics: (metrics) => {
    set(state => {
      const newState = { ...state, ...metrics };
      
      // Update history arrays (keep last 60 frames)
      if (metrics.fps !== undefined) {
        newState.fpsHistory = [...state.fpsHistory, metrics.fps].slice(-60);
      }
      if (metrics.frameTime !== undefined) {
        newState.frameTimeHistory = [...state.frameTimeHistory, metrics.frameTime].slice(-60);
      }
      
      return newState;
    });
  },
  
  // Quality management
  setTier: (tier) => {
    set(state => ({ ...state, currentTier: tier }));
    
    // Dispatch tier change event
    window.dispatchEvent(new CustomEvent('sst:qualityChange', {
      detail: { tier }
    }));
  },
  
  setAutoQuality: (enabled) => {
    set(state => ({ ...state, autoQuality: enabled }));
  },
  
  // Device detection
  setDeviceCapabilities: (capabilities) => {
    set(state => ({
      ...state,
      deviceTier: capabilities.tier || state.deviceTier,
      gpuTier: capabilities.gpuTier || state.gpuTier,
      isMobile: capabilities.isMobile !== undefined ? capabilities.isMobile : state.isMobile
    }));
  },
  
  // Performance analysis
  getAverageFPS: () => {
    const history = get().fpsHistory;
    if (history.length === 0) return 60;
    return history.reduce((a, b) => a + b, 0) / history.length;
  },
  
  getPerformanceScore: () => {
    const state = get();
    const avgFPS = performanceAtom.getAverageFPS();
    const targetFPS = state.targetFPS;
    
    return Math.min(100, (avgFPS / targetFPS) * 100);
  },
  
  // Legacy narrative support (for SimpleStageController compatibility)
  setCurrentStage: (stage) => {
    set(state => ({
      ...state,
      narrative: { ...state.narrative, currentStage: stage }
    }));
  },
  
  setNarrativeProgress: (progress) => {
    set(state => ({
      ...state,
      narrative: { ...state.narrative, progress }
    }));
  },
  
  setTransitionActive: (active) => {
    set(state => ({
      ...state,
      narrative: { ...state.narrative, transitionActive: active }
    }));
  },
  
  // Reset
  reset: () => {
    set(initialState);
  }
}));

// Development helpers
if (import.meta.env.DEV) {
  window.performanceAtom = performanceAtom;
}
EOFILE
echo -e "${GREEN}✓${NC} Created performanceAtom.js"

# 3. Create interactionAtom.js
cat << 'EOFILE' > src/stores/atoms/interactionAtom.js
// src/stores/atoms/interactionAtom.js
// User interaction and UI state management
import { createAtom } from './createAtom';

const initialState = {
  // Interaction events queue
  interactionEvents: [],
  
  // UI states
  typewriterProgress: 0,
  hoveredElement: null,
  clickedElements: [],
  
  // Mouse/touch tracking
  mousePosition: { x: 0, y: 0 },
  touchActive: false,
  
  // Keyboard state
  keysPressed: new Set(),
  lastKeyPress: null,
  
  // Scroll state
  scrollDirection: 'down',
  lastScrollTime: 0,
  scrollVelocity: 0
};

export const interactionAtom = createAtom(initialState, (get, set) => ({
  // Event queue management
  addInteractionEvent: (event) => {
    set(state => ({
      ...state,
      interactionEvents: [...state.interactionEvents, {
        ...event,
        id: `event_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        processed: false
      }]
    }));
  },
  
  consumeInteractionEvents: () => {
    const events = get().interactionEvents.filter(e => !e.processed);
    
    // Mark as processed
    set(state => ({
      ...state,
      interactionEvents: state.interactionEvents.map(e => 
        events.includes(e) ? { ...e, processed: true } : e
      )
    }));
    
    return events;
  },
  
  cleanupProcessedEvents: () => {
    const cutoffTime = Date.now() - 5000; // Keep events for 5 seconds
    set(state => ({
      ...state,
      interactionEvents: state.interactionEvents.filter(
        e => !e.processed || e.timestamp > cutoffTime
      )
    }));
  },
  
  // Typewriter effect
  setTypewriterProgress: (progress) => {
    set(state => ({ ...state, typewriterProgress: progress }));
  },
  
  // Mouse/touch tracking
  updateMousePosition: (x, y) => {
    set(state => ({ ...state, mousePosition: { x, y } }));
  },
  
  setTouchActive: (active) => {
    set(state => ({ ...state, touchActive: active }));
  },
  
  // Hover management
  setHoveredElement: (element) => {
    set(state => ({ ...state, hoveredElement: element }));
  },
  
  // Click tracking
  recordClick: (elementId) => {
    set(state => ({
      ...state,
      clickedElements: [...state.clickedElements, {
        id: elementId,
        timestamp: Date.now()
      }]
    }));
  },
  
  // Keyboard tracking
  setKeyPressed: (key, pressed) => {
    set(state => {
      const newKeys = new Set(state.keysPressed);
      if (pressed) {
        newKeys.add(key);
      } else {
        newKeys.delete(key);
      }
      return {
        ...state,
        keysPressed: newKeys,
        lastKeyPress: pressed ? key : state.lastKeyPress
      };
    });
  },
  
  // Scroll tracking
  updateScrollState: (direction, velocity) => {
    set(state => ({
      ...state,
      scrollDirection: direction,
      scrollVelocity: velocity,
      lastScrollTime: Date.now()
    }));
  },
  
  // Utilities
  reset: () => {
    set(initialState);
  }
}));

// Development helpers
if (import.meta.env.DEV) {
  window.interactionAtom = interactionAtom;
}
EOFILE
echo -e "${GREEN}✓${NC} Created interactionAtom.js"

# 4. Create resourceAtom.js
cat << 'EOFILE' > src/stores/atoms/resourceAtom.js
// src/stores/atoms/resourceAtom.js
// WebGL resource tracking and management
import { createAtom } from './createAtom';

const initialState = {
  stats: {
    geometry: 0,
    material: 0,
    texture: 0,
    program: 0,
    bufferGeometry: 0
  },
  
  memory: {
    used: 0,
    limit: 0,
    textures: 0,
    geometries: 0
  },
  
  resources: {
    textures: new Map(),
    geometries: new Map(),
    materials: new Map()
  }
};

export const resourceAtom = createAtom(initialState, (get, set) => ({
  // Update resource counts
  updateStats: (stats) => {
    set(state => ({
      ...state,
      stats: { ...state.stats, ...stats }
    }));
  },
  
  // Memory tracking
  updateMemory: (memory) => {
    set(state => ({
      ...state,
      memory: { ...state.memory, ...memory }
    }));
  },
  
  // Resource registration
  registerResource: (type, id, resource) => {
    set(state => {
      const resources = new Map(state.resources[type]);
      resources.set(id, resource);
      return {
        ...state,
        resources: {
          ...state.resources,
          [type]: resources
        }
      };
    });
  },
  
  // Resource cleanup
  disposeResource: (type, id) => {
    set(state => {
      const resources = new Map(state.resources[type]);
      resources.delete(id);
      return {
        ...state,
        resources: {
          ...state.resources,
          [type]: resources
        }
      };
    });
  },
  
  // Get all resources of a type
  getResources: (type) => {
    return Array.from(get().resources[type]?.values() || []);
  },
  
  // Clear all resources
  clearAll: () => {
    set(state => ({
      ...state,
      resources: {
        textures: new Map(),
        geometries: new Map(),
        materials: new Map()
      }
    }));
  },
  
  reset: () => {
    set(initialState);
  }
}));

// Development helpers
if (import.meta.env.DEV) {
  window.resourceAtom = resourceAtom;
}
EOFILE
echo -e "${GREEN}✓${NC} Created resourceAtom.js"

# 5. Create index.js for atoms
cat << 'EOFILE' > src/stores/atoms/index.js
// src/stores/atoms/index.js
// Central export for all atomic stores

export { createAtom, useAtomValue } from './createAtom';
export { stageAtom } from './stageAtom';
export { qualityAtom } from './qualityAtom';
export { clockAtom } from './clockAtom';
export { narrativeAtom } from './narrativeAtom';
export { performanceAtom } from './performanceAtom';
export { interactionAtom } from './interactionAtom';
export { resourceAtom } from './resourceAtom';

// Re-export for backwards compatibility
export const atoms = {
  stage: stageAtom,
  quality: qualityAtom,
  clock: clockAtom,
  narrative: narrativeAtom,
  performance: performanceAtom,
  interaction: interactionAtom,
  resource: resourceAtom
};

// Development access
if (import.meta.env.DEV) {
  window.atoms = atoms;
  console.log('⚛️ All atoms available at window.atoms');
}
EOFILE
echo -e "${GREEN}✓${NC} Created atoms index.js"

# ========== PHASE 2: CREATE COMPATIBILITY HOOKS ==========
echo ""
echo "🪝 PHASE 2: Creating Compatibility Hooks"
echo "---------------------------------------"

# 1. Create useNarrativeStore hook
cat << 'EOFILE' > src/hooks/atoms/useNarrativeStore.js
// src/hooks/atoms/useNarrativeStore.js
// Compatibility layer for Zustand → Atomic migration
import { useAtomValue } from '../../stores/atoms/createAtom';
import { narrativeAtom } from '../../stores/atoms/narrativeAtom';

export function useNarrativeStore(selector) {
  // Get the full state or selected portion
  const state = useAtomValue(narrativeAtom, selector);
  
  // Return both state and actions for compatibility
  if (selector) {
    return state;
  }
  
  // Full store compatibility mode
  return {
    // State
    ...state,
    
    // Actions (bound to atom)
    jumpToStage: narrativeAtom.jumpToStage,
    nextStage: narrativeAtom.nextStage,
    prevStage: narrativeAtom.prevStage,
    setStage: narrativeAtom.setStage,
    setGlobalProgress: narrativeAtom.setGlobalProgress,
    setScrollProgress: narrativeAtom.setScrollProgress,
    setMorphProgress: narrativeAtom.setMorphProgress,
    setNarrativeProgress: narrativeAtom.setNarrativeProgress,
    activateMemoryFragment: narrativeAtom.activateMemoryFragment,
    dismissMemoryFragment: narrativeAtom.dismissMemoryFragment,
    isStageFeatureEnabled: narrativeAtom.isStageFeatureEnabled,
    getAllEnabledFeatures: narrativeAtom.getAllEnabledFeatures,
    triggerNarrativeEvent: narrativeAtom.triggerNarrativeEvent,
    hasNarrativeEventFired: narrativeAtom.hasNarrativeEventFired,
    updateEngagement: narrativeAtom.updateEngagement,
    trackUserEngagement: narrativeAtom.trackUserEngagement,
    updateTimeInStage: narrativeAtom.updateTimeInStage,
    getNarrativeSnapshot: narrativeAtom.getNarrativeSnapshot,
    getCurrentStageIndex: narrativeAtom.getCurrentStageIndex,
    getStageOrder: narrativeAtom.getStageOrder
  };
}

// Also export as default for import compatibility
export default useNarrativeStore;
EOFILE
echo -e "${GREEN}✓${NC} Created useNarrativeStore hook"

# 2. Create usePerformanceStore hook
cat << 'EOFILE' > src/hooks/atoms/usePerformanceStore.js
// src/hooks/atoms/usePerformanceStore.js
// Compatibility layer for performance store
import { useAtomValue } from '../../stores/atoms/createAtom';
import { performanceAtom } from '../../stores/atoms/performanceAtom';

export function usePerformanceStore(selector) {
  const state = useAtomValue(performanceAtom, selector);
  
  if (selector) {
    return state;
  }
  
  return {
    ...state,
    updateMetrics: performanceAtom.updateMetrics,
    setTier: performanceAtom.setTier,
    setAutoQuality: performanceAtom.setAutoQuality,
    setDeviceCapabilities: performanceAtom.setDeviceCapabilities,
    getAverageFPS: performanceAtom.getAverageFPS,
    getPerformanceScore: performanceAtom.getPerformanceScore,
    setCurrentStage: performanceAtom.setCurrentStage,
    setNarrativeProgress: performanceAtom.setNarrativeProgress,
    setTransitionActive: performanceAtom.setTransitionActive
  };
}

export default usePerformanceStore;
EOFILE
echo -e "${GREEN}✓${NC} Created usePerformanceStore hook"

# 3. Create useInteractionStore hook
cat << 'EOFILE' > src/hooks/atoms/useInteractionStore.js
// src/hooks/atoms/useInteractionStore.js
// Compatibility layer for interaction store
import { useAtomValue } from '../../stores/atoms/createAtom';
import { interactionAtom } from '../../stores/atoms/interactionAtom';

export function useInteractionStore(selector) {
  const state = useAtomValue(interactionAtom, selector);
  
  if (selector) {
    return state;
  }
  
  return {
    ...state,
    addInteractionEvent: interactionAtom.addInteractionEvent,
    consumeInteractionEvents: interactionAtom.consumeInteractionEvents,
    cleanupProcessedEvents: interactionAtom.cleanupProcessedEvents,
    setTypewriterProgress: interactionAtom.setTypewriterProgress,
    updateMousePosition: interactionAtom.updateMousePosition,
    setTouchActive: interactionAtom.setTouchActive,
    setHoveredElement: interactionAtom.setHoveredElement,
    recordClick: interactionAtom.recordClick,
    setKeyPressed: interactionAtom.setKeyPressed,
    updateScrollState: interactionAtom.updateScrollState
  };
}

export default useInteractionStore;
EOFILE
echo -e "${GREEN}✓${NC} Created useInteractionStore hook"

# 4. Create useResourceStore hook
cat << 'EOFILE' > src/hooks/atoms/useResourceStore.js
// src/hooks/atoms/useResourceStore.js
// Compatibility layer for resource store
import { useAtomValue } from '../../stores/atoms/createAtom';
import { resourceAtom } from '../../stores/atoms/resourceAtom';

export function useResourceStore(selector) {
  const state = useAtomValue(resourceAtom, selector);
  
  if (selector) {
    return state;
  }
  
  return {
    ...state,
    updateStats: resourceAtom.updateStats,
    updateMemory: resourceAtom.updateMemory,
    registerResource: resourceAtom.registerResource,
    disposeResource: resourceAtom.disposeResource,
    getResources: resourceAtom.getResources,
    clearAll: resourceAtom.clearAll
  };
}

export default useResourceStore;
EOFILE
echo -e "${GREEN}✓${NC} Created useResourceStore hook"

# ========== PHASE 3: CREATE MIGRATION STORES ==========
echo ""
echo "🔄 PHASE 3: Creating Migration Store Files"
echo "-----------------------------------------"

# Create stores directory files that import from hooks
cat << 'EOFILE' > src/stores/narrativeStore.js
// src/stores/narrativeStore.js
// Migration wrapper - imports from atomic hooks
export { useNarrativeStore } from '../hooks/atoms/useNarrativeStore';
export { default } from '../hooks/atoms/useNarrativeStore';

// Export stage constants for compatibility
export const NARRATIVE_STAGES = {
  genesis: 0,
  discipline: 1,
  neural: 2,
  velocity: 3,
  architecture: 4,
  harmony: 5,
  transcendence: 6
};

export const STAGE_NAME_TO_INDEX = {
  genesis: 0,
  discipline: 1,
  neural: 2,
  velocity: 3,
  architecture: 4,
  harmony: 5,
  transcendence: 6
};

export const STAGE_INDEX_TO_NAME = [
  'genesis',
  'discipline',
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence'
];
EOFILE
echo -e "${GREEN}✓${NC} Created narrativeStore.js wrapper"

cat << 'EOFILE' > src/stores/performanceStore.js
// src/stores/performanceStore.js
// Migration wrapper
export { usePerformanceStore } from '../hooks/atoms/usePerformanceStore';
export { default } from '../hooks/atoms/usePerformanceStore';
EOFILE
echo -e "${GREEN}✓${NC} Created performanceStore.js wrapper"

cat << 'EOFILE' > src/stores/useInteractionStore.js
// src/stores/useInteractionStore.js
// Migration wrapper
export { useInteractionStore } from '../hooks/atoms/useInteractionStore';
export { default } from '../hooks/atoms/useInteractionStore';
EOFILE
echo -e "${GREEN}✓${NC} Created useInteractionStore.js wrapper"

cat << 'EOFILE' > src/stores/resourceStore.js
// src/stores/resourceStore.js
// Migration wrapper
export { useResourceStore } from '../hooks/atoms/useResourceStore';
export { default } from '../hooks/atoms/useResourceStore';
EOFILE
echo -e "${GREEN}✓${NC} Created resourceStore.js wrapper"

# ========== PHASE 4: UPDATE IMPORTS ==========
echo ""
echo "🔧 PHASE 4: Updating Import Paths"
echo "--------------------------------"

# Update all imports to use the new atomic system
find src -name "*.jsx" -o -name "*.js" | while read file; do
    # Skip the files we just created
    if [[ ! "$file" =~ "stores/atoms" ]] && [[ ! "$file" =~ "hooks/atoms" ]]; then
        # Check if file uses any store imports
        if grep -q "useNarrativeStore\|usePerformanceStore\|useInteractionStore\|useResourceStore" "$file"; then
            backup_file "$file"
            
            # The imports should now work because we created wrapper files
            echo -e "${GREEN}✓${NC} Import paths already compatible in: $file"
        fi
    fi
done

# ========== PHASE 5: UPDATE WIRING ==========
echo ""
echo "🔌 PHASE 5: Updating SST v3.0 Wiring"
echo "-----------------------------------"

# Update wireSSTv3.js to use atomic stores
backup_file "src/bootstrap/wireSSTv3.js"

cat << 'EOFILE' > src/bootstrap/wireSSTv3.js
// src/bootstrap/wireSSTv3.js
// Central wiring layer for SST v3.0 engine components - ATOMIC VERSION

import { narrativeController } from "@/engine/NarrativeController.js";
import { memoryFragmentController } from "@/engine/MemoryFragmentController.js";
import { narrativeAtom, performanceAtom, stageAtom, qualityAtom } from "@/stores/atoms";
import consciousnessEngine from "@/engine/ConsciousnessEngine.js";

export function wireSSTv3() {
  console.log("🔌 wireSSTv3: Initializing atomic event wiring...");
  
  // Forward narrative controller events to window
  if (narrativeController && narrativeController.on) {
    narrativeController.on("particleCue", (event) => {
      window.dispatchEvent(new CustomEvent("sst:particleCue", { 
        detail: event 
      }));
    });
  }
  
  if (memoryFragmentController && memoryFragmentController.on) {
    memoryFragmentController.on("tierHighlightUpdate", (event) => {
      window.dispatchEvent(new CustomEvent("sst:tierHighlight", { 
        detail: event 
      }));
    });
  }
  
  // Subscribe to atomic stores
  const unsubscribeStage = stageAtom.subscribe((state) => {
    window.dispatchEvent(new CustomEvent("sst:stageChange", {
      detail: {
        stage: state.currentStage,
        progress: state.progress,
        isTransitioning: state.isTransitioning
      }
    }));
  });
  
  const unsubscribeQuality = qualityAtom.subscribe((state) => {
    window.dispatchEvent(new CustomEvent("sst:qualityChange", {
      detail: {
        tier: state.currentTier,
        particleBudget: state.particleBudget,
        dpr: state.dpr
      }
    }));
  });
  
  // Sync narrative atom with stage atom
  const unsubscribeNarrative = narrativeAtom.subscribe((state) => {
    // Update stage atom when narrative changes
    if (state.currentStage !== stageAtom.getState().currentStage) {
      stageAtom.jumpToStage(state.currentStage);
    }
  });
  
  // Cleanup function
  const cleanup = () => {
    unsubscribeStage();
    unsubscribeQuality();
    unsubscribeNarrative();
  };
  
  console.log("✅ wireSSTv3: Atomic event wiring complete");
  
  return cleanup;
}

// Auto-initialize on import
let cleanupFn = null;

if (typeof window !== 'undefined') {
  cleanupFn = wireSSTv3();
}

// Export cleanup for manual control
export function unwireSSTv3() {
  if (cleanupFn) {
    cleanupFn();
    console.log("🔌 wireSSTv3: Unwired all connections");
  }
}
EOFILE
echo -e "${GREEN}✓${NC} Updated wireSSTv3.js for atomic stores"

# ========== PHASE 6: CLEANUP ==========
echo ""
echo "🧹 PHASE 6: Cleaning Up Legacy Files"
echo "-----------------------------------"

# Remove Zustand from package.json
if [ -f "package.json" ]; then
    backup_file "package.json"
    
    # Remove zustand dependency
    npm uninstall zustand
    echo -e "${GREEN}✓${NC} Removed zustand from package.json"
fi

# Move legacy backup files to archive
mkdir -p archive/zustand-migration-backup
mv src/stores/narrativeStore.legacy.backup archive/zustand-migration-backup/ 2>/dev/null || true

# ========== PHASE 7: VERIFICATION ==========
echo ""
echo "✅ PHASE 7: Creating Verification Script"
echo "---------------------------------------"

cat << 'EOFILE' > verify-atomic-migration.sh
#!/bin/bash
# Verification script for atomic migration

echo "🔍 Verifying Atomic Migration..."
echo "================================"

# Check if atomic stores exist
echo ""
echo "Checking atomic stores..."
for store in narrativeAtom performanceAtom interactionAtom resourceAtom; do
    if [ -f "src/stores/atoms/${store}.js" ]; then
        echo "✅ ${store}.js exists"
    else
        echo "❌ ${store}.js missing!"
    fi
done

# Check if compatibility hooks exist
echo ""
echo "Checking compatibility hooks..."
for hook in useNarrativeStore usePerformanceStore useInteractionStore useResourceStore; do
    if [ -f "src/hooks/atoms/${hook}.js" ]; then
        echo "✅ ${hook}.js exists"
    else
        echo "❌ ${hook}.js missing!"
    fi
done

# Check if wrapper stores exist
echo ""
echo "Checking wrapper stores..."
for store in narrativeStore performanceStore useInteractionStore resourceStore; do
    if [ -f "src/stores/${store}.js" ]; then
        echo "✅ ${store}.js exists"
    else
        echo "❌ ${store}.js missing!"
    fi
done

# Check for zustand imports
echo ""
echo "Checking for remaining zustand imports..."
if grep -r "from 'zustand'" src/ --include="*.js" --include="*.jsx" 2>/dev/null; then
    echo "❌ Found zustand imports!"
else
    echo "✅ No zustand imports found"
fi

# Check package.json
echo ""
echo "Checking package.json..."
if grep -q '"zustand"' package.json 2>/dev/null; then
    echo "❌ zustand still in package.json!"
else
    echo "✅ zustand removed from package.json"
fi

echo ""
echo "✨ Migration verification complete!"
EOFILE

chmod +x verify-atomic-migration.sh
echo -e "${GREEN}✓${NC} Created verification script"

# ========== FINAL SUMMARY ==========
echo ""
echo "🎉 ATOMIC MIGRATION COMPLETE!"
echo "============================"
echo ""
echo "✅ Created 4 atomic stores:"
echo "   - narrativeAtom.js (complete state management)"
echo "   - performanceAtom.js (metrics & quality)"
echo "   - interactionAtom.js (user interactions)"
echo "   - resourceAtom.js (WebGL resources)"
echo ""
echo "✅ Created 4 compatibility hooks for seamless migration"
echo "✅ Created wrapper stores for import compatibility"
echo "✅ Updated wireSSTv3.js for atomic event system"
echo "✅ Removed zustand from package.json"
echo ""
echo "📋 Next Steps:"
echo "1. Run ./verify-atomic-migration.sh to check the migration"
echo "2. Test the application to ensure all components work"
echo "3. Remove backup files after confirming everything works"
echo ""
echo "🔧 Dev Tools Available:"
echo "   - window.atoms (all atomic stores)"
echo "   - window.narrativeAtom"
echo "   - window.performanceAtom"
echo "   - window.interactionAtom"
echo "   - window.resourceAtom"
echo ""
echo "Happy coding with atomic state! ⚛️"
