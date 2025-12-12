// modules/state/core/StateReader.js
// SST v3.0 - Read-only access to atomic state
// Components should use this instead of importing atoms directly

import { narrativeAtom } from '@/stores/atoms/narrativeAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';
import { interactionAtom } from '@/stores/atoms/interactionAtom';
import { resourceAtom } from '@/stores/atoms/resourceAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { clockAtom } from '@/stores/atoms/clockAtom';

class StateReader {
  constructor() {
    if (StateReader.instance) {
      return StateReader.instance;
    }

    // Store read-only atom references
    this.atoms = {
      narrative: narrativeAtom,
      performance: performanceAtom,
      interaction: interactionAtom,
      resource: resourceAtom,
      quality: qualityAtom,
      stage: stageAtom,
      clock: clockAtom,
    };

    StateReader.instance = this;
  }

  // ===== NARRATIVE STATE READS =====

  getCurrentStage() {
    return narrativeAtom.getState().currentStage;
  }

  getStageProgress() {
    const narrative = narrativeAtom.getState();
    return {
      global: narrative.globalProgress,
      scroll: narrative.scrollProgress,
      morph: narrative.morphProgress,
      stage: stageAtom.getState().stageProgress,
    };
  }

  getActiveMemoryFragment() {
    return narrativeAtom.getState().activeMemoryFragment;
  }

  getExploredFragments() {
    return narrativeAtom.getState().fragmentsExplored;
  }

  isStageFeatureEnabled(feature) {
    return narrativeAtom.isStageFeatureEnabled(feature);
  }

  getNarrativeSnapshot() {
    return narrativeAtom.getNarrativeSnapshot();
  }

  hasNarrativeEventFired(eventName) {
    return narrativeAtom.hasNarrativeEventFired(eventName);
  }

  // ===== PERFORMANCE STATE READS =====

  getCurrentFPS() {
    return performanceAtom.getState().fps;
  }

  getPerformanceMetrics() {
    const perf = performanceAtom.getState();
    const quality = qualityAtom.getState();

    return {
      fps: perf.fps,
      frameTime: perf.frameTime,
      particleCount: perf.particleCount,
      renderTime: perf.renderTime,
      memoryUsage: perf.memoryUsage,
      currentTier: quality.currentQualityTier,
      performanceGrade: quality.performanceGrade,
    };
  }

  getAverageFPS() {
    return performanceAtom.getAverageFPS();
  }

  getPerformanceScore() {
    return performanceAtom.getPerformanceScore();
  }

  // ===== QUALITY STATE READS =====

  getCurrentQuality() {
    return qualityAtom.getState().currentQualityTier;
  }

  getQualityConfig() {
    return qualityAtom.getQualityConfig();
  }

  getParticleBudget(stageName) {
    return qualityAtom.getParticleBudget(stageName);
  }

  canScaleToUltra() {
    return qualityAtom.getState().canScaleToUltra;
  }

  getDeviceCapabilities() {
    const quality = qualityAtom.getState();
    return {
      deviceType: quality.deviceType,
      webglVersion: quality.webglVersion,
      performanceClass: quality.performanceClass,
      deviceOptimization: quality.deviceOptimization,
    };
  }

  // ===== STAGE STATE READS =====

  getStageInfo() {
    return stageAtom.getStageInfo();
  }

  isTransitioning() {
    return stageAtom.getState().isTransitioning;
  }

  isAutoAdvanceEnabled() {
    return stageAtom.getState().autoAdvanceEnabled;
  }

  getStageNames() {
    return stageAtom.getStageNames();
  }

  getCurrentStageIndex() {
    return narrativeAtom.getCurrentStageIndex();
  }

  // ===== INTERACTION STATE READS =====

  getInteractionEvents() {
    return interactionAtom.getState().interactionEvents;
  }

  getMousePosition() {
    return interactionAtom.getState().mousePosition;
  }

  getKeysPressed() {
    return Array.from(interactionAtom.getState().keysPressed);
  }

  getScrollState() {
    const interaction = interactionAtom.getState();
    return {
      direction: interaction.scrollDirection,
      velocity: interaction.scrollVelocity,
      lastTime: interaction.lastScrollTime,
    };
  }

  // ===== RESOURCE STATE READS =====

  getResourceStats() {
    return resourceAtom.getState().stats;
  }

  getMemoryUsage() {
    return resourceAtom.getState().memory;
  }

  getResourceCount(type) {
    const resources = resourceAtom.getState().resources[type];
    return resources ? resources.size : 0;
  }

  // ===== CLOCK STATE READS =====

  getClockMetrics() {
    return clockAtom.getState();
  }

  // ===== COMPOSITE READS =====

  getFullState() {
    return {
      narrative: narrativeAtom.getState(),
      performance: performanceAtom.getState(),
      interaction: interactionAtom.getState(),
      resource: resourceAtom.getState(),
      quality: qualityAtom.getState(),
      stage: stageAtom.getState(),
      clock: clockAtom.getState(),
    };
  }

  getEngagementMetrics() {
    const narrative = narrativeAtom.getState();
    const interaction = interactionAtom.getState();

    return {
      ...narrative.userEngagement,
      totalInteractions: interaction.interactionEvents.length,
      currentStage: narrative.currentStage,
      timeInStage: narrative.timeInStage,
    };
  }

  getSystemHealth() {
    const perf = this.getPerformanceMetrics();
    const resources = this.getResourceStats();
    const memory = this.getMemoryUsage();

    return {
      fps: perf.fps,
      performanceGrade: perf.performanceGrade,
      memoryUsed: memory.used,
      memoryLimit: memory.limit,
      resourceCounts: resources,
      isHealthy: perf.fps >= 30 && memory.used < memory.limit * 0.9,
    };
  }

  // ===== SUBSCRIPTIONS =====

  subscribe(atomName, callback) {
    const atom = this.atoms[atomName];
    if (!atom || !atom.subscribe) {
      console.error(`StateReader: Cannot subscribe to ${atomName}`);
      return () => {};
    }

    return atom.subscribe(callback);
  }

  subscribeToMultiple(atomNames, callback) {
    const unsubscribes = atomNames.map(name => this.subscribe(name, callback));

    // Return function that unsubscribes from all
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  // ===== SINGLETON ACCESS =====

  static getInstance() {
    if (!StateReader.instance) {
      StateReader.instance = new StateReader();
    }
    return StateReader.instance;
  }
}

// Export singleton instance
export default StateReader.getInstance();

// Development helpers
if (import.meta.env.DEV) {
  window.StateReader = StateReader;
  window.stateReader = StateReader.getInstance();

  // Quick access methods
  window.sr = {
    stage: () => window.stateReader.getCurrentStage(),
    progress: () => window.stateReader.getStageProgress(),
    fps: () => window.stateReader.getCurrentFPS(),
    quality: () => window.stateReader.getCurrentQuality(),
    health: () => window.stateReader.getSystemHealth(),
    all: () => window.stateReader.getFullState(),
  };

  console.log('👓 StateReader available at window.stateReader');
  console.log('👓 Quick access: window.sr.stage(), window.sr.fps()');
}
