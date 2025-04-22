// src/shaders/shaderUtils.js

/**
 * Emit only valid GLSL defines for each quality tier.
 */
export function wrapQualityDefines(level) {
  return {
    QUALITY_ULTRA: level === 'ultra' ? 1 : 0,
    QUALITY_HIGH: level === 'high' ? 1 : 0,
    QUALITY_MEDIUM: level === 'medium' ? 1 : 0,
    QUALITY_LOW: level === 'low' ? 1 : 0,
  };
}

/**
 * No-op chunk injector. If you split GLSL across files, you can
 * implement actual text‑injection here; otherwise, just return src.
 */
export function includeChunk(src, _chunkName) {
  return src;
}
