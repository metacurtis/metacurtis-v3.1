// src/bootstrap/integrateUnifiedTimeline.js
// Wire the unified timeline system into the app

import { stageClock } from '@/core/CentralStageClock';
import { beatBus, Events } from '@/orchestration/BeatBus';
import { stageAtom } from '@/stores/atoms/stageAtom';
import ShaderUniformController from '@/orchestration/ShaderUniformController';

export function integrateUnifiedTimeline() {
  console.log('🎬 Integrating Unified Timeline System...');

  // Connect stage atom to clock
  const unsubStage = stageAtom.subscribe((state) => {
    if (state.currentStage !== stageClock.currentStage) {
      stageClock.start(state.currentStage);
      beatBus.emit(Events.STAGE_CHANGE, { 
        stage: state.currentStage,
        previousStage: stageClock.currentStage 
      });
    }
  });

  // Initialize shader controller (will be connected when material is ready)
  let shaderController = null;
  
  window.initShaderController = (getMaterial) => {
    if (shaderController) {
      shaderController.dispose();
    }
    shaderController = new ShaderUniformController(getMaterial);
    console.log('✅ Shader controller initialized');
  };

  // Handle fragment triggers
  beatBus.on(Events.FRAGMENT_TRIGGER, ({ id, segment }) => {
    console.log(`💎 Fragment triggered: ${id} from segment ${segment}`);
    // This will be picked up by the memory fragment system
    window.dispatchEvent(new CustomEvent('memoryFragment:trigger', {
      detail: { fragmentId: id, source: 'timeline' }
    }));
  });

  // Performance monitoring
  beatBus.on(Events.FPS_WARNING, ({ fps }) => {
    console.warn(`⚠️ Performance warning: ${fps} FPS`);
  });

  // Start with genesis
  stageClock.start('genesis');

  // Cleanup function
  return () => {
    unsubStage();
    if (shaderController) {
      shaderController.dispose();
    }
    stageClock.dispose();
  };
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  window.integrateUnifiedTimeline = integrateUnifiedTimeline;
}

export default integrateUnifiedTimeline;
