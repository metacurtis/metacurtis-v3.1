// src/shaders/shaderUtils.js

// Import any reusable GLSL chunks here (adjust paths as needed)
import noiseChunk from '@/components/webgl/shaders/noise.glsl';

/**
 * Map of chunk names → GLSL source.
 * Add more entries as you split out additional .glsl snippets.
 */
const GLSL_CHUNKS = {
  'noise.glsl': noiseChunk,
  // 'lighting.glsl': lightingChunk,
  // 'easing.glsl': easingChunk,
};

/**
 * includeChunk(name)
 *
 * Returns the GLSL text for a given chunk filename,
 * or an empty string if not found.
 */
export function includeChunk(name) {
  return GLSL_CHUNKS[name] || '';
}

/**
 * wrapQualityDefines(level, source)
 *
 * Prefixes your GLSL source with a single `#define QUALITY_*`
 * based on the `level` string ("ultra", "high", "medium", "low").
 */
export function wrapQualityDefines(level, source) {
  let define = '';
  switch (level) {
    case 'ultra':
      define = '#define QUALITY_ULTRA';
      break;
    case 'high':
      define = '#define QUALITY_HIGH';
      break;
    case 'medium':
      define = '#define QUALITY_MEDIUM';
      break;
    case 'low':
    default:
      define = '#define QUALITY_LOW';
      break;
  }
  return `${define}\n${source}`;
}
