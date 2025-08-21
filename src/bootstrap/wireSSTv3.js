// src/bootstrap/wireSSTv3.js
// Central wiring layer for SST v3.0 engine components - ATOMIC VERSION

import { narrativeController } from '@/engine/NarrativeController.js';
import { memoryFragmentController } from '@/engine/MemoryFragmentController.js';
import { narrativeAtom } from '@/stores/atoms/narrativeAtom.js';

// Only import atoms that exist
// @doctor:4b-disposers
const __doctorDisposers = [];let stageAtom, qualityAtom;
// @doctor:phase4b-hmr-dbdff18d - Component listener cleanup
const __componentDisposers = [];

// Store original methods if component uses them directly
const __captureUnsub = (unsub) => {
  if (typeof unsub === 'function') {
    __componentDisposers.push(unsub);
  }
  return unsub;
};
try {
  stageAtom = require('@/stores/atoms/stageAtom.js').stageAtom;
} catch (e) {
  console.warn('stageAtom not available');
}

try {
  qualityAtom = require('@/stores/atoms/qualityAtom.js').qualityAtom;
} catch (e) {
  console.warn('qualityAtom not available');
}

export function wireSSTv3() {
  console.log('🔌 wireSSTv3: Initializing atomic event wiring...');

  const unsubscribers = [];

  // Forward narrative controller events to window
  if (narrativeController && narrativeController.on) {// @doctor:4b-handler
    const __doctor_handler_1 = (event) => {
      window.dispatchEvent(
        new CustomEvent('sst:particleCue', {
          detail: event
        })
      );
    }; // @doctor:4b-capture
    const __doctor_unsub_2 = narrativeController.on('particleCue', __doctor_handler_1);__doctorDisposers.push(__doctor_unsub_2);}

  if (memoryFragmentController && memoryFragmentController.on) {// @doctor:4b-handler
    const __doctor_handler_3 = (event) => {
      window.dispatchEvent(
        new CustomEvent('sst:tierHighlight', {
          detail: event
        })
      );
    }; // @doctor:4b-capture
    const __doctor_unsub_4 = memoryFragmentController.on('tierHighlightUpdate', __doctor_handler_3);__doctorDisposers.push(__doctor_unsub_4);}

  // Subscribe to atomic stores if they exist
  if (stageAtom) {
    const unsubscribeStage = stageAtom.subscribe((state) => {
      window.dispatchEvent(
        new CustomEvent('sst:stageChange', {
          detail: {
            stage: state.currentStage,
            progress: state.progress,
            isTransitioning: state.isTransitioning
          }
        })
      );
    });
    unsubscribers.push(unsubscribeStage);
  }

  if (qualityAtom) {
    const unsubscribeQuality = qualityAtom.subscribe((state) => {
      window.dispatchEvent(
        new CustomEvent('sst:qualityChange', {
          detail: {
            tier: state.currentTier,
            particleBudget: state.particleBudget,
            dpr: state.dpr
          }
        })
      );
    });
    unsubscribers.push(unsubscribeQuality);
  }

  // Always subscribe to narrative atom
  const unsubscribeNarrative = narrativeAtom.subscribe((state) => {
    window.dispatchEvent(
      new CustomEvent('sst:narrativeChange', {
        detail: {
          stage: state.currentStage,
          progress: state.globalProgress,
          morphProgress: state.morphProgress
        }
      })
    );

    // If stageAtom exists, sync with it
    if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
      stageAtom.jumpToStage(state.currentStage);
    }
  });
  unsubscribers.push(unsubscribeNarrative);

  // Cleanup function
  const cleanup = () => {
    unsubscribers.forEach((unsub) => unsub());
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


// @doctor:phase4b-hmr-dbdff18d - HMR dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    __componentDisposers.forEach((d) => {
      try {d();} catch (e) {console.warn('Dispose error:', e);}
    });
    __componentDisposers.length = 0;"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});
  });
}

/* TODO: Wrap listener calls with __captureUnsub:
   const unsub = __captureUnsub(bus.on('EVENT', handler));
   Lines with uncaptured listeners: 29, 39
*/