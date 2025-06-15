// src/utils/narrative/stageMappingUtils.js
// CANONICAL STAGES CONFIGURATION - Single source of truth
// All stage mappings, colors, and behaviors derive from this array

/**
 * CANONICAL STAGES ARRAY - Single source of truth for all stage-related data
 * Eliminates duplication, prevents drift when renaming or adding stages
 */
const CANONICAL_STAGES = [
  {
    name: 'genesis',
    index: 0,
    particles: 2000,
    colors: ['#1a1a2e', '#16213e', '#0f4c75'], // Deep blues
    mood: 'terminal-boot',
    description: 'Genesis - Terminal awakening',
    keyboardShortcut: '0',
  },
  {
    name: 'awakening',
    index: 1,
    particles: 4000,
    colors: ['#ff6b35', '#f7931e', '#ffd23f'], // Amber/gold C64 retro
    mood: 'chaos-to-order',
    description: 'Awakening - Chaos becomes order',
    keyboardShortcut: '1',
  },
  {
    name: 'structure',
    index: 2,
    particles: 6000,
    colors: ['#006a4e', '#228b22', '#32cd32'], // Marine green/digital camo
    mood: 'grid-formation',
    description: 'Structure - Memory fragments emerge',
    keyboardShortcut: '2',
  },
  {
    name: 'learning',
    index: 3,
    particles: 8000,
    colors: ['#00bfff', '#1e90ff', '#4169e1'], // Electric blue/cyan
    mood: 'neural-patterns',
    description: 'Learning - MetaCurtis awakening',
    keyboardShortcut: '3',
  },
  {
    name: 'building',
    index: 4,
    particles: 12000,
    colors: ['#8a2be2', '#9932cc', '#ba55d3'], // Purple/violet harmony
    mood: 'system-construction',
    description: 'Building - Architecture choreography',
    keyboardShortcut: '4',
  },
  {
    name: 'mastery',
    index: 5,
    particles: 16000,
    colors: ['#ffd700', '#ff69b4', '#00ced1'], // Gold/rainbow transcendence
    mood: 'fractal-consciousness',
    description: 'Mastery - Digital consciousness achieved',
    keyboardShortcut: '5',
  },
];

/**
 * DERIVED MAPPINGS - Generated from canonical array (prevents duplication)
 */
const stageToIndex = Object.fromEntries(CANONICAL_STAGES.map(stage => [stage.name, stage.index]));

const indexToStage = Object.fromEntries(CANONICAL_STAGES.map(stage => [stage.index, stage.name]));

const stageNames = CANONICAL_STAGES.map(stage => stage.name);

const keyboardShortcuts = Object.fromEntries(
  CANONICAL_STAGES.map(stage => [stage.keyboardShortcut, stage.name])
);

/**
 * Maps narrative stage strings to numeric values for shader uniforms
 * @param {string} stageName - Stage name from performanceStore.narrative.currentStage
 * @returns {number} - Numeric stage (0-5) for shader uniforms
 */
export const mapStageToNumeric = stageName => {
  const numericStage = stageToIndex[stageName];

  if (numericStage === undefined) {
    console.warn(`[StageMappingUtils] Unknown stage "${stageName}", defaulting to 0`);
    return 0;
  }

  return numericStage;
};

/**
 * Maps numeric stage back to primary stage name
 * @param {number} numericStage - Numeric stage (0-5)
 * @returns {string} - Primary stage name
 */
export const mapNumericToStage = numericStage => {
  const clampedStage = Math.floor(Math.max(0, Math.min(CANONICAL_STAGES.length - 1, numericStage)));
  return indexToStage[clampedStage] || 'genesis';
};

/**
 * Get complete stage configuration by name or index
 * @param {string|number} stage - Stage name or numeric index
 * @param {number} scrollProgress - Current scroll progress (0-1)
 * @returns {object} - Complete stage configuration
 */
export const getStageParticleConfig = (stage, scrollProgress = 0) => {
  const stageData =
    typeof stage === 'string'
      ? CANONICAL_STAGES.find(s => s.name === stage)
      : CANONICAL_STAGES[Math.floor(Math.max(0, Math.min(CANONICAL_STAGES.length - 1, stage)))];

  if (!stageData) {
    console.warn(`[StageMappingUtils] Invalid stage: ${stage}, using genesis`);
    return { ...CANONICAL_STAGES[0], scrollProgress, stageProgress: 0 };
  }

  return {
    numericStage: stageData.index,
    stageName: stageData.name,
    scrollProgress,
    stageProgress: (scrollProgress * CANONICAL_STAGES.length) % 1,
    ...stageData,
  };
};

/**
 * Get all stage names (for iteration, UI, etc.)
 * @returns {string[]} - Array of stage names
 */
export const getAllStageNames = () => stageNames;

/**
 * Get keyboard shortcut mappings
 * @returns {object} - Keyboard key to stage name mapping
 */
export const getKeyboardShortcuts = () => keyboardShortcuts;

/**
 * Get next stage name
 * @param {string} currentStage - Current stage name
 * @returns {string} - Next stage name (cycles to first)
 */
export const getNextStage = currentStage => {
  const currentIndex = stageToIndex[currentStage] ?? 0;
  const nextIndex = (currentIndex + 1) % CANONICAL_STAGES.length;
  return indexToStage[nextIndex];
};

/**
 * Get previous stage name
 * @param {string} currentStage - Current stage name
 * @returns {string} - Previous stage name (cycles to last)
 */
export const getPrevStage = currentStage => {
  const currentIndex = stageToIndex[currentStage] ?? 0;
  const prevIndex = currentIndex === 0 ? CANONICAL_STAGES.length - 1 : currentIndex - 1;
  return indexToStage[prevIndex];
};

/**
 * Debug utility - get complete stage information
 * @returns {object} - Complete stage mapping info
 */
export const getStageDebugInfo = () => {
  return {
    canonicalStages: CANONICAL_STAGES,
    stageToIndex,
    indexToStage,
    stageNames,
    keyboardShortcuts,
    totalStages: CANONICAL_STAGES.length,
  };
};

// ✅ EXPORT CANONICAL STAGES CONSTANT
export { CANONICAL_STAGES };
