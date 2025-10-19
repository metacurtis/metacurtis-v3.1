// src/bootstrap/wireSSTv3.js
// Central wiring layer for SST v3.0 engine components - ATOMIC VERSION

import { narrativeController } from '@/engine/NarrativeController.js';
import { memoryFragmentController } from '@/engine/MemoryFragmentController.js';
import { narrativeAtom } from '@/state/atoms/narrativeAtom.js';

// Only import atoms that exist
let stageAtom, qualityAtom;
try {
  stageAtom = require('@/state/atoms/stageAtom.js').stageAtom;
} catch (e) {
  console.warn('stageAtom not available');
}

try {
  qualityAtom = require('@/state/atoms/qualityAtom.js').qualityAtom;
} catch (e) {
  console.warn('qualityAtom not available');
}

export function wireSSTv3() {
  console.log('🔌 wireSSTv3: Initializing atomic event wiring...');

  const unsubscribers = [];

  // Forward narrative controller events to window
  if (narrativeController && narrativeController.on) {
    narrativeController.on('particleCue', event => {
      window.dispatchEvent(
        new CustomEvent('sst:particleCue', {
          detail: event,
        })
      );
    });
  }

  if (memoryFragmentController && memoryFragmentController.on) {
    memoryFragmentController.on('tierHighlightUpdate', event => {
      window.dispatchEvent(
        new CustomEvent('sst:tierHighlight', {
          detail: event,
        })
      );
    });
  }

  // Subscribe to atomic stores if they exist
  if (stageAtom) {
    const unsubscribeStage = stageAtom.subscribe(state => {
      window.dispatchEvent(
        new CustomEvent('sst:stageChange', {
          detail: {
            stage: state.currentStage,
            progress: state.progress,
            isTransitioning: state.isTransitioning,
          },
        })
      );
    });
    unsubscribers.push(unsubscribeStage);
  }

  if (qualityAtom) {
    const unsubscribeQuality = qualityAtom.subscribe(state => {
      window.dispatchEvent(
        new CustomEvent('sst:qualityChange', {
          detail: {
            tier: state.currentTier,
            particleBudget: state.particleBudget,
            dpr: state.dpr,
          },
        })
      );
    });
    unsubscribers.push(unsubscribeQuality);
  }

  // Always subscribe to narrative atom (DISABLED)
  console.log('🔗 [WIRESSST] narrativeAtom bridge DISABLED - using UnifiedNavigationAPI');

  /*
  const unsubscribeNarrative = narrativeAtom.subscribe(state => {
    console.log('🔗 [WIRESSST BRIDGE - DISABLED]', {
      event: 'narrativeAtom → stageAtom sync',
      newStage: state.currentStage,
      note: 'This bridge is disabled. Use window.unifiedNav instead.',
      timestamp: performance.now(),
    });

    // If stageAtom exists, sync with it
    if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
      // DISABLED: This bypasses orchestration
      // stageAtom.jumpToStage(state.currentStage);
    }
  });
  unsubscribers.push(unsubscribeNarrative);
  */

  // Cleanup function
  const cleanup = () => {
    unsubscribers.forEach(unsub => unsub());
  };

  console.log('✅ wireSSTv3: Atomic event wiring complete');

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
    console.log('🔌 wireSSTv3: Unwired all connections');
  }
}
