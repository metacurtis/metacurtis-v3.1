// src/config/canonical/canonicalAuthority.js
// CANONICAL AUTHORITY - SST v3.0 Unified Access Point

import {
  SST_V3_CONFIG,
  getStageByName,
  getStageByScroll,
  isFeatureEnabled
} from '../sst3/sst-v3.0-config.js';

import {
  TIER_BEHAVIORS,
  TIER_BEHAVIOR_SETS,
  applyBehavior,
  getBehaviorUniforms,
  STAGE_BEHAVIOR_OVERRIDES,
  FUSION_BEHAVIORS
} from '../sst3/tier-behaviors.js';

import {
  NARRATIVE_DIALOGUE,
  getDialogueSegment,
  getParticleCuesForStage
} from '../sst3/narrative-dialogue.js';

import {
  MEMORY_FRAGMENTS,
  FRAGMENT_INTERACTIONS,
  getFragmentsForStage,
  getActiveFragments
} from '../sst3/memory-fragments.js';

const Canonical = {
  // Version info
  version: '3.0.0',
  authority: 'ABSOLUTE',

  // Core configuration
  stages: SST_V3_CONFIG.stages,
  stageOrder: Object.keys(SST_V3_CONFIG.stages),
  performance: SST_V3_CONFIG.performance,
  features: SST_V3_CONFIG.features,
  tierSystem: SST_V3_CONFIG.tierSystem,

  // Stage access methods
  getStageByName,
  getStageByScroll,
  getStageByIndex: (index) => {
    const stageName = Object.keys(SST_V3_CONFIG.stages)[index];
    return SST_V3_CONFIG.stages[stageName];
  },

  // Tier behaviors
  behaviors: {
    definitions: TIER_BEHAVIORS,
    sets: TIER_BEHAVIOR_SETS,
    apply: applyBehavior,
    getUniforms: getBehaviorUniforms,
    overrides: STAGE_BEHAVIOR_OVERRIDES,
    fusion: FUSION_BEHAVIORS
  },

  // Narrative system
  dialogue: NARRATIVE_DIALOGUE,
  getDialogueSegment,
  getParticleCuesForStage,

  // Memory fragments
  fragments: MEMORY_FRAGMENTS,
  fragmentInteractions: FRAGMENT_INTERACTIONS,
  getFragmentsForStage,
  getActiveFragments,

  // Feature flags
  isFeatureEnabled,

  // System constants
  SYSTEM_CONSTANTS: {
    TOTAL_STAGES: 7,
    MIN_STAGE_INDEX: 0,
    MAX_STAGE_INDEX: 6,
    OPERATIONAL_PARTICLES: 15000,
    SHOWCASE_PARTICLES: 17000,
    TARGET_FPS: 60,
    LIGHTHOUSE_TARGET: 90
  }
};

// DEV exposure
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.CANONICAL = Canonical;
  console.log(`📋 SST v${Canonical.version} Canonical Authority loaded`);
}

export { Canonical };
export default Canonical;
