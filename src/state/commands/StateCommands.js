// src/state/commands/StateCommands.js
// Canon-compliant state command layer with proper event contracts

// >>> Throttled Morph Emitter v1 <<<
let __lastMorph = -1;
let __lastMorphEmit = 0;

/** Local throttle config (ms) can be overridden by localStorage.canonMorphThrottleMs */
function __getMorphThrottleMs() {
  try {
    return Math.max(0, parseInt(localStorage.getItem('canonMorphThrottleMs') || '80', 10));
  } catch {
    return 80;
  }
}

function __emitMorphThrottled(BeatBus, EVENTS, v, context = {}) {
  try {
    const EPS = 0.005; // 0.5% change
    const now = performance.now();
    const MIN = __getMorphThrottleMs(); // default 80ms
    const numeric = Number.isFinite(v) ? v : Number(v);
    if (!Number.isFinite(numeric)) return;
    const clamped = Math.max(0, Math.min(1, numeric));
    if (Math.abs(clamped - __lastMorph) < EPS) return; // no change
    if (now - __lastMorphEmit < MIN) return; // too soon
    __lastMorph = clamped;
    __lastMorphEmit = now;
    const stageState = stageAtom.getState?.() || {};
    const currentStage = context.stage || stageState.currentStage || 'genesis';
    const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : [];
    const stageIndex =
      context.stageIndex ??
      stageState.stageIndex ??
      stageOrder.indexOf(currentStage);
    const payload = {
      morphProgress: clamped,
      value: clamped,
      morphTarget: typeof context.morphTarget === 'number' ? context.morphTarget : clamped,
      target: typeof context.morphTarget === 'number' ? context.morphTarget : clamped,
      stage: currentStage,
      schemaVersion: '3.5',
      origin: context.origin || 'command',
    };
    if (Number.isFinite(stageIndex) && stageIndex >= 0) {
      payload.stageIndex = stageIndex;
    }
    if (context.animationId) {
      payload.animationId = context.animationId;
    }
    BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', payload);
    if (typeof window !== 'undefined') {
      window.eventEmissionMonitor?.recordEmission?.('MORPH_PROGRESS', 'StateCommands');
    }
  } catch {}
}

// State Command Layer with proper cleanup and architectural contracts
import { stageAtom, narrativeAtom, qualityAtom, performanceAtom, interactionAtom } from '../atoms';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import NavigationGate from '@/theater/NavigationGate.js';

const clamp01 = (value) => {
  const num = Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};

class StateCommands {
  constructor() {
    this.snapshots = [];
    this.morphState = null;
    this.subscriptions = []; // Track subscriptions for cleanup
    this.openingComplete = false; // Track opening phase
    
    // Event emission contracts
    this.eventContracts = {
      BUILD_EMERGENCE_BLUEPRINT: {
        maxEmissions: 1,
        emissionCount: 0,
        allowedPhase: 'opening',
        lastEmission: null
      }
    };
    
    this.wireAtomsToBeatBus();
    this.installOpeningListener();
  }

