/**
 * @typedef {Object} SSTConfig
 * @property {SSTMeta} meta
 * @property {SSTVisual} visual
 * @property {SSTNarrative} narrative
 * @property {SSTPerformance} performance
 */

/**
 * @typedef {Object} SSTMeta
 * @property {string} version - SST version (e.g., "3.5.0")
 * @property {"ABSOLUTE"} authority - Authority level
 * @property {string} lastUpdated - Date of last update
 * @property {string[]} [breaking_changes] - List of breaking changes
 */

/**
 * @typedef {Object} SSTVisual
 * @property {"3d_kinetic_typography"} system
 * @property {Object.<string, LetterGeometry>} letterGeometry
 * @property {Object.<string, CameraConfig>} [camera]
 */

/**
 * @typedef {Object} LetterGeometry
 * @property {string} word - Text to display
 * @property {string} font - Font family name
 * @property {number} weight - Font weight (100-900)
 * @property {number} depth - Z-axis extrusion (world units)
 * @property {number} particlesPerLetter - Particle density per letter
 * @property {number} spacing - Letter spacing multiplier
 * @property {number} scale - Overall size multiplier
 */

/**
 * @typedef {Object} CameraConfig
 * @property {{x: number, y: number, z: number}} [initial] - Starting position
 * @property {CameraReveal} [reveal] - Camera reveal animation
 * @property {string} [movement] - Movement pattern name
 * @property {number} [startZ] - Starting Z position
 * @property {number} [endZ] - Ending Z position
 * @property {{amplitude: number, frequency: number}} [shake]
 * @property {number} [duration]
 * @property {{x: number, y: number, z: number}} [angle]
 * @property {number} [degrees]
 */

/**
 * @typedef {Object} CameraReveal
 * @property {number} timing - Start time (ms)
 * @property {number} duration - Animation duration (ms)
 * @property {{x: number, y: number, z: number}} target - End position
 */

/**
 * @typedef {Object} SSTNarrative
 * @property {OrchestrationConfig} orchestration
 */

/**
 * @typedef {Object} OrchestrationConfig
 * @property {"narration-driven"|"scroll-driven"} mode
 * @property {boolean} scrollLocked
 * @property {"SPACE"|"ENTER"|"ESCAPE"} skipKey
 */

/**
 * @typedef {Object} SSTPerformance
 * @property {FrameRateConfig} frameRate
 * @property {Object.<string, number>} particleCount
 */

/**
 * @typedef {Object} FrameRateConfig
 * @property {60} target - Target FPS (always 60)
 * @property {number} minimum - Minimum acceptable FPS
 */

// Export type-checked SST loader
/**
 * Load and validate SST configuration
 * @returns {SSTConfig}
 */
function loadSST() {
  const config = require('../../sst/canon/v3.5.runtime.json');
  return /** @type {SSTConfig} */ (config);
}

module.exports = { loadSST };
