// src/bootstrap/integrateV3Systems.js
// Wire SST v3.0 systems into existing app

import { SST_V3_CONFIG } from '@/config/sst3/sst-v3.0-config.js';
import { NARRATIVE_DIALOGUE } from '@/config/sst3/narrative-dialogue.js';
import { MEMORY_FRAGMENTS } from '@/config/sst3/memory-fragments.js';
import { consciousnessEngine } from '@/engine/ConsciousnessEngine.js';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';

export function integrateV3Systems() {
  console.log('🚀 Integrating SST v3.0 systems...');

  // Verify all modules loaded
  if (!SST_V3_CONFIG) {
    console.error('❌ SST_V3_CONFIG not found');
    return false;
  }

  if (!NARRATIVE_DIALOGUE) {
    console.error('❌ NARRATIVE_DIALOGUE not found');
    return false;
  }

  if (!MEMORY_FRAGMENTS) {
    console.error('❌ MEMORY_FRAGMENTS not found');
    return false;
  }

  // Initialize stage atom with first stage
  const firstStage = Object.keys(SST_V3_CONFIG.stages)[0];
  stageAtom.jumpToStage(firstStage);

  // Set quality based on device
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  qualityAtom.setTier(isMobile ? 'MEDIUM' : 'HIGH');

  // Expose for debugging
  if (import.meta.env.DEV) {
    window.SST_V3 = {
      config: SST_V3_CONFIG,
      narrative: NARRATIVE_DIALOGUE,
      fragments: MEMORY_FRAGMENTS,
      engine: consciousnessEngine,
      stage: stageAtom,
      quality: qualityAtom,
    };
  }

  console.log('✅ SST v3.0 systems integrated');
  return true;
}
