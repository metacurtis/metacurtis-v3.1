#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function generateJSDocTypes() {
  const sstPath = path.resolve('sst/canon/v3.5.json');
  const sst = JSON.parse(fs.readFileSync(sstPath, 'utf8'));

  ensureDir('src/types');

  const output = `
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
  // eslint-disable-next-line global-require
  const config = require('../canon/v3.5.json');
  return /** @type {SSTConfig} */ (config);
}

module.exports = { loadSST };
`;

  fs.writeFileSync('src/types/sst-types.js', output.trimStart());
  console.log('✅ Generated JSDoc types: src/types/sst-types.js');

  const example = `
// Example: Using SST with JSDoc type checking

const { loadSST } = require('../types/sst-types');

/** @type {import('../types/sst-types').SSTConfig} */
const SST = loadSST();

// IDE autocomplete examples
console.log(SST.visual.letterGeometry.genesis.word);
console.log(SST.performance.frameRate.target);

const genesisConfig = SST.visual.letterGeometry.genesis;
console.log(\`Genesis: "\${genesisConfig.word}" with \${genesisConfig.particlesPerLetter} particles/letter\`);

module.exports = SST;
`;

  ensureDir('src/config');
  fs.writeFileSync('src/config/sst-loader.js', example.trimStart());
  console.log('✅ Created example loader: src/config/sst-loader.js');
}

generateJSDocTypes();
