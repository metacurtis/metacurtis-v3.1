// State Command Layer - Orchestrates complex state operations
import { 
  stageAtom,
  narrativeAtom,
  qualityAtom,
  performanceAtom,
  interactionAtom
} from '../atoms';
import BeatBus from '@/modules/orchestration/core/BeatBus';
import { EVENTS } from '@/theater/events';

class StateCommands {
  constructor() {
    this.snapshots = [];
    this.morphState = null;
    this.wireAtomsToBeatBus();
  }

  wireAtomsToBeatBus() {
    // Stage changes → BeatBus
    let prevStage = stageAtom.getState?.()?.currentStage;
    stageAtom.subscribe?.((s) => {
      const next = s.currentStage;
      if (next !== prevStage) {
        BeatBus.emit(EVENTS.STAGE_CHANGE, { from: prevStage, to: next, reason: 'atom' });
        if (EVENTS.STAGE_CHANGED !== EVENTS.STAGE_CHANGE) {
          BeatBus.emit(EVENTS.STAGE_CHANGED, { from: prevStage, to: next, reason: 'atom' });
        }
        BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, { stage: next, trigger: 'stage-change' });
        if (EVENTS.BUILD_BLUEPRINT !== EVENTS.BUILD_EMERGENCE_BLUEPRINT) {
          BeatBus.emit(EVENTS.BUILD_BLUEPRINT, { stage: next, trigger: 'stage-change' });
        }
        prevStage = next;
      }
    });

    // Morph progress from narrativeAtom (where it actually lives)
    let lastMorph = narrativeAtom.getState?.()?.morphProgress ?? 0;
    narrativeAtom.subscribe?.((s) => {
      const v = Number(s.morphProgress ?? 0);
      if (v !== lastMorph) {
        BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
        lastMorph = v;
      }
    });
  }

  async executeClimaxMorph({ text, duration = 3000 }) {
    this.createSnapshot('pre-morph');
    
    // Update atoms directly (no batch needed)
    narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
    interactionAtom.setState?.(prev => ({ ...prev, locked: true }));

    const startTime = performance.now();
    const animate = () => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      
      // Update morphProgress in narrativeAtom (where it belongs)
      narrativeAtom.setMorphProgress?.(progress);
      
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
      locked: true 
    }));
    
    BeatBus.emit(EVENTS.MEMORY_FRAGMENT_START, fragment);
  }

  resumeFromFragment() {
    const snapshot = this.snapshots.find(s => s.label === 'fragment');
    if (snapshot) this.restoreSnapshot(snapshot);
    BeatBus.emit(EVENTS.MEMORY_FRAGMENT_END);
  }

  transitionStage(from, to) {
    stageAtom.setState?.({ currentStage: to, transitioning: true });
    narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
    BeatBus.emit(EVENTS.STAGE_TRANSITION, { from, to });
  }

  createSnapshot(label) {
    this.snapshots.push({
      label,
      timestamp: Date.now(),
      state: {
        stage: stageAtom.getState?.(),
        narrative: narrativeAtom.getState?.(),
        quality: qualityAtom.getState?.(),
        interaction: interactionAtom.getState?.()
      }
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
}

const stateCommands = new StateCommands();
export default stateCommands;

if (import.meta.env.DEV) {
  window.StateCommands = stateCommands;
}
