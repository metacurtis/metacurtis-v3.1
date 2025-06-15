// src/config/qualityPresets.js
// ✅ CONTENT INTEGRITY: Fixed default export for proper import compatibility

/**
 * qualityPresets
 *
 * Defines parameter mappings for each quality level.
 * You can adjust these values to tune performance vs. visual fidelity.
 */

export default {
  ultra: {
    // Top‐tier: maximum detail
    dprMin: 1.5, // devicePixelRatio minimum
    dprMax: 2.5, // devicePixelRatio maximum
    antialias: true,
    shaderComplexity: 1.0, // multiplier for loops, subdivisions, noise octaves
    textureResolution: 2048, // max texture size
    geometryDetailScale: 1.0, // scale for detailed geometry/particles
  },
  high: {
    dprMin: 1.2,
    dprMax: 1.8,
    antialias: true,
    shaderComplexity: 0.8,
    textureResolution: 1024,
    geometryDetailScale: 0.8,
  },
  medium: {
    dprMin: 1.0,
    dprMax: 1.2,
    antialias: false,
    shaderComplexity: 0.6,
    textureResolution: 512,
    geometryDetailScale: 0.6,
  },
  low: {
    dprMin: 0.5,
    dprMax: 1.0,
    antialias: false,
    shaderComplexity: 0.4,
    textureResolution: 256,
    geometryDetailScale: 0.4,
  },
};
