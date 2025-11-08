// Canonical morph progress dispatcher – routes all external requests through the engine.
// Ensures ConsciousnessEngine is the single BeatBus emitter for MORPH_PROGRESS.

const DEV =
  typeof import.meta !== 'undefined' &&
  Boolean(import.meta?.env?.DEV || import.meta?.env?.MODE !== 'production');

function getEngine() {
  if (typeof window === 'undefined') return null;
  return window.__consciousnessEngine || null;
}

/**
 * Request a morph progress emission through the engine.
 * Value will be clamped inside the engine method.
 */
export function requestMorphProgressEmit(value, meta = {}) {
  const engine = getEngine();
  if (engine?.emitMorphProgressFromSource) {
    engine.emitMorphProgressFromSource(value, meta);
    return true;
  }
  if (DEV) {
    console.warn('[MorphProgressChannel] Engine not ready, morph emit dropped', {
      value,
      meta,
    });
  }
  return false;
}

export default requestMorphProgressEmit;
