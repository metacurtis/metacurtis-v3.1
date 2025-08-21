// @doctor:4b-disposers
const __doctorDisposers = []; // src/utils/shaderUtils.js
/**
 * Emit only valid GLSL defines for each quality tier.
 * Ensures case-insensitive comparison for the level string.
 */
export function wrapQualityDefines(levelString) {
  // levelString will be 'ULTRA', 'HIGH', etc.
  if (typeof levelString !== 'string') {
    console.warn('wrapQualityDefines: received non-string level', levelString);
    // Default to lowest quality if level is invalid, to prevent shader errors
    return {
      QUALITY_ULTRA: 0,
      QUALITY_HIGH: 0,
      QUALITY_MEDIUM: 0,
      QUALITY_LOW: 1 // Default to LOW if level is unknown
    };
  }
  const level = levelString.toUpperCase(); // Normalize to uppercase for comparison
  return {
    QUALITY_ULTRA: level === 'ULTRA' ? 1 : 0,
    QUALITY_HIGH: level === 'HIGH' ? 1 : 0,
    QUALITY_MEDIUM: level === 'MEDIUM' ? 1 : 0,
    QUALITY_LOW: level === 'LOW' ? 1 : 0
  };
}

/**
 * No-op chunk injector. If you split GLSL across files, you can
 * implement actual text‑injection here; otherwise, just return src.
 */
export function includeChunk(src, _chunkName) {
  return src;
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}