  // Listen for opening completion
  installOpeningListener() {
    const scrollSub = BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
      this.openingComplete = true;
      console.log('[StateCommands] Opening phase complete');
    });
    if (scrollSub) this.subscriptions.push(scrollSub);
  }

  // Check if event emission is allowed per contract
  canEmit(eventName) {
    const contract = this.eventContracts[eventName];
    if (!contract) return true; // No contract, allow emission
    
    // Check phase restriction
    if (contract.allowedPhase === 'opening' && this.openingComplete) {
      console.warn(`[StateCommands] ${eventName} blocked - only allowed during opening phase`);
      return false;
    }
    
    // Check max emissions
    if (contract.maxEmissions && contract.emissionCount >= contract.maxEmissions) {
      console.warn(`[StateCommands] ${eventName} blocked - max emissions (${contract.maxEmissions}) reached`);
      return false;
    }
    
    return true;
  }

  // Record event emission
  recordEmission(eventName) {
    const contract = this.eventContracts[eventName];
    if (contract) {
      contract.emissionCount++;
      contract.lastEmission = performance.now();
    }
  }

  wireAtomsToBeatBus() {
    // Track latest canonical events to avoid duplicate emissions
    let lastStageFromBus = stageAtom.getState?.()?.currentStage ?? null;
    let lastQualityFromBus = qualityAtom.getState?.()?.currentQualityTier ?? null;

    const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
      const stage = payload.to ?? payload.stage ?? payload.name ?? null;
      if (stage) {
        lastStageFromBus = stage;
      }
    });
    if (stageBusSub) this.subscriptions.push(stageBusSub);

    const qualityBusSub = BeatBus.on?.(EVENTS.QUALITY_CHANGE, (payload = {}) => {
      const tier = payload.tier ?? payload.quality ?? null;
      if (tier) {
        lastQualityFromBus = tier;
      }
    });
    if (qualityBusSub) this.subscriptions.push(qualityBusSub);

    // Stage changes → BeatBus (only when atom-driven)
    let prevStage = stageAtom.getState?.()?.currentStage;
    const stageSub = stageAtom.subscribe?.(s => {
      const next = s.currentStage;
      if (next !== prevStage) {
        if (next === lastStageFromBus) {
          prevStage = next;
          return;
        }
        // Emit stage change events
        BeatBus.emit(EVENTS.STAGE_CHANGE, { 
          from: prevStage, 
          to: next, 
          stage: next,  // Include for compatibility
          reason: 'atom' 
        });
        if (typeof window !== 'undefined') {
          window.eventEmissionMonitor?.recordEmission?.('STAGE_CHANGE', 'StateCommands');
        }
        
        // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
        // This was causing emergence to build on every stage change
        // Emergence should only be triggered by TheaterDirector during opening
        
        prevStage = next;
        lastStageFromBus = next;
      }
    });
    if (stageSub) this.subscriptions.push(stageSub);

    // Morph progress from narrativeAtom
    let lastMorph = narrativeAtom.getState?.()?.morphProgress ?? 0;
    const morphSub = narrativeAtom.subscribe?.(s => {
      const v = Number(s.morphProgress ?? 0);
      if (v !== lastMorph) {
        __emitMorphThrottled(BeatBus, EVENTS, v);
        lastMorph = v;
      }
    });
    if (morphSub) this.subscriptions.push(morphSub);

    // Quality changes → BeatBus
    let lastQuality = qualityAtom.getState?.()?.currentQualityTier;
    const qualitySub = qualityAtom.subscribe?.(s => {
      const tier = s.currentQualityTier;
      if (tier !== lastQuality) {
        if (tier === lastQualityFromBus) {
          lastQuality = tier;
          return;
        }
        BeatBus.emit(EVENTS.QUALITY_CHANGE, { 
          tier, 
          quality: tier,  // Include for compatibility
          from: lastQuality,
          reason: 'atom' 
        });
        lastQuality = tier;
        lastQualityFromBus = tier;
      }
    });
    if (qualitySub) this.subscriptions.push(qualitySub);
  }

  setMorphProgress(value, options = {}) {
    const morph = clamp01(value);
    narrativeAtom.setMorphProgress?.(morph);

    this.morphState = {
      value: morph,
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      origin: options.origin || 'command',
      morphTarget: options.morphTarget,
      animationId: options.animationId,
    };

    const stageState = stageAtom.getState?.() || {};
    __emitMorphThrottled(BeatBus, EVENTS, morph, {
      origin: options.origin || 'command',
      stage: options.stage || stageState.currentStage,
      stageIndex:
        options.stageIndex ??
        (typeof stageState.stageIndex === 'number' ? stageState.stageIndex : undefined),
      morphTarget: options.morphTarget,
      animationId: options.animationId,
    });

    return morph;
  }

  adjustMorph(delta, options = {}) {
    const current = narrativeAtom.getState?.()?.morphProgress ?? 0;
    return this.setMorphProgress(current + delta, options);
  }

  setScrollProgress(progress, options = {}) {
    const clamped = clamp01(progress);
    const prev = narrativeAtom.getState?.()?.scrollProgress ?? 0;
    if (Math.abs(prev - clamped) > 1e-6) {
      narrativeAtom.setScrollProgress?.(clamped);
    }

    const stageInfo =
      typeof Canonical?.getStageByScroll === 'function'
        ? Canonical.getStageByScroll(clamped * 100)
        : null;
    const targetStage = stageInfo?.name || stageInfo?.stage || null;
    if (targetStage) {
      const currentStage = stageAtom.getState?.()?.currentStage;
      const gateActive = typeof NavigationGate?.isInFlight === 'function' && NavigationGate.isInFlight();
      const gateTarget = typeof NavigationGate?.target === 'function' ? NavigationGate.target() : null;
      if (!gateActive || gateTarget === targetStage) {
        if (currentStage !== targetStage) {
          stageAtom.jumpToStage(targetStage);
        }
      }
    }

    return clamped;
  }

  // Programmatic emergence trigger (only for opening sequence)
  triggerEmergence(payload = {}) {
    if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
      console.error('[StateCommands] Cannot trigger emergence - contract violation');
      return false;
    }
    
    this.recordEmission('BUILD_EMERGENCE_BLUEPRINT');
    BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      mode: 'emergence',
      source: 'viewportSpread',
      target: 'constellation',
      count: 2000,
      trigger: 'programmatic',
      ...payload
    });
    
    return true;
  }

  async executeClimaxMorph({ text, duration = 3000 }) {
    this.createSnapshot('pre-morph');

    narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
    interactionAtom.setState?.(prev => ({ ...prev, locked: true }));

    const startTime = performance.now();
    const animate = () => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      this.setMorphProgress(progress, { origin: 'climax' });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        narrativeAtom.setState?.(prev => ({ ...prev, paused: false }));
        interactionAtom.setState?.(prev => ({ ...prev, locked: false }));
      }
    };

    requestAnimationFrame(animate);
  }

  interruptForFragment(fragment) {
    this.createSnapshot('fragment');

    narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
    interactionAtom.setState?.(prev => ({
      ...prev,
      memoryFragment: fragment,
      locked: true,
    }));

  }

  resumeFromFragment() {
    const snapshot = this.snapshots.find(s => s.label === 'fragment');
    if (snapshot) this.restoreSnapshot(snapshot);
  }

  transitionStage(from, to) {
    stageAtom.setState?.({ currentStage: to, transitioning: true });
    narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
  }

  createSnapshot(label) {
    this.snapshots.push({
      label,
      timestamp: Date.now(),
      state: {
        stage: stageAtom.getState?.(),
        narrative: narrativeAtom.getState?.(),
        quality: qualityAtom.getState?.(),
        interaction: interactionAtom.getState?.(),
      },
    });
  }

  restoreSnapshot(snapshot) {
    if (snapshot?.state) {
      stageAtom.setState?.(snapshot.state.stage);
      narrativeAtom.setState?.(snapshot.state.narrative);
      qualityAtom.setState?.(snapshot.state.quality);
      interactionAtom.setState?.(snapshot.state.interaction);
    }
  }

  // Get contract status
  getContractStatus() {
    return Object.entries(this.eventContracts).map(([event, contract]) => ({
      event,
      emissionCount: contract.emissionCount,
      maxAllowed: contract.maxEmissions,
      lastEmission: contract.lastEmission,
      canEmit: this.canEmit(event)
    }));
  }

  // Clean up subscriptions
  dispose() {
    this.subscriptions.forEach(unsub => {
      if (typeof unsub === 'function') {
        unsub();
      }
    });
    this.subscriptions = [];
    this.snapshots = [];
    this.morphState = null;
  }
}

const stateCommands = new StateCommands();

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stateCommands.dispose();
  });
  window.stateCommands = stateCommands;
  // Dev tools
  if (import.meta.env.DEV) {
    window.StateCommands = stateCommands;
    window.stateCommandContracts = () => stateCommands.getContractStatus();
  }
}

export default stateCommands;
