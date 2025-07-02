// src/config/narrativeStageOrder.js
// 🎯 MC3V CANONICAL STAGE ORDER - SINGLE SOURCE OF TRUTH
// All systems MUST use this array for stage definitions

/**
 * ✅ CANONICAL MC3V DIGITAL AWAKENING STAGE ORDER
 * This is the ONLY place where stage order is defined.
 * All other systems must import and use this array.
 */
export const MC3V_STAGE_ORDER = [
  'genesis', // 0: Age 8, Commodore 64 spark (1983)
  'silent', // 1: Marine Corps discipline years (1983-2022)
  'awakening', // 2: AI partnership begins (2022)
  'acceleration', // 3: Rapid development phase (Feb 2025)
  'transcendence', // 4: GLSL mastery achieved (Mar 2025)
];

/**
 * ✅ STAGE METADATA (derived from canonical order)
 */
export const STAGE_METADATA = {
  totalStages: MC3V_STAGE_ORDER.length,
  firstStage: MC3V_STAGE_ORDER[0],
  lastStage: MC3V_STAGE_ORDER[MC3V_STAGE_ORDER.length - 1],

  // UI labels for navigation
  stageLabels: {
    genesis: '1983',
    silent: '1983-2022',
    awakening: '2022',
    acceleration: 'Feb 2025',
    transcendence: 'Mar 2025',
  },

  // Auto-advance timing per stage
  autoAdvanceTiming: {
    genesis: 8000, // 8 seconds - terminal boot sequence
    silent: 6000, // 6 seconds - discipline phase
    awakening: 10000, // 10 seconds - AI partnership emergence
    acceleration: 8000, // 8 seconds - rapid development showcase
    transcendence: 12000, // 12 seconds - GLSL mastery demonstration
  },

  // Progress mapping (0-1 range per stage)
  getStageProgress: stageIndex => stageIndex / (MC3V_STAGE_ORDER.length - 1),
};

/**
 * ✅ STANDARDIZED MAPPING UTILITIES
 * Use these everywhere for consistent string↔numeric conversion
 */
export const stageUtils = {
  // String stage name → numeric index
  stageToIndex: stageName => {
    const index = MC3V_STAGE_ORDER.indexOf(stageName);
    if (index === -1) {
      console.warn(`[MC3V] Unknown stage name: "${stageName}". Defaulting to 0.`);
      return 0;
    }
    return index;
  },

  // Numeric index → string stage name
  indexToStage: index => {
    if (index < 0 || index >= MC3V_STAGE_ORDER.length) {
      console.warn(`[MC3V] Invalid stage index: ${index}. Defaulting to "${MC3V_STAGE_ORDER[0]}".`);
      return MC3V_STAGE_ORDER[0];
    }
    return MC3V_STAGE_ORDER[index];
  },

  // Get next stage in sequence
  getNextStage: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    const nextIndex = Math.min(currentIndex + 1, MC3V_STAGE_ORDER.length - 1);
    return MC3V_STAGE_ORDER[nextIndex];
  },

  // Get previous stage in sequence
  getPrevStage: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    const prevIndex = Math.max(currentIndex - 1, 0);
    return MC3V_STAGE_ORDER[prevIndex];
  },

  // Check if stage exists
  isValidStage: stageName => {
    return MC3V_STAGE_ORDER.includes(stageName);
  },

  // Check if navigation is possible
  canAdvance: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    return currentIndex < MC3V_STAGE_ORDER.length - 1;
  },

  canGoBack: currentStage => {
    const currentIndex = stageUtils.stageToIndex(currentStage);
    return currentIndex > 0;
  },

  // Get stage info for UI
  getStageInfo: stageName => {
    const index = stageUtils.stageToIndex(stageName);
    return {
      name: stageName,
      index,
      label: STAGE_METADATA.stageLabels[stageName] || stageName,
      autoAdvanceTime: STAGE_METADATA.autoAdvanceTiming[stageName] || 5000,
      progress: STAGE_METADATA.getStageProgress(index),
      isFirst: index === 0,
      isLast: index === MC3V_STAGE_ORDER.length - 1,
      canAdvance: stageUtils.canAdvance(stageName),
      canGoBack: stageUtils.canGoBack(stageName),
    };
  },

  // Get all stages info for UI components
  getAllStagesInfo: () => {
    return MC3V_STAGE_ORDER.map(stage => stageUtils.getStageInfo(stage));
  },
};

/**
 * ✅ DEVELOPMENT INTEGRITY CHECK
 * Validates that all systems are using the same stage definitions
 */
export const validateStageIntegrity = (narrativePresets = {}) => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'development') return true;

  console.log('🔍 MC3V Stage Integrity Check...');

  const configStages = Object.keys(narrativePresets);
  let isValid = true;

  // Check if all canonical stages exist in config
  MC3V_STAGE_ORDER.forEach(stage => {
    if (!configStages.includes(stage)) {
      console.warn(
        `❌ [MC3V] Stage "${stage}" is in canonical order but missing in NARRATIVE_PRESETS.`
      );
      isValid = false;
    }
  });

  // Check if config has extra stages not in canonical order
  configStages.forEach(stage => {
    if (!MC3V_STAGE_ORDER.includes(stage)) {
      console.warn(
        `⚠️ [MC3V] Stage "${stage}" is in NARRATIVE_PRESETS but not in canonical order.`
      );
    }
  });

  if (isValid) {
    console.log('✅ MC3V Stage Integrity: All systems aligned');
  } else {
    console.error('❌ MC3V Stage Integrity: Mismatches detected - fix required');
  }

  return isValid;
};

// Export default for convenience
export default {
  MC3V_STAGE_ORDER,
  STAGE_METADATA,
  stageUtils,
  validateStageIntegrity,
};
