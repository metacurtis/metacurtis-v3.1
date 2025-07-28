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
  NARRATIVE_DIALOGUE
} from '../sst3/narrative-dialogue.js';

import {
  MEMORY_FRAGMENTS,
  FRAGMENT_INTERACTIONS,
  getFragmentsForStage,
  getActiveFragments
} from '../sst3/memory-fragments.js';

// --- helper: flatten the authoring schema into the runtime schema ---
function normalizeDialogue(raw) {
  /**
   * Converts:
   *   { genesis: { narration:{ segments:[{timing:{start,duration}, …}] } } }
   *   → { genesis: { segments:[{start,duration,…}] } }
   */
  const out = {};
  for (const [stage, data] of Object.entries(raw)) {
    const segs = data?.narration?.segments ?? [];
    out[stage] = {
      id: data.id,
      segments: segs.map((s) => ({
        id: s.id,
        text: s.text,
        note: s.note,
        start: s.timing?.start ?? 0,
        duration: s.timing?.duration ?? 0,
        memoryTrigger: s.memoryFragmentTrigger,
        particleCue: s.particleCue
      }))
    };
  }
  return out;
}

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

  // Narrative system (runtime‑ready)
  dialogue: normalizeDialogue(NARRATIVE_DIALOGUE),

  // Keep helper signatures but read from normalized data
  getDialogueSegment(stage, id) {
    const segArr = this.dialogue?.[stage]?.segments ?? [];
    return segArr.find((s) => s.id === id) ?? null;
  },
  getParticleCuesForStage(stage) {
    const segArr = this.dialogue?.[stage]?.segments ?? [];
    return segArr
      .filter((s) => s.particleCue)
      .map((s) => ({
        timing: s.start,
        cue: s.particleCue,
        segmentId: s.id
      }));
  },

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

// Improvements:
// - Consider memoizing the output of normalizeDialogue to avoid re-processing on every module import.
// - Add input validation within normalizeDialogue to handle unexpected schema shapes gracefully.
// - Document the expected structure of NARRATIVE_DIALOGUE in a TypeScript declaration or JSDoc for better IDE support.
// - Evaluate lazy-loading of memory fragments if the fragment list is large to improve initial load performance.
// - Introduce unit tests for normalizeDialogue to ensure edge cases are covered.
